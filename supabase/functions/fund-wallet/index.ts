// Tops up the caller's wallet in one currency by charging a saved card.
//
// Flow: validate → confirm the card belongs to the caller → charge it with an
// off-session PaymentIntent (idempotent on the client's request key) → check
// the PaymentIntent is exactly the one we asked for → credit the wallet
// through public.vortex_credit_wallet_topup (idempotent on the PaymentIntent
// id). If crediting definitely failed after the card was charged, the charge
// is refunded; if the outcome is unknown, it is left for reconciliation.
//
// Disabled unless WALLET_TOPUP_ENABLED=true, so the function can be deployed
// before the owner switches top-ups on (and before checking Stripe is in the
// intended mode).
import Stripe from "npm:stripe@14.18.0";
import { withAuthMiddleware } from "../_shared/middleware.ts";
import { createClient } from "../_shared/supabase-client.ts";
import { creditErrorRolledBack, fromMinorUnits, parseTopupRequest, paymentIntentMatches } from "../_shared/wallet-topup.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2023-10-16" });
const admin = createClient(Deno.env.get("SUPABASE_URL") || "", Deno.env.get("VORTEX_SUPABASE_SECRET_KEY") || "");

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

Deno.serve(withAuthMiddleware(async (req, { auth }) => {
  if (Deno.env.get("WALLET_TOPUP_ENABLED") !== "true") {
    return json({ error: "Wallet top-ups are not available yet" }, 503);
  }
  const userId = auth.userId;
  if (!userId) return json({ error: "Please sign in" }, 401);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request" }, 400);
  }
  const parsed = parseTopupRequest(body);
  if (!parsed.ok) return json({ error: parsed.error }, 400);
  const { amountMinor, currency, paymentMethodId, idempotencyKey } = parsed.value;

  // 1. The card must be one of the caller's saved cards.
  const { data: card, error: cardErr } = await admin
    .from("vortex_payment_methods")
    .select("source_id")
    .eq("user_id", userId)
    .eq("source_id", paymentMethodId)
    .maybeSingle();
  if (cardErr) {
    console.error("[fund-wallet] card lookup failed:", cardErr.message);
    return json({ error: "Could not load your card" }, 500);
  }
  if (!card) return json({ error: "Card not found" }, 404);

  const { data: cust, error: custErr } = await admin
    .from("stripe_customers")
    .select("customer_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (custErr || !cust?.customer_id) {
    console.error("[fund-wallet] no Stripe customer for user", userId, custErr?.message);
    return json({ error: "Card not found" }, 404);
  }
  const customerId = cust.customer_id as string;

  // 2. Charge. The idempotency key makes a retried request return the same
  //    PaymentIntent instead of charging again.
  let pi: Stripe.PaymentIntent;
  try {
    pi = await stripe.paymentIntents.create(
      {
        amount: amountMinor,
        currency: currency.toLowerCase(),
        customer: customerId,
        payment_method: paymentMethodId,
        off_session: true,
        confirm: true,
        description: `VortexCore wallet top-up (${currency})`,
        metadata: { user_id: userId, purpose: "wallet_topup", currency },
      },
      { idempotencyKey: `wallet_topup:${userId}:${idempotencyKey}` },
    );
  } catch (err) {
    const e = err as { type?: string; code?: string; message?: string };
    if (e.type === "StripeCardError") {
      const message = e.code === "authentication_required"
        ? "Your bank needs to confirm this payment. Please use a different card."
        : "Your card was declined.";
      return json({ error: message, code: e.code }, 402);
    }
    if (e.type === "StripeIdempotencyError") {
      return json({ error: "This request was already used with different details. Please try again." }, 409);
    }
    console.error("[fund-wallet] PaymentIntent create failed:", e.message);
    return json({ error: "Payment could not be started. Please try again." }, 502);
  }

  if (pi.status !== "succeeded") {
    return json({ error: "The payment did not complete.", status: pi.status }, 402);
  }
  // A retried request with the same key returns Stripe's cached PaymentIntent,
  // even if that payment was refunded after an earlier failed credit. Read the
  // charge fresh and never credit a payment that has any refund on it.
  const latest = await stripe.paymentIntents.retrieve(pi.id, { expand: ["latest_charge"] });
  const charge = latest.latest_charge as Stripe.Charge | null;
  if (!charge || charge.refunded || (charge.amount_refunded ?? 0) > 0) {
    return json({ error: "This top-up was refunded. Please start a new one.", code: "topup_refunded" }, 409);
  }

  if (!paymentIntentMatches(pi, { amountMinor, currency, customerId, userId })) {
    // Should never happen; do not credit something we did not ask for.
    console.error("[fund-wallet] PaymentIntent mismatch", pi.id);
    return json({ error: "Payment check failed. Please contact support." }, 500);
  }

  // 3. Credit, from the amount Stripe actually received.
  const { data: credit, error: creditErr } = await admin.rpc("vortex_credit_wallet_topup", {
    p_user_id: userId,
    p_amount: fromMinorUnits(pi.amount_received, currency),
    p_currency: currency,
    p_payment_intent_id: pi.id,
  });

  if (creditErr) {
    console.error("[fund-wallet] credit failed after charge", pi.id, creditErr.message);
    // The error may have come back after the credit committed (e.g. a dropped
    // connection). If the ledger row exists, the wallet was credited: do not refund.
    const { data: credited, error: lookupErr } = await admin
      .from("vortex_transactions")
      .select("id, wallet_id")
      .eq("reference", `topup_${pi.id}`)
      .maybeSingle();
    if (lookupErr) {
      // Cannot tell whether the credit committed: do not refund.
      console.error("[fund-wallet] CRITICAL ledger lookup failed, needs reconciliation", pi.id, lookupErr.message);
      return json({ error: "We could not confirm your top-up. Please contact support.", payment_intent: pi.id }, 500);
    }
    if (credited) {
      return json({
        success: true, idempotent: true, wallet_id: credited.wallet_id, transaction_id: credited.id,
        amount: fromMinorUnits(pi.amount_received, currency), currency,
      });
    }
    if (!creditErrorRolledBack(creditErr)) {
      // No database error code (e.g. a dropped connection or timeout): the
      // credit may still commit, so refunding now could pay out twice.
      console.error("[fund-wallet] CRITICAL credit outcome unknown, needs reconciliation", pi.id);
      return json({ error: "We could not confirm your top-up. Please contact support.", payment_intent: pi.id }, 500);
    }
    try {
      await stripe.refunds.create(
        { payment_intent: pi.id, reason: "requested_by_customer", metadata: { reason: "wallet_credit_failed" } },
        { idempotencyKey: `wallet_topup_refund:${pi.id}` },
      );
      return json({ error: "We could not add the money to your wallet, so the charge was refunded.", refunded: true, code: "topup_refunded" }, 500);
    } catch (refundErr) {
      console.error("[fund-wallet] CRITICAL refund failed", pi.id, (refundErr as Error).message);
      return json({ error: "Your card was charged but the wallet was not credited. Please contact support.", payment_intent: pi.id }, 500);
    }
  }

  return json({
    success: true,
    idempotent: credit?.idempotent === true,
    wallet_id: credit?.wallet_id,
    transaction_id: credit?.transaction_id,
    amount: fromMinorUnits(pi.amount_received, currency),
    currency,
    new_balance: credit?.new_balance,
  });
}, ["POST"]));

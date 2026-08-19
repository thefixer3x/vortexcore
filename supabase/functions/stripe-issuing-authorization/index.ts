// Synchronous Stripe Issuing real-time authorization webhook.
//
// This is a DIFFERENT endpoint from supabase/functions/stripe-webhook — Stripe
// only sends issuing_authorization.request here if this function's URL is
// registered as the "respond to authorizations in real time" endpoint under
// Dashboard > Settings > Issuing > Authorizations. That is a manual Dashboard
// step; it is not something an API call can turn on. Stripe requires a
// response within 2 seconds or it falls back to its own timeout decision, so
// this handler does the minimum work needed to make one call: no DB writes
// beyond the read needed to check balance. The actual ledger update happens
// asynchronously in stripe-webhook's issuing_transaction.created handler once
// the authorization actually captures.
import Stripe from "npm:stripe@14.18.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const STRIPE_API_VERSION = "2023-10-16";
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: STRIPE_API_VERSION });
const admin = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
);
const webhookSecret = Deno.env.get("STRIPE_ISSUING_WEBHOOK_SECRET") || "";

const respond = (approved: boolean) =>
  new Response(JSON.stringify({ approved }), {
    status: 200,
    headers: { "Content-Type": "application/json", "Stripe-Version": STRIPE_API_VERSION },
  });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200 });

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  let event: Stripe.Event;
  if (sig && webhookSecret) {
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err) {
      console.error("[stripe-issuing-authorization] sig error:", err instanceof Error ? err.message : err);
      // Fail closed: an unverifiable request never gets funds released.
      return respond(false);
    }
  } else {
    console.error("[stripe-issuing-authorization] missing signature or secret");
    return respond(false);
  }

  if (event.type !== "issuing_authorization.request") {
    // Anything else sent to this endpoint is unexpected; ack without a decision.
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }

  const authorization = event.data.object as Stripe.Issuing.Authorization;

  try {
    const cardId = typeof authorization.card === "string" ? authorization.card : authorization.card?.id;
    const pending = authorization.pending_request;

    if (!cardId || !pending) {
      console.error("[stripe-issuing-authorization] missing card or pending_request", authorization.id);
      return respond(false);
    }

    const { data: virtualCard, error: cardError } = await admin
      .from("virtual_cards")
      .select("user_id, is_locked")
      .eq("card_id", cardId)
      .maybeSingle();

    if (cardError || !virtualCard) {
      console.error("[stripe-issuing-authorization] unknown card:", cardId, cardError?.message);
      return respond(false);
    }

    if (virtualCard.is_locked) {
      return respond(false);
    }

    const { data: wallet, error: walletError } = await admin
      .from("vortex_wallets")
      .select("id, balance, currency, is_locked")
      .eq("user_id", virtualCard.user_id)
      .eq("is_locked", false)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (walletError || !wallet) {
      console.error("[stripe-issuing-authorization] no active wallet for user:", virtualCard.user_id);
      return respond(false);
    }

    const requestedAmount = pending.amount / 100;
    const requestedCurrency = pending.currency?.toLowerCase();
    const walletCurrency = (wallet.currency ?? "").toLowerCase();
    const walletBalance = typeof wallet.balance === "number" ? wallet.balance : Number(wallet.balance ?? 0);

    if (requestedCurrency !== walletCurrency) {
      console.error(
        `[stripe-issuing-authorization] currency mismatch for auth ${authorization.id}: card=${requestedCurrency} wallet=${walletCurrency}`
      );
      return respond(false);
    }

    const approved = requestedAmount > 0 && requestedAmount <= walletBalance;
    console.log(
      `[stripe-issuing-authorization] auth ${authorization.id} user=${virtualCard.user_id} amount=${requestedAmount} balance=${walletBalance} approved=${approved}`
    );

    return respond(approved);
  } catch (err) {
    console.error("[stripe-issuing-authorization] handler error:", err instanceof Error ? err.message : err);
    return respond(false);
  }
});

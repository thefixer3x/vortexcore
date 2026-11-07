import { createClient } from "../_shared/supabase-client.ts";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import Stripe from "npm:stripe@14.18.0";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Use POST" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const admin = createClient(url, Deno.env.get("VORTEX_SUPABASE_SECRET_KEY")!);

  // Authenticate
  const { data: u, error: authErr } = await admin.auth.getUser(
    (req.headers.get("Authorization") ?? "").replace(/^Bearer /, ""),
  );
  if (authErr || !u?.user) return json({ error: "Please sign in" }, 401);

  let body: { amount?: unknown; currency?: unknown; payment_method_id?: unknown; note?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request" }, 400);
  }

  const amount = typeof body.amount === "number" ? body.amount : NaN;
  if (!Number.isFinite(amount) || amount <= 0) return json({ error: "Valid amount is required" }, 400);

  const currency = (typeof body.currency === "string" && body.currency.toUpperCase()) || "USD";
  const paymentMethodId = typeof body.payment_method_id === "string" ? body.payment_method_id : "";
  if (!paymentMethodId) return json({ error: "payment_method_id is required" }, 400);

  const userId = u.user.id;

  // 1. Verify user owns this payment method (in our vault table)
  const { data: pmRow } = await admin
    .from("user_payment_methods")
    .select("source_id")
    .eq("user_id", userId)
    .eq("source_id", paymentMethodId)
    .maybeSingle();

  if (!pmRow) return json({ error: "Payment method not found or unauthorized" }, 404);

  // 2. Charge the payment method via Stripe
  const charge = await stripe.charges.create({
    amount: Math.round(amount * 100), // convert to cents
    currency: currency.toLowerCase(),
    payment_method: paymentMethodId,
    description: `VortexCore wallet top-up: ${amount} ${currency}`,
    metadata: { user_id: userId, note: body.note ?? "" },
    confirm: true,
    capture: true,
  });

  if (charge.status !== "succeeded") {
    return json({ error: "Payment failed: " + (charge.last_payment_error?.message ?? "unknown") }, 402);
  }

  // 3. Atomic credit — idempotent by Stripe charge id.
  //    Writes to app_vortexcore.vortex_transactions (our schema, safe to mutate)
  //    and updates app_vortexcore.vortex_wallets atomically in the same transaction.
  const { data: result, error: creditErr } = await admin
    .rpc("credit_wallet_for_charge", {
      p_user_id: userId,
      p_amount: amount,
      p_currency: currency,
      p_charge_id: charge.id,
      p_type: "deposit",
    });

  if (creditErr) {
    console.error("credit_wallet_for_charge failed:", creditErr);
    // Money is captured in Stripe but wallet not credited — this is a critical failure.
    // We MUST return an error and let Stripe refund if necessary.
    return json({ error: "Failed to credit wallet after successful payment. Please contact support." }, 500);
  }

  // Check for idempotent re-entry (same charge_id was already credited)
  if (result?.idempotent === true) {
    return json({
      success: true,
      idempotent: true,
      charge_id: charge.id,
      amount,
      currency,
      message: result.message,
    });
  }

  return json({
    success: true,
    wallet_id: result?.wallet_id,
    charge_id: charge.id,
    amount,
    currency,
    transaction: result,
  });
});

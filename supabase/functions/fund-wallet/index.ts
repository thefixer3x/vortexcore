import { createClient } from "../_shared/supabase-client.ts";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import Stripe from "npm:stripe@14.18.0";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

  // 1. Verify user owns this payment method
  const { data: pmRow } = await admin
    .from("user_payment_methods")
    .select("stripe_payment_method_id")
    .eq("user_id", userId)
    .eq("stripe_payment_method_id", paymentMethodId)
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

  // 3. Find or create the user's wallet in the target currency
  let { data: wallet } = await admin
    .from("vortex_wallets")
    .select("*")
    .eq("user_id", userId)
    .eq("currency", currency)
    .maybeSingle();

  if (!wallet) {
    const { data: newWallet, error: createErr } = await admin.rpc("vortex_create_wallet", {
      p_user_id: userId,
      p_currency: currency,
    });
    if (createErr) {
      console.error("Failed to create wallet:", createErr);
      return json({ error: "Failed to create wallet" }, 500);
    }
    wallet = newWallet?.[0] ?? newWallet;
    if (!wallet) {
      // Fallback: direct insert if RPC doesn't exist
      const { data: inserted, error: insertErr } = await admin
        .from("vortex_wallets")
        .insert({ user_id: userId, currency, balance: 0 })
        .select()
        .single();
      if (insertErr) return json({ error: "Failed to create wallet" }, 500);
      wallet = inserted;
    }
  }

  // 4. Credit the wallet
  const newBalance = (wallet.balance ?? 0) + amount;
  const { error: updateErr } = await admin
    .from("vortex_wallets")
    .update({ balance: newBalance, updated_at: new Date().toISOString() })
    .eq("id", wallet.id);

  if (updateErr) {
    console.error("Wallet update failed:", updateErr);
    return json({ error: "Failed to credit wallet" }, 500);
  }

  // 5. Record the transaction
  const { error: txErr } = await admin
    .from("vortex_transactions")
    .insert({
      user_id: userId,
      amount,
      currency,
      type: "deposit",
      category: "wallet_fund",
      description: `Wallet funded via ${pmRow.stripe_payment_method_id}`,
      status: "completed",
      metadata: {
        stripe_charge_id: charge.id,
        payment_method_id: paymentMethodId,
        note: body.note ?? "",
        new_balance: newBalance,
      },
      created_at: new Date().toISOString(),
    });

  if (txErr) {
    console.error("Transaction record failed:", txErr);
    // Don't fail the whole flow if logging fails — money is already credited
  }

  return json({
    success: true,
    wallet_id: wallet.id,
    new_balance: newBalance,
    charge_id: charge.id,
    amount,
    currency,
  });
});

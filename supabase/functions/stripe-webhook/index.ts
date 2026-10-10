import { createClient } from "npm:@supabase/supabase-js@2.39.7";
import Stripe from "npm:stripe@14.18.0";
import { PRICE_CATALOG, Tier, entitlementsFor, resolveTier } from "../_shared/subscription-logic.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2023-10-16" });
// Deno has no sync crypto; webhook verification must use the async Web Crypto path.
const cryptoProvider = Stripe.createSubtleCryptoProvider();
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
);
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";

// Tier logic lives in _shared/subscription-logic.ts (catalog + entitlements),
// shared with the check-subscription read path.
function tierRow(userId: string, tier: Tier, isActive: boolean) {
  return {
    user_id: userId,
    ...entitlementsFor(tier, isActive),
    updated_at: new Date().toISOString(),
  };
}

function downgradeTier(userId: string) {
  return supabase.from("user_tiers").upsert(tierRow(userId, "free", false), { onConflict: "user_id" });
}

// Stripe API >= 2025-03-31.basil moved current_period_end from the subscription
// to its items, and the webhook endpoint uses the account default version, so
// event payloads no longer carry it at the top level. Accept either shape.
function toIso(seconds: number | null | undefined): string | null {
  return typeof seconds === "number" && Number.isFinite(seconds)
    ? new Date(seconds * 1000).toISOString()
    : null;
}

function periodEnd(sub: Stripe.Subscription): number | null {
  const top = (sub as unknown as { current_period_end?: number }).current_period_end;
  const item = (sub.items?.data?.[0] as unknown as { current_period_end?: number } | undefined)
    ?.current_period_end;
  return top ?? item ?? null;
}

function priceTier(sub: Stripe.Subscription): { priceId: string | null; tier: Tier } {
  const price = sub.items?.data?.[0]?.price;
  const priceId = price?.id ?? null;
  const tier = resolveTier(priceId, price?.metadata?.tier);
  if (priceId && !PRICE_CATALOG[priceId]) {
    console.warn(`[stripe-webhook] price ${priceId} not in PRICE_CATALOG; resolved tier=${tier} from metadata`);
  }
  return { priceId, tier };
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, stripe-signature",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  let event: Stripe.Event;
  if (sig && webhookSecret) {
    try {
      event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret, undefined, cryptoProvider);
    } catch (err) {
      console.error("[stripe-webhook] sig error:", err instanceof Error ? err.message : err);
      return new Response("Signature verification failed", { status: 400 });
    }
  } else {
    return new Response("No signature or secret", { status: 400 });
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        await handleChange(event.data.object as Stripe.Subscription);
        break;
      }
      case "customer.subscription.deleted": {
        await handleDeletion(event.data.object as Stripe.Subscription);
        break;
      }
      case "invoice.payment_failed": {
        // Handle payment failure - subscription goes past_due
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;
        
        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await handlePaymentFailure(subscription);
        break;
      }
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;

        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await handlePaymentSucceeded(subscription);
        break;
      }
      case "issuing_transaction.created": {
        const transaction = event.data.object as Stripe.Issuing.Transaction;
        await handleIssuingTransaction(transaction);
        break;
      }
    }
    return new Response(JSON.stringify({ ok: true, type: event.type }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[stripe-webhook] handler:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});

async function handleChange(sub: Stripe.Subscription) {
  const { priceId, tier } = priceTier(sub);
  const status = sub.status;

  const { error: e1 } = await supabase.from("stripe_subscriptions").upsert({
    stripe_subscription_id: sub.id,
    customer_id: sub.customer as string,
    status: status,
    price_id: priceId,
    current_period_end: toIso(periodEnd(sub)),
    cancel_at: toIso(sub.cancel_at),
    trial_end: toIso(sub.trial_end),
    updated_at: new Date().toISOString(),
  }, { onConflict: "stripe_subscription_id" });
  if (e1) { console.error("[stripe-webhook] sub upsert:", e1.message); throw e1; }

  const { data: cr } = await supabase
    .from("stripe_customers").select("user_id")
    .eq("customer_id", sub.customer as string).maybeSingle();

  if (cr?.user_id) {
    const isActive = ["active", "trialing"].includes(sub.status);
    const { error: e2 } = await supabase.from("user_tiers")
      .upsert(tierRow(cr.user_id, tier, isActive), { onConflict: "user_id" });
    if (e2) console.error("[stripe-webhook] tier upsert:", e2.message);
  }
}

async function handleDeletion(sub: Stripe.Subscription) {
  await supabase.from("stripe_subscriptions")
    .update({ status: "canceled", updated_at: new Date().toISOString() })
    .eq("stripe_subscription_id", sub.id);

  const { data: cr } = await supabase
    .from("stripe_customers").select("user_id")
    .eq("customer_id", sub.customer as string).maybeSingle();

  if (cr?.user_id) {
    await downgradeTier(cr.user_id);
  }
}

async function handlePaymentFailure(sub: Stripe.Subscription) {
  // Update subscription status to past_due
  await supabase.from("stripe_subscriptions")
    .update({ 
      status: "past_due",
      updated_at: new Date().toISOString()
    })
    .eq("stripe_subscription_id", sub.id);

  // Downgrade tier - user loses premium access
  const { data: cr } = await supabase
    .from("stripe_customers").select("user_id")
    .eq("customer_id", sub.customer as string).maybeSingle();

  if (cr?.user_id) {
    await downgradeTier(cr.user_id);
    console.error(`[stripe-webhook] payment failed for user ${cr.user_id}, downgraded to free`);
  }
}

async function handleIssuingTransaction(transaction: Stripe.Issuing.Transaction) {
  const cardId = typeof transaction.card === "string" ? transaction.card : (transaction.card as { id: string })?.id;
  if (!cardId) {
    console.error("[stripe-webhook] issuing transaction missing card id:", transaction.id);
    return;
  }

  const { data: virtualCard, error: cardError } = await supabase
    .from("virtual_cards")
    .select("user_id")
    .eq("card_id", cardId)
    .maybeSingle();

  if (cardError || !virtualCard) {
    console.error("[stripe-webhook] issuing transaction for unknown card:", cardId, cardError?.message);
    return;
  }

  // Idempotency guard: Stripe can redeliver this event, and reference is
  // unique per stripe transaction id, so a prior successful run means skip.
  const { data: existing } = await supabase
    .from("vortex_transactions")
    .select("id")
    .eq("reference", transaction.id)
    .maybeSingle();
  if (existing) {
    return;
  }

  const { data: wallet, error: walletError } = await supabase
    .from("vortex_wallets")
    .select("id, currency")
    .eq("user_id", virtualCard.user_id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (walletError || !wallet) {
    console.error("[stripe-webhook] no wallet for card user:", virtualCard.user_id, walletError?.message);
    return;
  }

  // `capture` reduces the wallet (money spent); `refund` restores it.
  const amount = transaction.amount / 100;
  const delta = transaction.type === "refund" ? Math.abs(amount) : -Math.abs(amount);

  const { error: rpcError } = await supabase.rpc("adjust_wallet_balance", {
    p_wallet_id: wallet.id,
    p_delta: delta,
  });
  if (rpcError) {
    console.error("[stripe-webhook] failed to adjust wallet balance:", rpcError.message);
    return;
  }

  const { error: insertError } = await supabase.from("vortex_transactions").insert({
    user_id: virtualCard.user_id,
    wallet_id: wallet.id,
    type: "payment",
    status: "completed",
    amount: Math.abs(amount),
    currency: wallet.currency ?? transaction.currency,
    category: "Card Spend",
    reference: transaction.id,
    description: transaction.merchant_data?.name
      ? `Card ${transaction.type === "refund" ? "refund" : "purchase"}: ${transaction.merchant_data.name}`
      : `Card ${transaction.type === "refund" ? "refund" : "purchase"}`,
    completed_at: new Date().toISOString(),
    metadata: {
      action: "card_transaction",
      card_id: cardId,
      stripe_transaction_id: transaction.id,
      transaction_type: transaction.type
    }
  });
  if (insertError) {
    console.error("[stripe-webhook] failed to record card transaction:", insertError.message);
  }
}

async function handlePaymentSucceeded(sub: Stripe.Subscription) {
  const { tier } = priceTier(sub);
  const isActive = ["active", "trialing"].includes(sub.status);

  // Update subscription status to active
  await supabase.from("stripe_subscriptions")
    .update({ 
      status: "active",
      updated_at: new Date().toISOString()
    })
    .eq("stripe_subscription_id", sub.id);

  // Restore premium access
  const { data: cr } = await supabase
    .from("stripe_customers").select("user_id")
    .eq("customer_id", sub.customer as string).maybeSingle();

  if (cr?.user_id) {
    await supabase.from("user_tiers").upsert(tierRow(cr.user_id, tier, isActive), { onConflict: "user_id" });
    console.log(`[stripe-webhook] payment succeeded for user ${cr.user_id}, restored ${tier} access`);
  }
}

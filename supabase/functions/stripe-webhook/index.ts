import { createClient } from "npm:@supabase/supabase-js@2.39.7";
import Stripe from "npm:stripe@14.18.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2023-10-16" });
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
);
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
const PRO_PRICE_ID = Deno.env.get("STRIPE_PRO_PRICE_ID") || "price_1RiSAL2KF4vMCpn8wUyDio3N";
const ENT_PRICE_ID = Deno.env.get("STRIPE_ENT_PRICE_ID") || "price_1RiSAi2KF4vMCpn8B18AAI8v";

function resolveTier(priceId: string | null): string {
  if (priceId === PRO_PRICE_ID) return "pro";
  if (priceId === ENT_PRICE_ID) return "enterprise";
  return "free";
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
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
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
  const priceId = sub.items.data[0]?.price?.id ?? null;

  const { error: e1 } = await supabase.from("stripe_subscriptions").upsert({
    stripe_subscription_id: sub.id,
    customer_id: sub.customer as string,
    status: sub.status,
    price_id: priceId,
    current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
    cancel_at: sub.cancel_at ? new Date(sub.cancel_at * 1000).toISOString() : null,
    updated_at: new Date().toISOString(),
  }, { onConflict: "stripe_subscription_id" });
  if (e1) { console.error("[stripe-webhook] sub upsert:", e1.message); throw e1; }

  const { data: cr } = await supabase
    .from("stripe_customers").select("user_id")
    .eq("customer_id", sub.customer as string).maybeSingle();

  if (cr?.user_id) {
    const tier = resolveTier(priceId);
    const isActive = ["active", "trialing"].includes(sub.status);
    const { error: e2 } = await supabase.from("user_tiers").upsert({
      user_id: cr.user_id,
      tier_name: tier,
      max_queries_per_day: tier === "enterprise" ? 500 : tier === "pro" ? 100 : 10,
      can_use_advanced_models: isActive && tier !== "free",
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
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
    await supabase.from("user_tiers").upsert({
      user_id: cr.user_id,
      tier_name: "free",
      max_queries_per_day: 10,
      can_use_advanced_models: false,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
  }
}

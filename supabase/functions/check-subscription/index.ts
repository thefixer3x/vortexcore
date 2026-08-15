import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { withAuthMiddleware } from "../_shared/middleware.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.7";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
);

const PRO_PRICE_ID = Deno.env.get("STRIPE_PRO_PRICE_ID") || "price_1RiSAL2KF4vMCpn8wUyDio3N";
const ENT_PRICE_ID = Deno.env.get("STRIPE_ENT_PRICE_ID") || "price_1RiSAi2KF4vMCpn8B18AAI8v";

function resolveTier(priceId: string | null): string {
  if (priceId === PRO_PRICE_ID) return "pro";
  if (priceId === ENT_PRICE_ID) return "enterprise";
  return "free";
}

// Map Stripe subscription status to internal status
function mapStatus(stripeStatus: string): "none" | "active" | "trialing" | "past_due" | "canceled" {
  switch (stripeStatus) {
    case "active":
    case "trialing":
      return stripeStatus as "active" | "trialing";
    case "past_due":
      return "past_due";
    case "canceled":
    case "incomplete":
    case "incomplete_expired":
      return "canceled";
    default:
      return "none";
  }
}

serve(withAuthMiddleware(async (_req, { auth }) => {
  const { data: customerRow } = await supabase
    .from("stripe_customers")
    .select("customer_id")
    .eq("user_id", auth.userId)
    .maybeSingle();

  if (!customerRow?.customer_id) {
    return new Response(JSON.stringify({
      subscribed: false,
      status: "none",
      tier: "free",
      currentPeriodEnd: null,
      trialEnd: null,
    }), { headers: { "Content-Type": "application/json" } });
  }

  const { data: sub } = await supabase
    .from("stripe_subscriptions")
    .select("status, price_id, current_period_end, cancel_at, trial_end")
    .eq("customer_id", customerRow.customer_id)
    .eq("status", "active")
    .order("current_period_end", { ascending: false })
    .maybeSingle();

  // Also check for trialing subscriptions
  const { data: trialSub } = await supabase
    .from("stripe_subscriptions")
    .select("status, price_id, current_period_end, cancel_at, trial_end")
    .eq("customer_id", customerRow.customer_id)
    .eq("status", "trialing")
    .order("current_period_end", { ascending: false })
    .maybeSingle();

  const { data: pastDueSub } = await supabase
    .from("stripe_subscriptions")
    .select("status, price_id, current_period_end, cancel_at, trial_end")
    .eq("customer_id", customerRow.customer_id)
    .eq("status", "past_due")
    .order("current_period_end", { ascending: false })
    .maybeSingle();

  // Priority: active > trialing > past_due
  const activeSub = sub || trialSub || pastDueSub;
  const isTrialing = !!trialSub;
  const isPastDue = !!pastDueSub;

  if (!activeSub) {
    return new Response(JSON.stringify({
      subscribed: false,
      status: "none",
      tier: "free",
      currentPeriodEnd: null,
      trialEnd: null,
    }), { headers: { "Content-Type": "application/json" } });
  }

  const mappedStatus = mapStatus(activeSub.status);
  const tier = resolveTier(activeSub.price_id);

  return new Response(JSON.stringify({
    subscribed: mappedStatus === "active" || isTrialing,
    status: mappedStatus,
    priceId: activeSub.price_id,
    tier: isTrialing ? tier : (isPastDue ? tier : "free"),
    currentPeriodEnd: activeSub.current_period_end,
    cancelAt: activeSub.cancel_at,
    trialEnd: activeSub.trial_end,
  }), { headers: { "Content-Type": "application/json" } });
}, ["GET", "POST"]));

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { withAuthMiddleware } from "../_shared/middleware.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.7";
import { computeClientTier } from "../_shared/subscription-logic.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
);

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

  const activeSub = sub || trialSub || pastDueSub;

  if (!activeSub) {
    return new Response(JSON.stringify({
      subscribed: false,
      status: "none",
      tier: "free",
      currentPeriodEnd: null,
      trialEnd: null,
    }), { headers: { "Content-Type": "application/json" } });
  }

  const { tier, subscribed, mappedStatus } = computeClientTier({
    status: activeSub.status,
    priceId: activeSub.price_id,
  });

  return new Response(JSON.stringify({
    subscribed,
    status: mappedStatus,
    priceId: activeSub.price_id,
    tier,
    currentPeriodEnd: activeSub.current_period_end,
    cancelAt: activeSub.cancel_at,
    trialEnd: activeSub.trial_end,
  }), { headers: { "Content-Type": "application/json" } });
}, ["GET", "POST"]));

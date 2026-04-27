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
    }), { headers: { "Content-Type": "application/json" } });
  }

  const { data: sub } = await supabase
    .from("stripe_subscriptions")
    .select("status, price_id, current_period_end, cancel_at")
    .eq("customer_id", customerRow.customer_id)
    .in("status", ["active", "trialing"])
    .order("current_period_end", { ascending: false })
    .maybeSingle();

  if (!sub) {
    return new Response(JSON.stringify({
      subscribed: false,
      status: "none",
      tier: "free",
      currentPeriodEnd: null,
    }), { headers: { "Content-Type": "application/json" } });
  }

  return new Response(JSON.stringify({
    subscribed: true,
    status: sub.status,
    priceId: sub.price_id,
    tier: resolveTier(sub.price_id),
    currentPeriodEnd: sub.current_period_end,
    cancelAt: sub.cancel_at,
  }), { headers: { "Content-Type": "application/json" } });
}, ["GET", "POST"]));

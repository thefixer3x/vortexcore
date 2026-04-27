import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "npm:stripe@14.18.0";
import { withAuthMiddleware } from "../_shared/middleware.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.7";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
);

serve(withAuthMiddleware(async (req, { auth }) => {
  const { data: customerRow } = await supabase
    .from("stripe_customers")
    .select("customer_id")
    .eq("user_id", auth.userId)
    .maybeSingle();

  if (!customerRow?.customer_id) {
    return new Response(
      JSON.stringify({ error: "No Stripe customer found. Subscribe first." }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  const origin = req.headers.get("origin") || "https://vortexcore.app";
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: customerRow.customer_id,
    return_url: `${origin}/settings?tab=billing`,
  });

  return new Response(JSON.stringify({ url: portalSession.url }), {
    headers: { "Content-Type": "application/json" },
  });
}, ["POST"]));

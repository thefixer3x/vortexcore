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

// Free trial configuration (in days, 0 = no trial)
const TRIAL_PERIOD_DAYS = parseInt(Deno.env.get("STRIPE_TRIAL_PERIOD_DAYS") || "7");

serve(withAuthMiddleware(async (req, { auth }) => {
  try {
    const { priceId } = await req.json();
    if (!priceId) {
      return new Response(JSON.stringify({ error: "priceId is required" }), {
        headers: { "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Look up or create Stripe customer for this user
    const { data: customerRow, error: lookupError } = await supabase
      .from("stripe_customers")
      .select("customer_id")
      .eq("user_id", auth.userId)
      .maybeSingle();

    if (lookupError) {
      console.error("[create-checkout-session] stripe_customers lookup failed:", lookupError.message);
      return new Response(JSON.stringify({ error: "Failed to look up billing customer" }), {
        headers: { "Content-Type": "application/json" },
        status: 500,
      });
    }

    let customerId: string;
    if (customerRow?.customer_id) {
      customerId = customerRow.customer_id;
    } else {
      const { data: userData } = await supabase.auth.admin.getUserById(auth.userId!);
      const customer = await stripe.customers.create({
        email: userData?.user?.email,
        metadata: { user_id: auth.userId! },
      });
      customerId = customer.id;

      // Upsert (not insert) so a retry after a transient failure can't race into a
      // duplicate row, and so we never silently proceed to checkout with a Stripe
      // customer that isn't mapped back to a user — that mapping is what the webhook
      // needs to apply entitlements.
      const { error: persistError } = await supabase
        .from("stripe_customers")
        .upsert({ user_id: auth.userId, customer_id: customerId }, { onConflict: "user_id" });

      if (persistError) {
        console.error("[create-checkout-session] failed to persist stripe_customers row:", persistError.message);
        return new Response(JSON.stringify({ error: "Failed to record billing customer" }), {
          headers: { "Content-Type": "application/json" },
          status: 500,
        });
      }
    }

    const origin = req.headers.get("origin") || "https://vortexcore.app";
    
    // Build session params
    const sessionParams: Stripe.Checkout.SessionCreateParams & {
      subscription_data?: {
        trial_period_days?: number;
      };
    } = {
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${origin}/settings?tab=billing&checkout=success`,
      cancel_url: `${origin}/settings?tab=billing&checkout=cancelled`,
    };

    // Add trial period if configured
    if (TRIAL_PERIOD_DAYS > 0) {
      sessionParams.subscription_data = {
        trial_period_days: TRIAL_PERIOD_DAYS,
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    });
  }
}, ["POST"]));

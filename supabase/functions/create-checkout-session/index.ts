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
  try {
    const { priceId } = await req.json();
    if (!priceId) {
      return new Response(JSON.stringify({ error: "priceId is required" }), {
        headers: { "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Look up or create Stripe customer for this user
    const { data: customerRow } = await supabase
      .from("stripe_customers")
      .select("customer_id")
      .eq("user_id", auth.userId)
      .maybeSingle();

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
      await supabase.from("stripe_customers").insert({
        user_id: auth.userId,
        customer_id: customerId,
      });
    }

    const origin = req.headers.get("origin") || "https://vortexcore.app";
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${origin}/settings?tab=billing&checkout=success`,
      cancel_url: `${origin}/settings?tab=billing&checkout=cancelled`,
    });

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

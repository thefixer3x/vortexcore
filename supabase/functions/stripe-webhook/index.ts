import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.7";
import Stripe from "npm:stripe@14.18.0";
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16"
});
const supabase = createClient(Deno.env.get("SUPABASE_URL") || "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "");
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
serve(async (req)=>{
  try {
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return new Response("No signature", {
        status: 400
      });
    }
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    switch(event.type){
      case "customer.subscription.created":
      case "customer.subscription.updated":
        const subscription = event.data.object;
        await handleSubscriptionChange(subscription);
        break;
      case "customer.subscription.deleted":
        const deletedSubscription = event.data.object;
        await handleSubscriptionDeletion(deletedSubscription);
        break;
    }
    return new Response(JSON.stringify({
      received: true
    }), {
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch (err) {
    console.error("Error processing webhook:", err);
    return new Response(JSON.stringify({
      error: "Failed to process webhook"
    }), {
      status: 400,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
});
async function handleSubscriptionChange(subscription) {
  const { error } = await supabase.from("stripe_subscriptions").upsert({
    stripe_subscription_id: subscription.id,
    customer_id: subscription.customer,
    status: subscription.status,
    current_period_end: new Date(subscription.current_period_end * 1000),
    cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : null,
    updated_at: new Date()
  });
  if (error) {
    console.error("Error updating subscription:", error);
    throw error;
  }
}
async function handleSubscriptionDeletion(subscription) {
  const { error } = await supabase.from("stripe_subscriptions").update({
    status: "canceled",
    updated_at: new Date()
  }).eq("stripe_subscription_id", subscription.id);
  if (error) {
    console.error("Error deleting subscription:", error);
    throw error;
  }
}

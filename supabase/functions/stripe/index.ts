import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "npm:stripe@14.18.0";

// Initialize Stripe with the secret key from environment variables
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

// CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse the request body
    const { action, data } = await req.json();

    // Handle different actions
    switch (action) {
      case "get_api_key":
        // This should only return a masked version for frontend use
        return new Response(
          JSON.stringify({
            key: `${Deno.env.get("STRIPE_PUBLISHABLE_KEY")}`,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

      case "create_cardholder":
        // Create a new cardholder in Stripe
        const { name, email, metadata } = data;
        const cardholder = await stripe.issuing.cardholders.create({
          type: "individual",
          name,
          email,
          metadata,
        });
        return new Response(
          JSON.stringify({ cardholder }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

      case "create_card":
        // Create a new virtual card
        const { cardholder_id, currency, spending_limits } = data;
        const cardData: any = {
          cardholder: cardholder_id,
          currency: currency || "usd",
          type: "virtual",
          status: "active",
        };

        // Add spending limits if provided
        if (spending_limits) {
          cardData.spending_controls = {
            spending_limits: [spending_limits],
          };
        }

        const card = await stripe.issuing.cards.create(cardData);
        return new Response(
          JSON.stringify({ card }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

      case "get_card":
        // Get card details
        const { card_id } = data;
        const cardDetails = await stripe.issuing.cards.retrieve(card_id);
        return new Response(
          JSON.stringify({ card: cardDetails }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

      case "update_card":
        // Update card status
        const { card_id: updateCardId, status } = data;
        const updatedCard = await stripe.issuing.cards.update(updateCardId, {
          status,
        });
        return new Response(
          JSON.stringify({ card: updatedCard }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

      case "get_card_details":
        // Get sensitive card details (number, CVC, expiry)
        const { card_id: detailsCardId } = data;
        const sensitiveDetails = await stripe.issuing.cards.retrieveDetails(detailsCardId);
        return new Response(
          JSON.stringify({ details: sensitiveDetails }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

      case "get_transactions":
        // Get card transactions
        const { card_id: transactionsCardId, limit } = data;
        const transactions = await stripe.issuing.transactions.list({
          card: transactionsCardId,
          limit: limit || 10,
        });
        return new Response(
          JSON.stringify({ transactions }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { 
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
    }
  } catch (error) {
    console.error("Error in Stripe function:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "An error occurred while processing your request",
        details: error.toString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
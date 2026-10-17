import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "npm:stripe@14.18.0";
import { withAuthMiddleware } from "../_shared/middleware.ts";
import { createClient } from "../_shared/supabase-client.ts";
import { computeClientTier } from "../_shared/subscription-logic.ts";

// Initialize Stripe with the secret key from environment variables
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

// CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FREE_TIER_CARD_LIMIT = 3;
const serviceClient = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("VORTEX_SUPABASE_SECRET_KEY") || "",
);

// Mirrors check-subscription: resolve the caller's plan from stored Stripe data.
async function getUserTier(userId: string): Promise<string> {
  const { data: customerRow } = await serviceClient
    .from("stripe_customers").select("customer_id").eq("user_id", userId).maybeSingle();
  if (!customerRow?.customer_id) return "free";
  const { data: subs } = await serviceClient
    .from("stripe_subscriptions").select("status, price_id")
    .eq("customer_id", customerRow.customer_id)
    .in("status", ["active", "trialing", "past_due"]);
  const sub = subs?.[0];
  if (!sub) return "free";
  return computeClientTier({ status: sub.status, priceId: sub.price_id }).tier;
}

// Count non-cancelled cards across every cardholder owned by this user.
async function countUserCards(userId: string): Promise<number> {
  let count = 0;
  for await (const ch of stripe.issuing.cardholders.list({ limit: 100 })) {
    if (ch.metadata?.user_id !== userId) continue;
    for await (const card of stripe.issuing.cards.list({ cardholder: ch.id, limit: 100 })) {
      if (card.status !== "canceled") count++;
    }
  }
  return count;
}

serve(withAuthMiddleware(async (req, { auth, admin }) => {
  // Handle within middleware (OPTIONS handled, CORS added)
  try {
    const { action, data } = await req.json();
    const idempotencyKey = req.headers.get('x-idempotency-key') || undefined;

    // Helper: enforce idempotency for mutating actions
    const requireIdempotency = (name: string) => {
      if (!idempotencyKey) {
        throw new Response(JSON.stringify({ error: `Missing x-idempotency-key for ${name}` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }) as unknown as Error;
      }
    };

    // Helper: rate limit per user+action (best effort)
    const rateLimit = async (name: string, perWindow: number = 30, windowSeconds = 60) => {
      if (!admin || !auth.userId) return; // skip if admin client not available
      const { data: r, error: re } = await admin.rpc('increment_edge_rate', { p_user_id: auth.userId, p_action: name, p_window_seconds: windowSeconds });
      if (!re && typeof r === 'number' && r > perWindow) {
        throw new Response(JSON.stringify({ error: 'Too Many Requests' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': `${windowSeconds}` },
        }) as unknown as Error;
      }
    };

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

      case "create_cardholder": {
        // Create a new cardholder in Stripe. Self-service: any authenticated
        // user can create their own cardholder — Stripe requires a billing
        // address for individual cardholders, so it's required here too.
        if (!auth.userId) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        await rateLimit('create_cardholder');
        requireIdempotency('create_cardholder');
        const { name, email, phone_number, billing, metadata } = data || {};
        if (!name || !email || !billing?.address?.line1 || !billing?.address?.city || !billing?.address?.postal_code || !billing?.address?.country) {
          return new Response(
            JSON.stringify({ error: 'name, email, and billing.address (line1, city, postal_code, country) are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        const safeMetadata = { ...(metadata || {}), user_id: auth.userId };
        const cardholder = await stripe.issuing.cardholders.create({
          type: "individual",
          name,
          email,
          phone_number,
          billing,
          metadata: safeMetadata,
        }, idempotencyKey ? { idempotencyKey } : undefined);
        return new Response(
          JSON.stringify({ cardholder }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "create_card": {
        // Create a new virtual card. Self-service, but the cardholder must
        // belong to the requesting user (checked via the metadata.user_id set
        // when the cardholder was created above) so nobody can issue a card
        // against someone else's cardholder record.
        if (!auth.userId) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        await rateLimit('create_card');
        requireIdempotency('create_card');
        const { cardholder_id, currency, spending_limits } = data || {};
        if (!cardholder_id) {
          return new Response(JSON.stringify({ error: 'cardholder_id is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        const ownerCardholder = await stripe.issuing.cardholders.retrieve(cardholder_id);
        if (ownerCardholder.metadata?.user_id !== auth.userId) {
          return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // Server-side plan gate: free plan is limited to FREE_TIER_CARD_LIMIT cards.
        const tier = await getUserTier(auth.userId);
        if (tier === 'free') {
          const owned = await countUserCards(auth.userId);
          if (owned >= FREE_TIER_CARD_LIMIT) {
            return new Response(JSON.stringify({
              error: `The Free plan includes up to ${FREE_TIER_CARD_LIMIT} virtual cards. Upgrade to Pro for unlimited cards.`,
              code: 'card_limit_reached',
            }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          }
        }
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

        const card = await stripe.issuing.cards.create(cardData, idempotencyKey ? { idempotencyKey } : undefined);
        return new Response(
          JSON.stringify({ card }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "get_card":
        // Get card details
        if (!auth.userId) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        const { card_id } = data || {};
        // Ownership check via DB (virtual_cards)
        if (admin) {
          const { data: vc } = await admin.from('virtual_cards').select('user_id').eq('card_id', card_id).single();
          if (!vc || vc.user_id !== auth.userId) {
            return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          }
        }
        const cardDetails = await stripe.issuing.cards.retrieve(card_id);
        return new Response(
          JSON.stringify({ card: cardDetails }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

      case "update_card":
        // Update card status
        if (!auth.userId) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        const { card_id: updateCardId, status } = data || {};
        if (admin) {
          const { data: vc } = await admin.from('virtual_cards').select('user_id').eq('card_id', updateCardId).single();
          if (!vc || vc.user_id !== auth.userId) {
            return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          }
        }
        await rateLimit('update_card', 60);
        requireIdempotency('update_card');
        const updatedCard = await stripe.issuing.cards.update(updateCardId, {
          status,
        }, idempotencyKey ? { idempotencyKey } : undefined);
        return new Response(
          JSON.stringify({ card: updatedCard }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

      case "get_card_details": {
        // Get sensitive card details (number, CVC, expiry). Owner-only: the
        // card's own holder can reveal it, same as any other card action —
        // this used to require admin/compliance roles that no user ever has,
        // which made the "reveal card" UI silently fail for everyone.
        if (!auth.userId) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        await rateLimit('get_card_details', 20);
        const { card_id: detailsCardId } = data || {};
        if (admin) {
          const { data: vc } = await admin.from('virtual_cards').select('user_id').eq('card_id', detailsCardId).single();
          if (!vc || vc.user_id !== auth.userId) {
            return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          }
        }
        const sensitiveDetails = await stripe.issuing.cards.retrieveDetails(detailsCardId);
        return new Response(
          JSON.stringify({ details: sensitiveDetails }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "get_transactions":
        // Get card transactions
        if (!auth.userId) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        const { card_id: transactionsCardId, limit } = data || {};
        if (admin) {
          const { data: vc } = await admin.from('virtual_cards').select('user_id').eq('card_id', transactionsCardId).single();
          if (!vc || vc.user_id !== auth.userId) {
            return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          }
        }
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
}, ['POST']));

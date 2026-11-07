import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "npm:stripe@14.18.0";
import { withAuthMiddleware } from "../_shared/middleware.ts";
import { createClient } from "../_shared/supabase-client.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

const serviceClient = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("VORTEX_SUPABASE_SECRET_KEY") || "",
);

serve(withAuthMiddleware(async (req, { auth }) => {
  try {
    const { action, data } = await req.json();
    const idempotencyKey = req.headers.get("x-idempotency-key") || undefined;

    if (!auth.userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    switch (action) {
      case "create_setup_intent": {
        // Create a SetupIntent for the user to securely attach a payment method.
        // The frontend will use Stripe.js (confirmPayment / confirmSetup) and
        // send back the returned setup_intent_id to attach.
        const { currency } = data || {};
        const setupIntent = await stripe.setupIntents.create({
          payment_method_types: ["card"],
          usage: "off_session",
          metadata: { user_id: auth.userId },
          ...(currency ? { currency } : {}),
        }, idempotencyKey ? { idempotencyKey } : undefined);
        return new Response(
          JSON.stringify({ setupIntent }),
          { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } },
        );
      }

      case "attach_payment_method": {
        // Attach a confirmed PaymentMethod to the user's Stripe customer record
        // and persist the Stripe payment_method_id in our vault table.
        const { setup_intent_id, payment_method_id } = data || {};
        if (!payment_method_id) {
          return new Response(JSON.stringify({ error: "payment_method_id is required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Verify the setup intent belongs to this user
        if (setup_intent_id) {
          const si = await stripe.setupIntents.retrieve(setup_intent_id);
          if (si.metadata?.user_id !== auth.userId) {
            return new Response(JSON.stringify({ error: "Forbidden" }), {
              status: 403,
              headers: { "Content-Type": "application/json" },
            });
          }
        }

        // Retrieve or create the Stripe customer
        const { data: custRow } = await serviceClient
          .from("stripe_customers")
          .select("customer_id")
          .eq("user_id", auth.userId)
          .maybeSingle();

        let customerId = custRow?.customer_id;
        if (!customerId) {
          const customer = await stripe.customers.create({
            metadata: { user_id: auth.userId },
          });
          await serviceClient.from("stripe_customers").insert({
            user_id: auth.userId,
            customer_id: customer.id,
            email: "",
            created_at: new Date().toISOString(),
          });
          customerId = customer.id;
        }

        // Attach the payment method to the customer
        await stripe.paymentMethods.attach(payment_method_id, {
          customer: customerId,
        }, idempotencyKey ? { idempotencyKey } : undefined);

        // Set as default for this customer
        await stripe.customers.update(customerId, {
          invoice_settings: { default_payment_method: payment_method_id },
        });

        // Persist to our table for quick lookup
        await serviceClient.from("user_payment_methods").upsert({
          user_id: auth.userId,
          stripe_payment_method_id: payment_method_id,
          last4: "", // filled in below
          brand: "",
          exp_month: 0,
          exp_year: 0,
          is_default: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id,stripe_payment_method_id" });

        // Refresh last4/brand/exp from Stripe
        const pm = await stripe.paymentMethods.retrieve(payment_method_id);
        if (pm.card) {
          await serviceClient.from("user_payment_methods")
            .update({
              last4: pm.card.last4,
              brand: pm.card.brand,
              exp_month: pm.card.exp_month,
              exp_year: pm.card.exp_year,
            })
            .eq("stripe_payment_method_id", payment_method_id);
        }

        return new Response(
          JSON.stringify({ success: true, payment_method_id }),
          { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } },
        );
      }

      case "list_payment_methods": {
        const { data: rows, error } = await serviceClient
          .from("user_payment_methods")
          .select("*")
          .eq("user_id", auth.userId)
          .order("is_default", { ascending: false })
          .order("created_at", { ascending: false });

        if (error) throw error;

        // Enrich with Stripe details for cards
        const enriched = await Promise.all(
          (rows || []).map(async (row) => {
            if (row.stripe_payment_method_id && row.stripe_payment_method_id.startsWith("pm_")) {
              try {
                const pm = await stripe.paymentMethods.retrieve(row.stripe_payment_method_id);
                if (pm.card) {
                  return {
                    ...row,
                    stripe_last4: pm.card.last4,
                    stripe_brand: pm.card.brand,
                    stripe_exp_month: pm.card.exp_month,
                    stripe_exp_year: pm.card.exp_year,
                  };
                }
              } catch {
                // silently fall back to stored data
              }
            }
            return row;
          }),
        );

        return new Response(
          JSON.stringify({ paymentMethods: enriched }),
          { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } },
        );
      }

      case "set_default_payment_method": {
        const { payment_method_id } = data || {};
        if (!payment_method_id) {
          return new Response(JSON.stringify({ error: "payment_method_id is required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Verify ownership
        const { data: row } = await serviceClient
          .from("user_payment_methods")
          .select("user_id")
          .eq("stripe_payment_method_id", payment_method_id)
          .eq("user_id", auth.userId)
          .maybeSingle();

        if (!row) {
          return new Response(JSON.stringify({ error: "Payment method not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }

        await serviceClient
          .from("user_payment_methods")
          .update({ is_default: false })
          .eq("user_id", auth.userId);

        await serviceClient
          .from("user_payment_methods")
          .update({ is_default: true })
          .eq("stripe_payment_method_id", payment_method_id);

        // Also set on Stripe customer side
        const { data: custRow } = await serviceClient
          .from("stripe_customers")
          .select("customer_id")
          .eq("user_id", auth.userId)
          .maybeSingle();

        if (custRow?.customer_id) {
          await stripe.customers.update(custRow.customer_id, {
            invoice_settings: { default_payment_method: payment_method_id },
          });
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } },
        );
      }

      case "detach_payment_method": {
        const { payment_method_id } = data || {};
        if (!payment_method_id) {
          return new Response(JSON.stringify({ error: "payment_method_id is required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Verify ownership
        const { data: row } = await serviceClient
          .from("user_payment_methods")
          .select("stripe_payment_method_id")
          .eq("user_id", auth.userId)
          .eq("stripe_payment_method_id", payment_method_id)
          .maybeSingle();

        if (!row) {
          return new Response(JSON.stringify({ error: "Payment method not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }

        await stripe.paymentMethods.detach(payment_method_id);
        await serviceClient
          .from("user_payment_methods")
          .delete()
          .eq("user_id", auth.userId)
          .eq("stripe_payment_method_id", payment_method_id);

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } },
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } },
        );
    }
  } catch (error: unknown) {
    console.error("Error in payment-methods function:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "An error occurred",
      }),
      { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } },
    );
  }
}, ["POST"]));

// Saved cards for wallet top-ups.
//
// Cards are added on Stripe's hosted page (Checkout in setup mode), so no card
// data touches VortexCore and no Stripe.js is needed in the app:
//   start_card_setup  → returns a Checkout URL; the user saves a card there
//   complete_card_setup(session_id) → called on return; reads the saved card
//                        from Stripe (never from the client) and records it
//   list / set_default / remove
// Only the service role writes vortex_payment_methods; users can read their
// own rows.
import Stripe from "npm:stripe@14.18.0";
import { withAuthMiddleware } from "../_shared/middleware.ts";
import { safeOrigin } from "../_shared/safe-origin.ts";
import { createClient } from "../_shared/supabase-client.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2023-10-16" });
const admin = createClient(Deno.env.get("SUPABASE_URL") || "", Deno.env.get("VORTEX_SUPABASE_SECRET_KEY") || "");

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

class HttpError extends Error {
  constructor(readonly status: number, message: string) { super(message); }
}

/** The caller's Stripe customer, created and recorded on first use. */
async function ensureCustomer(userId: string): Promise<string> {
  const { data: row, error } = await admin
    .from("stripe_customers").select("customer_id").eq("user_id", userId).maybeSingle();
  if (error) throw new Error(`stripe_customers lookup failed: ${error.message}`);
  if (row?.customer_id) return row.customer_id as string;

  const { data: userData } = await admin.auth.admin.getUserById(userId);
  const customer = await stripe.customers.create(
    { email: userData?.user?.email, metadata: { user_id: userId } },
    { idempotencyKey: `customer:${userId}` },
  );
  const { error: upsertErr } = await admin
    .from("stripe_customers")
    .upsert({ user_id: userId, customer_id: customer.id }, { onConflict: "user_id" });
  if (upsertErr) throw new Error(`stripe_customers upsert failed: ${upsertErr.message}`);
  return customer.id;
}

async function existingCustomer(userId: string): Promise<string | null> {
  const { data } = await admin.from("stripe_customers").select("customer_id").eq("user_id", userId).maybeSingle();
  return (data?.customer_id as string | undefined) ?? null;
}

async function listCards(userId: string) {
  const { data, error } = await admin
    .from("vortex_payment_methods")
    .select("id, source_id, type, brand, last4, exp_month, exp_year, is_default, created_at, updated_at")
    .eq("user_id", userId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(`list failed: ${error.message}`);
  return data ?? [];
}

async function ownCard(userId: string, sourceId: unknown) {
  if (typeof sourceId !== "string" || !sourceId.startsWith("pm_")) throw new HttpError(400, "payment_method_id is required");
  const { data, error } = await admin
    .from("vortex_payment_methods").select("source_id, is_default")
    .eq("user_id", userId).eq("source_id", sourceId).maybeSingle();
  if (error) throw new Error(`card lookup failed: ${error.message}`);
  if (!data) throw new HttpError(404, "Card not found");
  return data;
}

async function makeDefault(userId: string, sourceId: string, customerId: string | null) {
  // Clear the old default first: a unique index allows one default per user.
  const { error: clearErr } = await admin
    .from("vortex_payment_methods").update({ is_default: false })
    .eq("user_id", userId).eq("is_default", true).neq("source_id", sourceId);
  if (clearErr) throw new Error(`clear default failed: ${clearErr.message}`);
  const { error: setErr } = await admin
    .from("vortex_payment_methods").update({ is_default: true })
    .eq("user_id", userId).eq("source_id", sourceId);
  if (setErr) throw new Error(`set default failed: ${setErr.message}`);
  if (customerId) {
    await stripe.customers.update(customerId, { invoice_settings: { default_payment_method: sourceId } });
  }
}

Deno.serve(withAuthMiddleware(async (req, { auth }) => {
  const userId = auth.userId;
  if (!userId) return json({ error: "Please sign in" }, 401);

  let action: unknown;
  let data: Record<string, unknown>;
  try {
    const body = await req.json();
    action = body?.action;
    data = (body?.data && typeof body.data === "object") ? body.data : {};
  } catch {
    return json({ error: "Invalid request" }, 400);
  }

  try {
    switch (action) {
      case "start_card_setup": {
        const customerId = await ensureCustomer(userId);
        const origin = safeOrigin(req);
        const session = await stripe.checkout.sessions.create({
          mode: "setup",
          customer: customerId,
          payment_method_types: ["card"],
          metadata: { user_id: userId, purpose: "wallet_card" },
          setup_intent_data: { metadata: { user_id: userId, purpose: "wallet_card" } },
          success_url: `${origin}/settings?card_setup={CHECKOUT_SESSION_ID}`,
          cancel_url: `${origin}/settings?card_setup=cancelled`,
        });
        return json({ url: session.url });
      }

      case "complete_card_setup": {
        const sessionId = data.session_id;
        if (typeof sessionId !== "string" || !sessionId.startsWith("cs_")) throw new HttpError(400, "session_id is required");
        const customerId = await existingCustomer(userId);
        const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ["setup_intent"] });
        const si = session.setup_intent as Stripe.SetupIntent | null;
        const sessionCustomer = typeof session.customer === "string" ? session.customer : session.customer?.id;
        if (
          !customerId || session.mode !== "setup" || sessionCustomer !== customerId ||
          session.metadata?.user_id !== userId || !si || si.status !== "succeeded"
        ) {
          throw new HttpError(400, "That card setup could not be confirmed");
        }
        const pmId = typeof si.payment_method === "string" ? si.payment_method : si.payment_method?.id;
        if (!pmId) throw new HttpError(400, "No card was saved");
        const pm = await stripe.paymentMethods.retrieve(pmId);
        const pmCustomer = typeof pm.customer === "string" ? pm.customer : pm.customer?.id;
        if (pmCustomer !== customerId) throw new HttpError(400, "That card setup could not be confirmed");

        const existing = await listCards(userId);
        const isFirst = !existing.some((c) => c.source_id !== pmId);
        const { error: upErr } = await admin.from("vortex_payment_methods").upsert({
          user_id: userId,
          source_id: pmId,
          type: pm.type,
          brand: pm.card?.brand ?? null,
          last4: pm.card?.last4 ?? null,
          exp_month: pm.card?.exp_month ?? null,
          exp_year: pm.card?.exp_year ?? null,
        }, { onConflict: "source_id" });
        if (upErr) throw new Error(`save card failed: ${upErr.message}`);
        if (isFirst) await makeDefault(userId, pmId, customerId);
        return json({ success: true, payment_method_id: pmId, paymentMethods: await listCards(userId) });
      }

      case "list_payment_methods":
        return json({ paymentMethods: await listCards(userId) });

      case "set_default_payment_method": {
        const card = await ownCard(userId, data.payment_method_id);
        await makeDefault(userId, card.source_id, await existingCustomer(userId));
        return json({ success: true });
      }

      case "detach_payment_method": {
        const card = await ownCard(userId, data.payment_method_id);
        try {
          await stripe.paymentMethods.detach(card.source_id);
        } catch (err) {
          // Already detached or deleted on Stripe's side: still remove our row,
          // otherwise the card is stuck in the list.
          const e = err as { code?: string; message?: string };
          const gone = e.code === "resource_missing" || /not attached to a customer/i.test(e.message ?? "");
          if (!gone) throw err;
        }
        const { error: delErr } = await admin.from("vortex_payment_methods").delete()
          .eq("user_id", userId).eq("source_id", card.source_id);
        if (delErr) throw new Error(`remove card failed: ${delErr.message}`);
        if (card.is_default) {
          const [next] = await listCards(userId);
          if (next) await makeDefault(userId, next.source_id, await existingCustomer(userId));
        }
        return json({ success: true });
      }

      default:
        return json({ error: "Invalid action" }, 400);
    }
  } catch (err) {
    if (err instanceof HttpError) return json({ error: err.message }, err.status);
    console.error("[stripe-payment-methods]", action, (err as Error).message);
    return json({ error: "Something went wrong with your cards. Please try again." }, 500);
  }
}, ["POST"]));

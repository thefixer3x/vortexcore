import Stripe from "npm:stripe@14.18.0";
import { createClient } from "../_shared/supabase-client.ts";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ROLES = ["user", "admin"];
const TIER_KEYS = ["free", "hobby", "pro", "enterprise"];
const PROJECT_STATUS = ["active", "paused", "archived"];
const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Use POST" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const userClient = createClient(url, Deno.env.get("VORTEX_SUPABASE_PUBLISHABLE_KEY")!, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
  const { data: u, error: authErr } = await userClient.auth.getUser((req.headers.get("Authorization") ?? "").replace(/^Bearer /, ""));
  if (authErr || !u?.user) return json({ error: "Please sign in" }, 401);

  // Server-side access uses the Supabase secret key (service_role database role).
  const admin = createClient(url, Deno.env.get("VORTEX_SUPABASE_SECRET_KEY")!);
  const { data: me } = await admin.from("users").select("role").eq("id", u.user.id).maybeSingle();
  const isAdmin = me?.role === "admin" || me?.role === "superadmin";

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: "Invalid request" }, 400); }
  const action = str(body.action, 40);

  if (action === "whoami") return json({ is_admin: isAdmin });
  if (!isAdmin) return json({ error: "Admins only" }, 403);

  const audit = (act: string, details: Record<string, unknown>) =>
    admin.rpc("vortex_admin_audit", { p_user_id: u.user.id, p_action: act, p_details: details })
      .then(({ error }) => { if (error) console.error("audit failed", act, error.message); });

  try {
    switch (action) {
      case "stats": {
        const { data, error } = await admin.rpc("vortex_admin_stats");
        if (error) throw error;
        return json({ stats: data });
      }
      case "list_users": {
        const { data, error } = await admin.from("users").select("id,email,role,created_at").order("created_at");
        if (error) throw error;
        return json({ users: data });
      }
      case "set_role": {
        const id = str(body.user_id, 36), role = str(body.role, 20);
        if (!UUID.test(id) || !ROLES.includes(role)) return json({ error: "Invalid user or role" }, 400);
        if (id === u.user.id && role !== "admin") return json({ error: "You can't remove your own admin access" }, 400);
        const { data: target } = await admin.from("users").select("role,email").eq("id", id).maybeSingle();
        if (!target) return json({ error: "User not found" }, 404);
        if (target.role === "superadmin") return json({ error: "Superadmins can't be changed here" }, 400);
        const { error } = await admin.from("users").update({ role }).eq("id", id);
        if (error) throw error;
        await audit("set_role", { target_user_id: id, from: target.role, to: role });
        return json({ ok: true });
      }

      // ---- VortexCore cockpit projects (control_room.projects, app_id = vortexcore) ----
      case "list_projects": {
        const { data, error } = await admin.from("vortex_cockpit_projects")
          .select("id,name,description,type,status,created_at,updated_at").order("created_at", { ascending: false });
        if (error) throw error;
        return json({ projects: data });
      }
      case "save_project": {
        const name = str(body.name, 120);
        if (!name) return json({ error: "Name is required" }, 400);
        const status = PROJECT_STATUS.includes(str(body.status, 20)) ? str(body.status, 20) : "active";
        const row = { name, description: str(body.description, 1000) || null, type: str(body.type, 60) || "web", status };
        const id = str(body.id, 36);
        if (id) {
          if (!UUID.test(id)) return json({ error: "Invalid project" }, 400);
          const { data, error } = await admin.from("vortex_cockpit_projects").update(row).eq("id", id).select("id");
          if (error) throw error;
          if (!data?.length) return json({ error: "Project not found" }, 404);
          await audit("update_project", { project_id: id, name });
        } else {
          const { data, error } = await admin.from("vortex_cockpit_projects")
            .insert({ ...row, metadata: { app_id: "vortexcore", created_by: u.user.id } }).select("id").single();
          if (error) throw error;
          await audit("create_project", { project_id: data.id, name });
        }
        return json({ ok: true });
      }
      case "delete_project": {
        const id = str(body.id, 36);
        if (!UUID.test(id)) return json({ error: "Invalid project" }, 400);
        const { data, error } = await admin.from("vortex_cockpit_projects").delete().eq("id", id).select("id,name");
        if (error) throw error;
        if (!data?.length) return json({ error: "Project not found" }, 404);
        await audit("delete_project", { project_id: id, name: data[0].name });
        return json({ ok: true });
      }

      // ---- Pricing plans ----
      case "list_tiers": {
        const { data, error } = await admin.from("vortex_pricing_tiers").select("*").order("sort_order");
        if (error) throw error;
        return json({ tiers: data });
      }
      case "save_tier": {
        const key = str(body.tier_key, 20);
        if (!TIER_KEYS.includes(key)) return json({ error: "Unknown plan" }, 400);
        const name = str(body.name, 60);
        const price = Math.round(Number(body.price) * 100) / 100;
        const currency = str(body.currency, 3).toUpperCase() || "USD";
        const interval = body.billing_interval === "year" ? "year" : "month";
        if (!name) return json({ error: "Plan name is required" }, 400);
        if (!Number.isFinite(price) || price < 0 || price > 100000) return json({ error: "Enter a price between 0 and 100,000" }, 400);
        if (!/^[A-Z]{3}$/.test(currency)) return json({ error: "Currency must be a 3-letter code" }, 400);
        if (key === "free" && price !== 0) return json({ error: "The Free plan must stay at 0" }, 400);
        const features = (Array.isArray(body.features) ? body.features : []).slice(0, 12)
          .map((f) => ({ label: str((f as Record<string, unknown>)?.label, 120), ...((f as Record<string, unknown>)?.comingSoon ? { comingSoon: true } : {}) }))
          .filter((f) => f.label);
        const cardLimit = body.card_limit === null || body.card_limit === "" || body.card_limit === undefined
          ? null : Math.max(0, Math.min(1000, Math.floor(Number(body.card_limit))));
        if (cardLimit !== null && !Number.isFinite(cardLimit)) return json({ error: "Card limit must be a number" }, 400);
        const isActive = body.is_active !== false;

        const { data: current, error: curErr } = await admin.from("vortex_pricing_tiers").select("*").eq("tier_key", key).maybeSingle();
        if (curErr) throw curErr;
        if (!current) return json({ error: "Plan not found" }, 404);

        let stripePriceId: string | null = current.stripe_price_id;
        let previous: string[] = current.previous_price_ids ?? [];
        const priceChanged = Number(current.price) !== price || current.currency !== currency || current.billing_interval !== interval;
        if (key !== "free" && priceChanged) {
          const secret = Deno.env.get("STRIPE_SECRET_KEY");
          if (!secret) return json({ error: "Stripe isn't connected, so paid prices can't be changed yet." }, 400);
          const stripe = new Stripe(secret, { apiVersion: "2023-10-16" });
          let product: string | undefined;
          if (stripePriceId) {
            const old = await stripe.prices.retrieve(stripePriceId);
            product = typeof old.product === "string" ? old.product : old.product?.id;
          }
          if (!product) {
            product = (await stripe.products.create({ name: `VortexCore ${name}`, metadata: { project: "vortexcore", tier: key } })).id;
          }
          const billing = interval === "year" ? "yearly" : "monthly";
          const created = await stripe.prices.create({
            product, currency: currency.toLowerCase(), unit_amount: Math.round(price * 100),
            recurring: { interval },
            lookup_key: `vortexcore_${key}_${billing}`, transfer_lookup_key: true,
            metadata: { project: "vortexcore", tier: key, billing },
          });
          if (stripePriceId) previous = [...previous.filter((p) => p !== stripePriceId), stripePriceId];
          stripePriceId = created.id;
        }

        const { error } = await admin.from("vortex_pricing_tiers").update({
          name, price, currency, billing_interval: interval, features, card_limit: cardLimit, is_active: isActive,
          stripe_price_id: stripePriceId, previous_price_ids: previous,
        }).eq("tier_key", key);
        if (error) throw error;
        await audit("save_tier", { tier: key, price, currency, interval, stripe_price_id: stripePriceId, price_changed: priceChanged });
        return json({ ok: true, stripe_price_id: stripePriceId });
      }
      default:
        return json({ error: "Unknown action" }, 400);
    }
  } catch (e) {
    console.error("vortex-admin failed", action, e);
    const stripeMsg = (e as { type?: string; message?: string })?.type?.startsWith?.("Stripe") ? (e as Error).message : null;
    return json({ error: stripeMsg ? `Stripe: ${stripeMsg}` : "Something went wrong" }, 500);
  }
});

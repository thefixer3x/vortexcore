import { createClient } from "../_shared/supabase-client.ts";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ROLES = ["user", "admin"];
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

  const admin = createClient(url, Deno.env.get("VORTEX_SUPABASE_SECRET_KEY")!);
  const { data: me } = await admin.from("users").select("role").eq("id", u.user.id).maybeSingle();
  const isAdmin = me?.role === "admin" || me?.role === "superadmin";

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: "Invalid request" }, 400); }
  const action = str(body.action, 40);

  if (action === "whoami") return json({ is_admin: isAdmin });
  if (!isAdmin) return json({ error: "Admins only" }, 403);

  try {
    switch (action) {
      case "list_users": {
        const { data, error } = await admin.from("users").select("id,email,role,created_at").order("created_at");
        if (error) throw error;
        return json({ users: data });
      }
      case "set_role": {
        const id = str(body.user_id, 36), role = str(body.role, 20);
        if (!UUID.test(id) || !ROLES.includes(role)) return json({ error: "Invalid user or role" }, 400);
        if (id === u.user.id && role !== "admin") return json({ error: "You can't remove your own admin access" }, 400);
        const { data: target } = await admin.from("users").select("role").eq("id", id).maybeSingle();
        if (!target) return json({ error: "User not found" }, 404);
        if (target.role === "superadmin") return json({ error: "Superadmins can't be changed here" }, 400);
        const { error } = await admin.from("users").update({ role }).eq("id", id);
        if (error) throw error;
        return json({ ok: true });
      }
      case "list_projects": {
        const { data, error } = await admin.from("company_projects").select("id,name,description,type,created_at,updated_at").order("created_at", { ascending: false });
        if (error) throw error;
        return json({ projects: data });
      }
      case "save_project": {
        const name = str(body.name, 120);
        if (!name) return json({ error: "Name is required" }, 400);
        const row = { name, description: str(body.description, 1000) || null, type: str(body.type, 60) || null };
        const id = str(body.id, 36);
        const q = id
          ? (UUID.test(id) ? admin.from("company_projects").update(row).eq("id", id) : null)
          : admin.from("company_projects").insert(row);
        if (!q) return json({ error: "Invalid project" }, 400);
        const { error } = await q;
        if (error) throw error;
        return json({ ok: true });
      }
      case "delete_project": {
        const id = str(body.id, 36);
        if (!UUID.test(id)) return json({ error: "Invalid project" }, 400);
        const { error } = await admin.from("company_projects").delete().eq("id", id);
        if (error) throw error;
        return json({ ok: true });
      }
      default:
        return json({ error: "Unknown action" }, 400);
    }
  } catch (e) {
    console.error("vortex-admin failed", action, e);
    return json({ error: "Something went wrong" }, 500);
  }
});

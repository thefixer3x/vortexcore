import { createClient } from "../_shared/supabase-client.ts";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { compactTransactions, detectAndSaveObligations, DetectionError } from "../_shared/obligation-detection.ts";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Use POST" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const authHeader = req.headers.get("Authorization") ?? "";
  const userClient = createClient(url, Deno.env.get("VORTEX_SUPABASE_PUBLISHABLE_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: authErr } = await userClient.auth.getUser(authHeader.replace(/^Bearer /, ""));
  if (authErr || !userData?.user) return json({ error: "Please sign in" }, 401);
  const userId = userData.user.id;

  const admin = createClient(url, Deno.env.get("VORTEX_SUPABASE_SECRET_KEY")!);
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) return json({ error: "VortexAI is not configured" }, 503);

  try {
    const { data: txs, error: txErr } = await admin.from("vortex_transactions")
      .select("id, amount, type, description, category, metadata, created_at, status")
      .eq("user_id", userId).order("created_at", { ascending: false }).limit(200);
    if (txErr) throw txErr;
    if (!txs?.length) {
      await detectAndSaveObligations(admin, userId, [], key);
      return json({ created: 0, scanned: 0, message: "No transactions to analyse yet." });
    }
    const r = await detectAndSaveObligations(admin, userId, compactTransactions(txs), key);
    return json(r);
  } catch (e) {
    if (e instanceof DetectionError) return json({ error: e.message }, e.status);
    console.error("detect-obligations failed", e);
    return json({ error: "Detection failed. Please try again." }, 500);
  }
});

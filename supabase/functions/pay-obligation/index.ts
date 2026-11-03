import { createClient } from "../_shared/supabase-client.ts";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const MESSAGES: Record<string, [string, number]> = {
  OBLIGATION_NOT_FOUND: ["That obligation wasn't found.", 404],
  ALREADY_PAID: ["This obligation is already paid.", 409],
  NO_AMOUNT: ["Add an amount to this obligation before paying it.", 400],
  NO_WALLET: ["You don't have an unlocked wallet in this currency.", 400],
  INSUFFICIENT_FUNDS: ["Your wallet balance is too low for this payment.", 400],
};
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Use POST" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const userClient = createClient(url, Deno.env.get("VORTEX_SUPABASE_PUBLISHABLE_KEY")!, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
  const { data: u, error: authErr } = await userClient.auth.getUser((req.headers.get("Authorization") ?? "").replace(/^Bearer /, ""));
  if (authErr || !u?.user) return json({ error: "Please sign in" }, 401);

  let body: { obligation_id?: unknown };
  try { body = await req.json(); } catch { return json({ error: "Invalid request" }, 400); }
  const id = typeof body.obligation_id === "string" ? body.obligation_id : "";
  if (!UUID.test(id)) return json({ error: "obligation_id is required" }, 400);

  const admin = createClient(url, Deno.env.get("VORTEX_SUPABASE_SECRET_KEY")!);
  const { data, error } = await admin.rpc("vortex_pay_obligation", { p_user_id: u.user.id, p_obligation_id: id });
  if (error) {
    const known = Object.keys(MESSAGES).find((k) => error.message?.includes(k));
    if (known) return json({ error: MESSAGES[known][0] }, MESSAGES[known][1]);
    console.error("pay-obligation failed", error);
    return json({ error: "Payment failed. Please try again." }, 500);
  }
  return json(data);
});

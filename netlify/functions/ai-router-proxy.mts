import type { Context, Config } from "@netlify/functions";

export default async (req: Request, _context: Context) => {
  // Proxy to Supabase Edge Function ai-router
  const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://mxtsdgkwzjzlttpotole.supabase.co";
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

  const endpoint = `${supabaseUrl}/functions/v1/ai-router`;
  const init: RequestInit = {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(anonKey ? { apikey: anonKey } : {}),
      // Forward auth if present
      ...(req.headers.get("authorization") ? { authorization: req.headers.get("authorization")! } : {}),
    },
    body: await req.text(),
  };

  const resp = await fetch(endpoint, init);
  const body = await resp.text();
  return new Response(body, { status: resp.status, headers: { "content-type": resp.headers.get("content-type") || "application/json" } });
};

export const config: Config = {
  path: "/api/ai-router"
};

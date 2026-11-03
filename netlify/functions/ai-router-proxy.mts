import type { Context, Config } from "@netlify/functions";

export default async (req: Request, _context: Context) => {
  // Proxy to Supabase Edge Function ai-router
  const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://mxtsdgkwzjzlttpotole.supabase.co";
  const publishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const authorization = req.headers.get("authorization");

  const endpoint = `${supabaseUrl}/functions/v1/ai-router`;
  const init: RequestInit = {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(publishableKey ? { apikey: publishableKey } : {}),
      // Forward auth if present
      ...(authorization && authorization !== `Bearer ${publishableKey}` ? { authorization } : {}),
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

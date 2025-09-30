import type { Context, Config } from "@netlify/functions";

export default async (_req: Request, _context: Context) => {
  return new Response(
    JSON.stringify({ ok: true, service: "vortexcore", time: new Date().toISOString() }),
    { headers: { "content-type": "application/json" } }
  );
};

export const config: Config = {
  path: "/health"
};

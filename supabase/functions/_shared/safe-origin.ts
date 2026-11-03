// Returns a trusted app origin for redirect/return URLs. Never trusts the
// caller-supplied Origin header unless it matches the allowlist.
const DEFAULT_ORIGIN = Deno.env.get("APP_URL") || "https://vortexcore.app";
const ALLOWED = new Set(
  [
    DEFAULT_ORIGIN,
    "https://vortexcore.app",
    "https://www.vortexcore.app",
    "https://id-preview--8c01f5d5-9c84-4d3d-abb1-2e89b11166e0.lovable.app",
    "http://localhost:8080",
    ...(Deno.env.get("ALLOWED_ORIGINS") || "").split(","),
  ].map((s) => s.trim().replace(/\/$/, "")).filter(Boolean),
);

export function safeOrigin(req: Request): string {
  const origin = (req.headers.get("origin") || "").replace(/\/$/, "");
  return ALLOWED.has(origin) ? origin : DEFAULT_ORIGIN.replace(/\/$/, "");
}

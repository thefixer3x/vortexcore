/**
 * Returns `value` only if it is a same-origin path ("/settings?plan=pro"), so a
 * `?redirect=` parameter can never send someone to another site after login.
 */
export function safeRedirect(value: string | null | undefined, fallback = "/dashboard"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  return value;
}

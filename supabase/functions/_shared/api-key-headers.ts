// Opaque API keys belong in apikey, never in the JWT bearer header.
export function apiKeyHeaders(key: string, initial?: HeadersInit): Headers {
  const headers = new Headers(initial);
  if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
    headers.delete("Authorization");
  }
  headers.set("apikey", key);
  return headers;
}
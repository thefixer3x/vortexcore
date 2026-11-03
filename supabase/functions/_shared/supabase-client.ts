import { createClient as createSdkClient } from "npm:@supabase/supabase-js@2.104.1";
import { apiKeyHeaders } from "./api-key-headers.ts";

// Separate clients keep verified caller JWTs out of privileged server requests.
export function createClient(
  url: string,
  key: string,
  options: Parameters<typeof createSdkClient>[2] = {},
) {
  if (!url || !key) throw new Error("Supabase API key configuration is missing");
  const transport = options?.global?.fetch ?? fetch;
  return createSdkClient(url, key, {
    ...options,
    auth: { ...options?.auth, persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      ...options?.global,
      fetch: (input, init) => {
        const original = input instanceof Request ? input.headers : undefined;
        return transport(input, { ...init, headers: apiKeyHeaders(key, init?.headers ?? original) });
      },
    },
  });
}
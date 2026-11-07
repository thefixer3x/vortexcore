// Modern Supabase publishable key (safe for the browser). Legacy anon JWT keys
// are disabled on this project, so an env value that is not a publishable key
// falls back to this one.
export const MODERN_PUBLISHABLE_KEY = "sb_publishable_QDb3q6FGi961CWc7hF1eQA_SWfAbb9D";

export function resolvePublishableKey(envKey: string | undefined): string {
  return envKey && envKey.startsWith("sb_publishable_") ? envKey : MODERN_PUBLISHABLE_KEY;
}

// Pure subscription tier/status logic — no Deno or Node dependencies.
// Imported by check-subscription Edge Function and browser Vitest tests.

export const PRO_PRICE_ID =
  (typeof Deno !== "undefined" ? Deno.env.get("STRIPE_PRO_PRICE_ID") : null) ||
  "price_1RiSAL2KF4vMCpn8wUyDio3N";

export const ENT_PRICE_ID =
  (typeof Deno !== "undefined" ? Deno.env.get("STRIPE_ENT_PRICE_ID") : null) ||
  "price_1RiSAi2KF4vMCpn8B18AAI8v";

export function resolveTier(priceId: string | null): string {
  if (priceId === PRO_PRICE_ID) return "pro";
  if (priceId === ENT_PRICE_ID) return "enterprise";
  return "free";
}

export function mapStatus(
  stripeStatus: string
): "none" | "active" | "trialing" | "past_due" | "canceled" {
  switch (stripeStatus) {
    case "active":
    case "trialing":
      return stripeStatus as "active" | "trialing";
    case "past_due":
      return "past_due";
    case "canceled":
    case "incomplete":
    case "incomplete_expired":
      return "canceled";
    default:
      return "none";
  }
}

// Returns the tier that should be exposed to the client for a given subscription state.
// This is the single source of truth for the entitlement read-path.
export function computeClientTier(args: {
  status: string;
  priceId: string | null;
}): { tier: string; subscribed: boolean; mappedStatus: ReturnType<typeof mapStatus> } {
  const mappedStatus = mapStatus(args.status);
  const tier = resolveTier(args.priceId);
  const subscribed = mappedStatus === "active" || mappedStatus === "trialing";
  return { tier, subscribed, mappedStatus };
}

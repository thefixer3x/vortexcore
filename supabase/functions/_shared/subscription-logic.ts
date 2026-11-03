// Pure subscription tier/status logic — no Deno or Node dependencies.
// Imported by check-subscription Edge Function and browser Vitest tests.

export const PRO_PRICE_ID =
  (typeof Deno !== "undefined" ? Deno.env.get("STRIPE_PRO_PRICE_ID") : null) ||
  "price_1UOr872KF4vMCpn81Q4FSS67";

export const ENT_PRICE_ID =
  (typeof Deno !== "undefined" ? Deno.env.get("STRIPE_ENT_PRICE_ID") : null) ||
  "price_1UOr882KF4vMCpn8mLZJAN20";

// ---------------------------------------------------------------------------
// Billing catalog — single source of truth for tiers and price labels.
// See docs/billing/STRIPE_CATALOG.md for the conventions and the checklist for
// adding a tier, product, or project.
// ---------------------------------------------------------------------------

export const TIERS = ["free", "hobby", "pro", "enterprise"] as const;
export type Tier = (typeof TIERS)[number];

export function isTier(value: unknown): value is Tier {
  return typeof value === "string" && (TIERS as readonly string[]).includes(value);
}

// Entitlements per tier. Provisional defaults until UAT: paid tiers all get
// advanced models (the pre-catalog behaviour); daily queries ramp 10/50/100/500.
export const TIER_ENTITLEMENTS: Record<
  Tier,
  { maxQueriesPerDay: number; paidAdvancedModels: boolean }
> = {
  free: { maxQueriesPerDay: 10, paidAdvancedModels: false },
  hobby: { maxQueriesPerDay: 50, paidAdvancedModels: true },
  pro: { maxQueriesPerDay: 100, paidAdvancedModels: true },
  enterprise: { maxQueriesPerDay: 500, paidAdvancedModels: true },
};

// The user_tiers row for a tier. Advanced models only while the subscription
// is actually active/trialing.
export function entitlementsFor(tier: Tier, isActive: boolean) {
  const e = TIER_ENTITLEMENTS[tier];
  return {
    tier_name: tier,
    max_queries_per_day: e.maxQueriesPerDay,
    can_use_advanced_models: isActive && e.paidAdvancedModels,
  };
}

export type CatalogEntry = {
  project: string;
  tier: Tier;
  billing: "monthly" | "yearly" | "one_time";
};

// Stripe price id -> label. The read path (check-subscription) only has the
// stored price_id, so every sellable price must be listed here. The same
// labels live on the Stripe price as metadata (project / tier / billing) and
// as lookup_key `{project}_{tier}_{billing}`.
export const PRICE_CATALOG: Record<string, CatalogEntry> = {
  // vortexcore (catalog_version 1)
  price_1UOr852KF4vMCpn8TlJ5MMn9: { project: "vortexcore", tier: "hobby", billing: "monthly" },
  price_1UOr872KF4vMCpn81Q4FSS67: { project: "vortexcore", tier: "pro", billing: "monthly" },
  price_1UOr882KF4vMCpn8mLZJAN20: { project: "vortexcore", tier: "enterprise", billing: "monthly" },
  // Other projects' prices (SubTrack and others) are deliberately absent: the
  // Stripe account is shared, but entitlements are per app.
};

export const PROJECT = "vortexcore";

/**
 * True when a price belongs to VortexCore: listed in the catalog, or tagged
 * `metadata.project = "vortexcore"` (prices created from the admin pricing
 * screen). Every other project's subscription must be ignored, so it can never
 * grant, change or revoke a VortexCore tier.
 */
export function isVortexCorePrice(priceId: string | null, metadataProject?: unknown): boolean {
  if (priceId && PRICE_CATALOG[priceId]) return PRICE_CATALOG[priceId].project === PROJECT;
  if (priceId === PRO_PRICE_ID || priceId === ENT_PRICE_ID) return true;
  return metadataProject === PROJECT;
}

// Resolution order: env-overridden ids, then the catalog, then the price's own
// `tier` metadata (lets an admin-created VortexCore price entitle correctly
// before the catalog is redeployed), else free. A price from another project
// always resolves to free: one Stripe account, separate entitlements per app.
export function resolveTier(
  priceId: string | null,
  metadataTier?: unknown,
  metadataProject?: unknown,
): Tier {
  if (priceId === PRO_PRICE_ID) return "pro";
  if (priceId === ENT_PRICE_ID) return "enterprise";
  if (priceId && PRICE_CATALOG[priceId]) {
    return PRICE_CATALOG[priceId].project === PROJECT ? PRICE_CATALOG[priceId].tier : "free";
  }
  if (metadataProject === PROJECT && isTier(metadataTier)) return metadataTier;
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

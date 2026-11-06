/**
 * Entitlements: which tier a Stripe price grants in one app.
 *
 * Several apps share one Stripe account, so a price only ever grants a tier in
 * the app it was made for. The rules, in order:
 *   1. A price listed in the app's catalog grants the catalog's tier, but only
 *      when the catalog entry belongs to this project.
 *   2. Otherwise a price tagged `metadata.project = <project>` grants
 *      `metadata.tier`, if that is one of the app's tiers.
 *   3. Anything else grants the fallback tier (normally "free").
 * Price nicknames and product names are never read: they are free text, and a
 * renamed product must not change what someone has paid for.
 */

/** The parts of a Stripe Price this module reads. Structural, so no Stripe SDK is needed. */
export interface PriceLike {
  id?: string | null;
  lookup_key?: string | null;
  metadata?: Record<string, string | undefined> | null;
}

export type Billing = 'monthly' | 'yearly' | 'one_time';

export interface CatalogEntry<T extends string> {
  project: string;
  tier: T;
  billing: Billing;
}

export interface EntitlementConfig<T extends string> {
  /** The app's project key, as written in `metadata.project` and lookup keys, e.g. "subtrack". */
  project: string;
  /** Every tier the app knows. */
  tiers: readonly T[];
  /** The tier granted when a price grants nothing. */
  fallbackTier: T;
  /** Optional price id → entry map, for prices whose metadata cannot be read at that point. */
  catalog?: Readonly<Record<string, CatalogEntry<T>>>;
}

export interface EntitlementResolver<T extends string> {
  readonly project: string;
  isTier(value: unknown): value is T;
  /** True when the price belongs to this app. */
  isProjectPrice(price: PriceLike | null | undefined): boolean;
  /** The tier the price grants in this app. */
  resolveTier(price: PriceLike | null | undefined): T;
  /** Resolve from a stored price id only (no metadata available). */
  resolveTierFromPriceId(priceId: string | null | undefined): T;
  /**
   * Resolve from every price on a subscription (e.g. `items.data.map(i => i.price)`).
   * The first price that belongs to this app decides; prices from other apps are
   * skipped, so an unrelated first item never hides this app's tier.
   */
  resolveTierFromPrices(prices: Iterable<PriceLike | null | undefined> | null | undefined): T;
}

export function createEntitlementResolver<T extends string>(
  config: EntitlementConfig<T>,
): EntitlementResolver<T> {
  const { project, tiers, fallbackTier, catalog = {} } = config;
  if (!project) throw new Error('fin-core: project is required');
  if (!tiers.includes(fallbackTier)) throw new Error('fin-core: fallbackTier must be one of tiers');

  const isTier = (value: unknown): value is T =>
    typeof value === 'string' && (tiers as readonly string[]).includes(value);

  const catalogEntry = (id: string | null | undefined) =>
    id && Object.prototype.hasOwnProperty.call(catalog, id) ? catalog[id] : undefined;

  const isProjectPrice = (price: PriceLike | null | undefined): boolean => {
    if (!price) return false;
    const entry = catalogEntry(price.id);
    if (entry) return entry.project === project;
    return price.metadata?.project === project;
  };

  const resolveTier = (price: PriceLike | null | undefined): T => {
    if (!price) return fallbackTier;
    const entry = catalogEntry(price.id);
    if (entry) return entry.project === project && isTier(entry.tier) ? entry.tier : fallbackTier;
    const meta = price.metadata;
    if (meta?.project === project && isTier(meta.tier)) return meta.tier;
    return fallbackTier;
  };

  return {
    project,
    isTier,
    isProjectPrice,
    resolveTier,
    resolveTierFromPriceId: (priceId) => resolveTier(priceId ? { id: priceId } : null),
    resolveTierFromPrices: (prices) => {
      for (const price of prices ?? []) {
        if (isProjectPrice(price)) return resolveTier(price);
      }
      return fallbackTier;
    },
  };
}

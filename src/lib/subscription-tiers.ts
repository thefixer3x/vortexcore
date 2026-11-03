export interface TierFeature {
  label: string;
  /** Set when the feature is on the roadmap but not yet built — never advertise it as active. */
  comingSoon?: boolean;
}

/**
 * Fallback plan list. The live plans (prices, features, Stripe prices) are
 * edited by admins and read from `vortex_pricing_tiers`; these values are only
 * shown if that list can't be loaded. Stripe prices are VortexCore's own.
 */
export const TIERS = {
  free: {
    name: 'Free',
    price: 0,
    priceId: null,
    features: [
      { label: 'Basic dashboard' },
      { label: 'Up to 3 virtual cards' },
      { label: '10 VortexAI questions a day' },
    ] as TierFeature[],
  },
  hobby: {
    name: 'Hobby',
    price: 9.99,
    priceId: 'price_1UOr852KF4vMCpn8TlJ5MMn9',
    features: [
      { label: 'Everything in Free' },
      { label: '50 VortexAI questions a day' },
      { label: 'Advanced VortexAI answers' },
      { label: 'Bank statement import' },
    ] as TierFeature[],
  },
  pro: {
    name: 'Pro',
    price: 29.99,
    priceId: 'price_1UOr872KF4vMCpn81Q4FSS67',
    features: [
      { label: 'Detailed VortexAI Insights' },
      { label: 'Unlimited virtual cards' },
      { label: '100 VortexAI questions a day' },
      { label: 'Advanced analytics' },
    ] as TierFeature[],
  },
  enterprise: {
    name: 'Enterprise',
    price: 49.99,
    priceId: 'price_1UOr882KF4vMCpn8mLZJAN20',
    features: [
      { label: 'Everything in Pro' },
      { label: '500 VortexAI questions a day' },
      { label: 'Multiple sub-users', comingSoon: true },
      { label: 'Dedicated support', comingSoon: true },
    ] as TierFeature[],
  },
} as const;

export type TierKey = keyof typeof TIERS;

export function resolveTierFromPriceId(priceId: string | null | undefined): TierKey {
  for (const key of Object.keys(TIERS) as TierKey[]) {
    if (priceId && TIERS[key].priceId === priceId) return key;
  }
  return 'free';
}

export interface TierFeature {
  label: string;
  /** Set when the feature is on the roadmap but not yet built — never advertise it as active. */
  comingSoon?: boolean;
}

export const TIERS = {
  free: {
    name: 'Free',
    price: 0,
    priceId: null,
    features: [
      { label: 'Basic dashboard' },
      { label: 'Up to 3 virtual cards' },
      { label: 'Standard AI responses' },
    ] as TierFeature[],
  },
  pro: {
    name: 'Pro',
    price: 4.99,
    priceId: 'price_1RiSAL2KF4vMCpn8wUyDio3N',
    features: [
      { label: 'Detailed VortexAI Insights' },
      { label: 'Unlimited virtual cards' },
      { label: 'Priority AI responses' },
      { label: 'Advanced analytics' },
    ] as TierFeature[],
  },
  enterprise: {
    name: 'Enterprise',
    price: 9.99,
    priceId: 'price_1RiSAi2KF4vMCpn8B18AAI8v',
    features: [
      { label: 'Everything in Pro' },
      { label: 'Multiple sub-users', comingSoon: true },
      { label: 'Access to instant credit', comingSoon: true },
      { label: 'Dedicated support', comingSoon: true },
    ] as TierFeature[],
  },
} as const;

export type TierKey = keyof typeof TIERS;

export function resolveTierFromPriceId(priceId: string | null | undefined): TierKey {
  if (priceId === TIERS.pro.priceId) return 'pro';
  if (priceId === TIERS.enterprise.priceId) return 'enterprise';
  return 'free';
}

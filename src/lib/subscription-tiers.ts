export const TIERS = {
  free: {
    name: 'Free',
    price: 0,
    priceId: null,
    features: [
      'Basic dashboard',
      'Up to 3 virtual cards',
      'Standard AI responses',
    ],
  },
  pro: {
    name: 'Pro',
    price: 4.99,
    priceId: 'price_1RiSAL2KF4vMCpn8wUyDio3N',
    features: [
      'Detailed VortexAI Insights',
      'Unlimited virtual cards',
      'Priority AI responses',
      'Advanced analytics',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    price: 9.99,
    priceId: 'price_1RiSAi2KF4vMCpn8B18AAI8v',
    features: [
      'Everything in Pro',
      'Multiple sub-users',
      'Access to instant credit',
      'Dedicated support',
    ],
  },
} as const;

export type TierKey = keyof typeof TIERS;

export function resolveTierFromPriceId(priceId: string | null | undefined): TierKey {
  if (priceId === TIERS.pro.priceId) return 'pro';
  if (priceId === TIERS.enterprise.priceId) return 'enterprise';
  return 'free';
}

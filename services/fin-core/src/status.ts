/** Stripe subscription status → what an app should grant. */

export type MappedStatus = 'none' | 'active' | 'trialing' | 'past_due' | 'canceled';

export function mapSubscriptionStatus(stripeStatus: string | null | undefined): MappedStatus {
  switch (stripeStatus) {
    case 'active':
    case 'trialing':
    case 'past_due':
      return stripeStatus;
    case 'canceled':
    case 'unpaid':
    case 'incomplete':
    case 'incomplete_expired':
      return 'canceled';
    default:
      return 'none';
  }
}

/**
 * Whether the paid tier applies right now. `past_due` is excluded by default;
 * pass `{ graceOnPastDue: true }` to keep access while Stripe retries payment.
 */
export function isEntitledStatus(
  stripeStatus: string | null | undefined,
  options: { graceOnPastDue?: boolean } = {},
): boolean {
  const s = mapSubscriptionStatus(stripeStatus);
  return s === 'active' || s === 'trialing' || (s === 'past_due' && options.graceOnPastDue === true);
}

import { describe, expect, it } from 'vitest';
import { isEntitledStatus, mapSubscriptionStatus } from '../src/index.js';

describe('subscription status', () => {
  it('maps Stripe statuses', () => {
    expect(mapSubscriptionStatus('active')).toBe('active');
    expect(mapSubscriptionStatus('past_due')).toBe('past_due');
    expect(mapSubscriptionStatus('unpaid')).toBe('canceled');
    expect(mapSubscriptionStatus('incomplete_expired')).toBe('canceled');
    expect(mapSubscriptionStatus('paused')).toBe('none');
    expect(mapSubscriptionStatus(undefined)).toBe('none');
  });

  it('grants access only while active or trialing, unless grace is asked for', () => {
    expect(isEntitledStatus('active')).toBe(true);
    expect(isEntitledStatus('trialing')).toBe(true);
    expect(isEntitledStatus('past_due')).toBe(false);
    expect(isEntitledStatus('past_due', { graceOnPastDue: true })).toBe(true);
    expect(isEntitledStatus('canceled', { graceOnPastDue: true })).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import { createEntitlementResolver } from '../src/index.js';

const subtrack = createEntitlementResolver({
  project: 'subtrack',
  tiers: ['free', 'pro', 'team'] as const,
  fallbackTier: 'free',
});

const vortex = createEntitlementResolver({
  project: 'vortexcore',
  tiers: ['free', 'hobby', 'pro', 'enterprise'] as const,
  fallbackTier: 'free',
  catalog: {
    price_vc_pro: { project: 'vortexcore', tier: 'pro', billing: 'monthly' },
    price_st_pro: { project: 'subtrack', tier: 'pro', billing: 'monthly' },
  },
});

describe('createEntitlementResolver', () => {
  it('grants the tier from metadata for this project', () => {
    expect(subtrack.resolveTier({ id: 'p1', metadata: { project: 'subtrack', tier: 'team' } })).toBe('team');
    expect(subtrack.isProjectPrice({ metadata: { project: 'subtrack' } })).toBe(true);
  });

  it("never grants a tier from another project's price", () => {
    const vcPrice = { id: 'p2', metadata: { project: 'vortexcore', tier: 'pro' } };
    expect(subtrack.resolveTier(vcPrice)).toBe('free');
    expect(subtrack.isProjectPrice(vcPrice)).toBe(false);
    // A catalog entry for another project resolves to the fallback, even with matching metadata.
    expect(vortex.resolveTier({ id: 'price_st_pro', metadata: { project: 'vortexcore', tier: 'pro' } })).toBe('free');
  });

  it('prefers the catalog over metadata', () => {
    expect(vortex.resolveTier({ id: 'price_vc_pro', metadata: { project: 'vortexcore', tier: 'enterprise' } })).toBe('pro');
    expect(vortex.resolveTierFromPriceId('price_vc_pro')).toBe('pro');
    expect(vortex.resolveTierFromPriceId('price_unknown')).toBe('free');
  });

  it('ignores unknown tiers, missing metadata and nicknames', () => {
    expect(subtrack.resolveTier({ metadata: { project: 'subtrack', tier: 'enterprise' } })).toBe('free');
    expect(subtrack.resolveTier({ id: 'p3' })).toBe('free');
    expect(subtrack.resolveTier({ id: 'p4', nickname: 'Team plan' } as never)).toBe('free');
    expect(subtrack.resolveTier(null)).toBe('free');
  });

  it('does not treat prototype keys as catalog entries', () => {
    expect(vortex.resolveTierFromPriceId('constructor')).toBe('free');
    expect(vortex.isProjectPrice({ id: 'toString' })).toBe(false);
  });

  it('rejects a bad config', () => {
    expect(() => createEntitlementResolver({ project: '', tiers: ['free'], fallbackTier: 'free' })).toThrow();
    expect(() => createEntitlementResolver({ project: 'x', tiers: ['free'] as string[], fallbackTier: 'pro' })).toThrow();
  });

  it('resolves a multi-item subscription from the first price of this app', () => {
    const items = [
      { id: 'other', metadata: { project: 'vortexcore', tier: 'pro' } },
      null,
      { id: 'mine', metadata: { project: 'subtrack', tier: 'team' } },
    ];
    expect(subtrack.resolveTierFromPrices(items)).toBe('team');
    expect(subtrack.resolveTierFromPrices([items[0]])).toBe('free');
    expect(subtrack.resolveTierFromPrices(undefined)).toBe('free');
  });
});

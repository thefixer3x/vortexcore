import { describe, it, expect } from 'vitest'
import {
  PRICE_CATALOG,
  TIERS,
  TIER_ENTITLEMENTS,
  entitlementsFor,
  isTier,
  resolveTier,
} from '../../../../supabase/functions/_shared/subscription-logic'

// Unlike subscription-tier.test.ts (which re-implements the functions), this
// imports the real shared module that both the stripe-webhook function and the
// check-subscription read path use, so catalog drift is caught here.

const VORTEXCORE = {
  hobby: 'price_1UOr852KF4vMCpn8TlJ5MMn9',
  pro: 'price_1UOr872KF4vMCpn81Q4FSS67',
  enterprise: 'price_1UOr882KF4vMCpn8mLZJAN20',
}
const SUBTRACK_PRO = 'price_1RiSAL2KF4vMCpn8wUyDio3N'
const SUBTRACK_ENT = 'price_1RiSAi2KF4vMCpn8B18AAI8v'

describe('billing catalog', () => {
  it('lists the four tiers in progressive order', () => {
    expect([...TIERS]).toEqual(['free', 'hobby', 'pro', 'enterprise'])
  })

  it('has entitlements for every tier, with strictly increasing daily queries', () => {
    const queries = TIERS.map((t) => TIER_ENTITLEMENTS[t].maxQueriesPerDay)
    expect(queries).toEqual([...queries].sort((a, b) => a - b))
    expect(new Set(queries).size).toBe(TIERS.length)
  })

  it('every catalog entry uses a known tier', () => {
    for (const entry of Object.values(PRICE_CATALOG)) {
      expect(isTier(entry.tier)).toBe(true)
    }
  })

  it.each(Object.entries(VORTEXCORE))('vortexcore %s price resolves to its tier', (tier, id) => {
    expect(resolveTier(id)).toBe(tier)
    expect(PRICE_CATALOG[id].project).toBe('vortexcore')
  })

  it('legacy SubTrack prices keep resolving to pro / enterprise', () => {
    expect(resolveTier(SUBTRACK_PRO)).toBe('pro')
    expect(resolveTier(SUBTRACK_ENT)).toBe('enterprise')
  })

  it('an unlisted price falls back to its metadata tier', () => {
    expect(resolveTier('price_new_unlisted', 'hobby')).toBe('hobby')
  })

  it('an unlisted price with bad or missing metadata is free', () => {
    expect(resolveTier('price_new_unlisted', 'platinum')).toBe('free')
    expect(resolveTier('price_new_unlisted')).toBe('free')
    expect(resolveTier(null)).toBe('free')
  })

  it('the catalog wins over metadata', () => {
    expect(resolveTier(VORTEXCORE.pro, 'enterprise')).toBe('pro')
  })

  it('entitlementsFor gates advanced models on an active subscription', () => {
    expect(entitlementsFor('pro', true)).toEqual({
      tier_name: 'pro',
      max_queries_per_day: 100,
      can_use_advanced_models: true,
    })
    expect(entitlementsFor('pro', false).can_use_advanced_models).toBe(false)
    expect(entitlementsFor('free', true).can_use_advanced_models).toBe(false)
    expect(entitlementsFor('hobby', true).max_queries_per_day).toBe(50)
  })
})

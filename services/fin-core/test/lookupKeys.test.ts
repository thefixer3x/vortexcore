import { describe, expect, it } from 'vitest';
import { lookupKey, parseLookupKey } from '../src/index.js';

describe('lookup keys', () => {
  it('builds and parses the convention', () => {
    expect(lookupKey('subtrack', 'pro', 'monthly')).toBe('subtrack_pro_monthly');
    expect(lookupKey('vortexcore', 'enterprise', 'one_time')).toBe('vortexcore_enterprise_one_time');
    expect(parseLookupKey('subtrack_team_monthly')).toEqual({ project: 'subtrack', tier: 'team', billing: 'monthly' });
    expect(parseLookupKey('vortexcore_pro_one_time')).toEqual({ project: 'vortexcore', tier: 'pro', billing: 'one_time' });
  });

  it('rejects anything else', () => {
    expect(() => lookupKey('Sub-Track', 'pro', 'monthly')).toThrow();
    expect(() => lookupKey('subtrack', 'pro', 'weekly' as never)).toThrow();
    expect(parseLookupKey('subtrack_pro')).toBeNull();
    expect(parseLookupKey('a_b_c_monthly')).toBeNull();
    expect(parseLookupKey(undefined)).toBeNull();
  });
});

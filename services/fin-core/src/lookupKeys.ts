/**
 * Stripe lookup keys follow `{project}_{tier}_{billing}`, e.g. `subtrack_pro_monthly`.
 * Checkout resolves prices by lookup key, so code never hard-codes a price id.
 */
import type { Billing } from './entitlements.js';

const PART = /^[a-z0-9]+$/;
const BILLINGS: readonly Billing[] = ['monthly', 'yearly', 'one_time'];

export function lookupKey(project: string, tier: string, billing: Billing): string {
  for (const [name, value] of [['project', project], ['tier', tier]] as const) {
    if (!PART.test(value)) throw new Error(`fin-core: ${name} must be lowercase letters and digits, got "${value}"`);
  }
  if (!BILLINGS.includes(billing)) throw new Error(`fin-core: unknown billing "${billing}"`);
  return `${project}_${tier}_${billing}`;
}

export function parseLookupKey(
  key: string | null | undefined,
): { project: string; tier: string; billing: Billing } | null {
  if (!key) return null;
  for (const billing of BILLINGS) {
    const suffix = `_${billing}`;
    if (!key.endsWith(suffix)) continue;
    const [project, tier, ...rest] = key.slice(0, -suffix.length).split('_');
    if (rest.length || !project || !tier || !PART.test(project) || !PART.test(tier)) return null;
    return { project, tier, billing };
  }
  return null;
}

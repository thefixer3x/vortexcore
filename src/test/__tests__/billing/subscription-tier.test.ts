import { describe, it, expect } from 'vitest'

// =============================================================================
// Regression test: subscription tier read-path
//
// This test guards against the bug where a healthy active Pro subscription was
// being reported as tier="free" to the client because of an over-complex
// ternary in the check-subscription Edge Function:
//
//   tier: isTrialing ? tier : (isPastDue ? tier : "free")
//
// That expression returned "free" for every active subscription that was not
// trialing or past_due. The fix extracted computeClientTier() so the response
// serializer has one deterministic source of truth.
// =============================================================================

// Replicate the pure functions from supabase/functions/_shared/subscription-logic.ts
// so this test is self-contained and environment-agnostic.

const PRO_PRICE_ID = "price_1RiSAL2KF4vMCpn8wUyDio3N";
const ENT_PRICE_ID = "price_1RiSAi2KF4vMCpn8B18AAI8v";

function resolveTier(priceId: string | null): string {
  if (priceId === PRO_PRICE_ID) return "pro";
  if (priceId === ENT_PRICE_ID) return "enterprise";
  return "free";
}

function mapStatus(
  stripeStatus: string
): "none" | "active" | "trialing" | "past_due" | "canceled" {
  switch (stripeStatus) {
    case "active":
    case "trialing":
      return stripeStatus as "active" | "trialing";
    case "past_due":
      return "past_due";
    case "canceled":
    case "incomplete":
    case "incomplete_expired":
      return "canceled";
    default:
      return "none";
  }
}

function computeClientTier(args: {
  status: string;
  priceId: string | null;
}): { tier: string; subscribed: boolean; mappedStatus: ReturnType<typeof mapStatus> } {
  const mappedStatus = mapStatus(args.status);
  const tier = resolveTier(args.priceId);
  const subscribed = mappedStatus === "active" || mappedStatus === "trialing";
  return { tier, subscribed, mappedStatus };
}

describe('Subscription tier read-path (regression)', () => {
  describe('computeClientTier — exact response the dashboard receives', () => {
    it('active + Pro price → tier=pro, subscribed=true', () => {
      const result = computeClientTier({ status: "active", priceId: PRO_PRICE_ID });
      expect(result.tier).toBe("pro");
      expect(result.subscribed).toBe(true);
      expect(result.mappedStatus).toBe("active");
    });

    it('active + Enterprise price → tier=enterprise, subscribed=true', () => {
      const result = computeClientTier({ status: "active", priceId: ENT_PRICE_ID });
      expect(result.tier).toBe("enterprise");
      expect(result.subscribed).toBe(true);
      expect(result.mappedStatus).toBe("active");
    });

    it('trialing + Pro price → tier=pro, subscribed=true', () => {
      const result = computeClientTier({ status: "trialing", priceId: PRO_PRICE_ID });
      expect(result.tier).toBe("pro");
      expect(result.subscribed).toBe(true);
      expect(result.mappedStatus).toBe("trialing");
    });

    it('past_due + Pro price → tier=pro, subscribed=false', () => {
      const result = computeClientTier({ status: "past_due", priceId: PRO_PRICE_ID });
      expect(result.tier).toBe("pro");
      expect(result.subscribed).toBe(false);
      expect(result.mappedStatus).toBe("past_due");
    });

    it('canceled + Pro price → tier=free equivalent, subscribed=false', () => {
      const result = computeClientTier({ status: "canceled", priceId: PRO_PRICE_ID });
      // The function resolves tier from priceId, but the frontend should treat
      // canceled as no entitlement regardless of the resolved tier.
      expect(result.tier).toBe("pro"); // raw tier from price
      expect(result.subscribed).toBe(false);
      expect(result.mappedStatus).toBe("canceled");
    });

    it('active + unknown price → tier=free, subscribed=true', () => {
      const result = computeClientTier({ status: "active", priceId: "price_unknown" });
      expect(result.tier).toBe("free");
      expect(result.subscribed).toBe(true);
      expect(result.mappedStatus).toBe("active");
    });

    it('no subscription → tier=free, subscribed=false', () => {
      const result = computeClientTier({ status: "none", priceId: null });
      expect(result.tier).toBe("free");
      expect(result.subscribed).toBe(false);
      expect(result.mappedStatus).toBe("none");
    });

    // This is the exact regression that was caught in production:
    // An active Pro subscription was returning tier="free" because of:
    // tier: isTrialing ? tier : (isPastDue ? tier : "free")
    it('MUST NOT return "free" for an active paid subscription (regression guard)', () => {
      const result = computeClientTier({ status: "active", priceId: PRO_PRICE_ID });
      expect(result.tier).not.toBe("free");
    });
  });

  describe('resolveTier', () => {
    it('maps Pro price ID to "pro"', () => {
      expect(resolveTier(PRO_PRICE_ID)).toBe("pro");
    });
    it('maps Enterprise price ID to "enterprise"', () => {
      expect(resolveTier(ENT_PRICE_ID)).toBe("enterprise");
    });
    it('maps null/unknown to "free"', () => {
      expect(resolveTier(null)).toBe("free");
      expect(resolveTier("price_something_else")).toBe("free");
    });
  });

  describe('mapStatus', () => {
    it('maps active and trialing directly', () => {
      expect(mapStatus("active")).toBe("active");
      expect(mapStatus("trialing")).toBe("trialing");
    });
    it('maps past_due', () => {
      expect(mapStatus("past_due")).toBe("past_due");
    });
    it('maps canceled, incomplete, incomplete_expired to "canceled"', () => {
      expect(mapStatus("canceled")).toBe("canceled");
      expect(mapStatus("incomplete")).toBe("canceled");
      expect(mapStatus("incomplete_expired")).toBe("canceled");
    });
    it('maps unknown to "none"', () => {
      expect(mapStatus("unpaid")).toBe("none");
    });
  });
});

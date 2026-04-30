# ADR-002: Stripe Subscription Billing

**Date:** 2026-04-26
**Status:** Accepted

## Context

VortexCore needed a subscription tier system with three levels:
- **free**: 10 queries/day, no advanced models
- **pro**: 100 queries/day, advanced models
- **enterprise**: 500 queries/day, advanced models

## Decision

Webhook-driven subscription management with edge function for status checks:

### Webhook Handler (`stripe-webhook/index.ts`)
- Handles `customer.subscription.created`, `updated`, `deleted`
- Updates two tables atomically: `stripe_subscriptions` + `user_tiers`
- Tier resolution from price ID (env-gated: `STRIPE_PRO_PRICE_ID`, `STRIPE_ENT_PRICE_ID`)
- Uses service role key for admin writes

### Subscription Checker (`check-subscription/index.ts`)
- Auth-gated (requires valid Supabase session)
- Returns: `{ subscribed, status, tier, currentPeriodEnd, cancelAt }`
- Queries `stripe_customers` → `stripe_subscriptions` join

### Database Schema

**`stripe_customers`** — maps Stripe customer ID to user
**`stripe_subscriptions`** — raw Stripe subscription data
**`user_tiers`** — computed tier state for fast lookups

## Alternatives Considered

- **Real-time Stripe API calls**: Rejected — too slow for every request
- **Client-side tier checks**: Rejected — security risk, users could fake tier

## Consequences

**Positive:**
- Fast tier lookups (local table, no Stripe API call)
- Webhook keeps local state in sync
- Tier changes propagate within seconds of Stripe confirmation

**Negative:**
- Webhook dependency — if Stripe can't reach us, tier updates lag
- Need to handle duplicate webhooks idempotently (upsert handles this)
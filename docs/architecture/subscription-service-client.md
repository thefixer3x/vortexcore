# Subscription Service — VortexCore Client View

**Status:** Design review · **Date:** 2026-04-28 · **Scope:** How VortexCore consumes the centralized subscription service.

> **Authoritative spec:** `the-fixer-initiative/docs/architecture/subscription-service.md` — the service itself (multi-tenant, multi-provider) is owned by fixer-initiative. This doc captures what changes inside VortexCore as a tenant.

> **Out of scope (stays in VortexCore):** Stripe Issuing (virtual cards) — separate Stripe account, sensitive PAN flow, no multi-hop routing. Issuing code at `supabase/functions/stripe/` and `src/lib/stripe.ts` (Issuing helpers) does **not** move.

> **No implementation.** This document is for review only. The original multi-provider design (interface + provider classes + router) was relocated to the fixer-initiative repo because it belongs to the centralized service. VortexCore becomes a thin client.

---

## 1. Current State

Edge functions (Stripe-only):

| Function | Responsibility | Key DB writes |
|----------|----------------|----------------|
| `create-checkout-session` | Create Stripe Checkout Session | Upsert `stripe_customers` |
| `customer-portal` | Stripe billing portal URL | Read `stripe_customers` |
| `check-subscription` | Return tier to frontend | Read `stripe_subscriptions` |
| `stripe-webhook` | Sync subscription events → DB | Upsert `stripe_subscriptions`, `user_tiers` |

Frontend: `SubscriptionContext.tsx` polls `check-subscription` every 10 min. `subscription-tiers.ts` hardcodes two Stripe price IDs.

DB: `stripe_customers` (user_id → Stripe customer_id), `stripe_subscriptions` (Stripe sub_id → customer_id), `user_tiers` (user_id → tier + quotas). No `provider` field anywhere.

**Gap:** No provider abstraction, no multi-currency pricing, no local payment rails for African markets.

---

## 2. Proposed Interface

### 2.1 PaymentProvider interface

```typescript
// src/lib/payment/providers/types.ts

export type ProviderKey = 'stripe' | 'paystack' | 'flutterwave';

export interface CheckoutOptions {
  userId: string;
  tier: 'pro' | 'enterprise';
  successUrl: string;
  cancelUrl: string;
  // provider-filled
  email?: string;
  currency?: string;
  amount?: number;
}

export interface PortalOptions {
  userId: string;
  returnUrl: string;
}

export interface SubscriptionInfo {
  subscribed: boolean;
  status: 'none' | 'active' | 'trialing' | 'past_due' | 'canceled';
  tier: 'free' | 'pro' | 'enterprise';
  currentPeriodEnd: string | null;
  cancelAt: string | null;
  provider: ProviderKey;
}

export interface PaymentProvider {
  key: ProviderKey;

  /** Create a checkout/hosted-page session and return the redirect URL */
  createCheckout(opts: CheckoutOptions): Promise<{ url: string }>;

  /** Open self-service billing portal */
  openPortal(opts: PortalOptions): Promise<{ url: string }>;

  /** Verify and parse a raw webhook body + signature header */
  verifyWebhook(
    rawBody: string,
    headers: Record<string, string>
  ): Promise<WebhookEvent>;

  /** Fetch current subscription state for a user */
  getSubscription(userId: string): Promise<SubscriptionInfo>;

  /** Cancel an active subscription */
  cancelSubscription(userId: string): Promise<void>;
}

export type WebhookEvent =
  | { type: 'subscription.created' | 'subscription.updated'; data: SubscriptionInfo }
  | { type: 'subscription.deleted'; data: { userId: string } }
  | { type: 'unknown'; raw: unknown };
```

### 2.2 Provider implementations (interface contract)

```typescript
// src/lib/payment/providers/stripe-provider.ts

export class StripeProvider implements PaymentProvider {
  key = 'stripe' as const;

  async createCheckout({ userId, tier, successUrl, cancelUrl }) {
    const customerId = await this.resolveCustomerId(userId);
    const priceId = resolvePriceIdForTier(tier); // from price_book
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
    });
    return { url: session.url! };
  }

  async verifyWebhook(rawBody: string, headers: Record<string, string>) {
    const sig = headers['stripe-signature'];
    const event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    return mapStripeEvent(event); // translate to WebhookEvent shape
  }

  async getSubscription(userId: string) {
    // existing check-subscription logic, adapted
  }

  async cancelSubscription(userId: string) {
    // stripe.billingPortal.sessions.create + redirect, or subscriptions.update
  }
}
```

**PaystackProvider notes:**

- Subscriptions are limited on Paystack — only supports invoice mode, not the authorize + draft_invoice pattern Stripe uses. You create a transaction authorization, then charge it. For recurring billing, you must use `stop`/`resume` on autorenew, not Stripe-style `cancel_at_period_end`.
- Checkout → `transaction.initialize` returns an `authorization_url`. No hosted checkout page like Stripe — you redirect to Paystack's hosted page.
- Webhook: Paystack uses `x-paystack-signature` header, SHA256 HMAC of raw body against `PAYSTACK_SECRET_KEY`.
- Customer model: Paystack uses `customer_code` (string), not a numeric ID. Store as `paystack_customer_code`.

**FlutterwaveProvider notes:**

- Checkout → `FLWPaymentEndpoint/payments` returns a `data.link` (redirect URL).
- Webhook: Flutterwave uses `Verifi-Fraud` header with SHA256 HMAC.
- Flutterwave has a `verify_transaction` endpoint to reconcile events.
- Subscription lifecycle differs from Stripe — `cancel()` is immediate, not end-of-period.

---

## 3. Routing Logic

```typescript
// src/lib/payment/router.ts

export interface RouteContext {
  userCountry: string | null;   // ISO 3166-1 alpha-2, from user profile
  currency: string | null;      // ISO 4217
  tier: 'pro' | 'enterprise';
  amountCents: number;          // converted local price for display
}

type ProviderKey = 'stripe' | 'paystack' | 'flutterwave';

/**
 * Returns the provider to use for a checkout session.
 * Fallback chain: preferred → fallback → stripe (always safe fallback)
 */
export function selectProvider(ctx: RouteContext): ProviderKey {
  const { currency, tier } = ctx;

  // USD/EUR/GBP → Stripe (best FX, card billing)
  if (['USD', 'EUR', 'GBP'].includes(currency?.toUpperCase())) {
    return 'stripe';
  }

  // NGN / KES / GHS → Paystack (local rails, best UX for African users)
  if (['NGN', 'KES', 'GHS'].includes(currency?.toUpperCase())) {
    // Paystack has subscription limits; downgrade enterprise to annual or yearly
    if (tier === 'enterprise') {
      return 'paystack'; // still route to paystack, handle limits in provider
    }
    return 'paystack';
  }

  // Unknown currency → Stripe as safe default
  return 'stripe';
}

/**
 * Returns the effective provider considering fallback.
 * Used for getSubscription and cancelSubscription where the user
 * may have subscribed via a different provider.
 */
export function resolveProviderForUser(
  userId: string,
  preferred: ProviderKey
): ProviderKey {
  // Future: query payment_customers to find which provider the user
  // actually has an active subscription with, if any.
  return preferred;
}
```

**Routing table summary:**

| Currency | Tier | Provider | Why |
|----------|------|----------|-----|
| USD, EUR, GBP | pro/enterprise | Stripe | Best FX, hosted checkout, self-service portal |
| NGN | pro | Paystack | Local rails, NGN settlement, hosted page UX |
| NGN | enterprise | Paystack | Same (Stripe NGN poor FX for enterprise) |
| KES, GHS | any | Paystack | Local rails, KES/GHS settlement only via Paystack |
| Other | any | Stripe | Safe fallback; FX charged to user |

---

## 4. DB Changes

### Option A: Unified `payment_customers` table

```sql
CREATE TABLE public.payment_customers (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider      text NOT NULL CHECK (provider IN ('stripe', 'paystack', 'flutterwave')),
  provider_customer_id text NOT NULL,  -- stripe: customer_id, paystack: customer_code, etc.
  email         text,                  -- provider's customer email
  metadata      jsonb NOT NULL DEFAULT '{}',
  created_at    timestamptz DEFAULT now(),
  UNIQUE (provider, provider_customer_id),
  UNIQUE (provider, user_id)           -- one record per provider per user
);
ALTER TABLE public.payment_customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user owns payment customer" ON public.payment_customers
  FOR ALL USING (auth.uid() = user_id);
```

**Pros:** Single JOIN to find any provider's customer; easy to query "does user have Paystack?"; schema evolution for new providers is additive only.
**Cons:** Requires migration of `stripe_customers` data; FK from `stripe_subscriptions` needs updating.

### Option B: Keep separate tables (`stripe_customers`, `paystack_customers`, `flutterwave_customers`)

**Pros:** Zero migration risk; Stripe flow unchanged until cutover.
**Cons:** N queries to find a customer across providers; adding a new provider = new table + new edge function changes; cannot easily ask "which providers does this user have?"

### Recommendation: Option A — unified `payment_customers`

The Stripe data is migrated once. After that, adding Paystack or Flutterwave requires only inserting into `payment_customers`, not new tables and new JOIN paths throughout the codebase. The `stripe_customers` table can become a view or be dropped after migration.

**Migration of existing `stripe_customers` data:**

```sql
INSERT INTO public.payment_customers (user_id, provider, provider_customer_id, created_at)
SELECT user_id, 'stripe', customer_id, created_at
FROM public.stripe_customers
ON CONFLICT DO NOTHING;
```

### `price_book` table (pricing localization)

```sql
CREATE TABLE public.price_book (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier        text NOT NULL CHECK (tier IN ('pro', 'enterprise')),
  provider    text NOT NULL CHECK (provider IN ('stripe', 'paystack', 'flutterwave')),
  currency    text NOT NULL,          -- ISO 4217
  amount_smallest_unit integer NOT NULL, -- kobo/kopis/etc. — 550000 NGN = ₦5,500.00
  price_id    text NOT NULL,          -- provider's price/plan ID
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  UNIQUE (tier, provider, currency)
);
ALTER TABLE public.price_book ENABLE ROW LEVEL SECURITY;
-- Only service role can write; authenticated users can read.
CREATE POLICY "anyone reads price_book" ON public.price_book FOR SELECT USING (true);
CREATE POLICY "service role writes price_book" ON public.price_book
  FOR INSERT TO authenticated USING (auth.role() = 'service_role');
```

**Example rows:**

| tier | provider | currency | amount_smallest_unit | price_id |
|------|----------|----------|----------------------|----------|
| pro | stripe | USD | 499 | price_1RiSAL2KF4vMCpn8wUyDio3N |
| pro | stripe | EUR | 499 | price_1RiSAL2KF4vMCpn8wUyDio3N |
| pro | paystack | NGN | 550000 | plan_paystack_pro_ngn |
| enterprise | stripe | USD | 999 | price_1RiSAi2KF4vMCpn8B18AAI8v |
| enterprise | paystack | NGN | 1100000 | plan_paystack_ent_ngn |

**Lookup function:**

```typescript
// src/lib/payment/price-book.ts

export async function resolvePriceForTier(
  tier: 'pro' | 'enterprise',
  currency: string,
  provider: ProviderKey
): Promise<{ priceId: string; amountSmallestUnit: number }> {
  const { data } = await supabase
    .from('price_book')
    .select('price_id, amount_smallest_unit')
    .eq('tier', tier)
    .eq('provider', provider)
    .eq('currency', currency.toUpperCase())
    .eq('is_active', true)
    .maybeSingle();

  if (!data) {
    // Fallback to Stripe USD as canonical
    const fallback = await supabase
      .from('price_book')
      .select('price_id, amount_smallest_unit')
      .eq('tier', tier)
      .eq('provider', 'stripe')
      .eq('currency', 'USD')
      .eq('is_active', true)
      .maybeSingle();
    if (!fallback) throw new Error(`No price found for ${tier}/${currency}/${provider}`);
    return fallback;
  }

  return data;
}
```

---

## 5. Webhook Strategy

### Option A: One function per provider (current pattern)

- `stripe-webhook/index.ts` — already exists
- `paystack-webhook/index.ts` — new
- `flutterwave-webhook/index.ts` — new

### Option B: Single `payments-webhook` with provider routing

```typescript
// supabase/functions/payments-webhook/index.ts

serve(withPublicMiddleware(async (req) => {
  const provider = req.headers.get('x-payment-provider'); // set by HTTP trigger config
  const rawBody = await req.text();

  const providerInstance = getProvider(provider); // factory
  const event = await providerInstance.verifyWebhook(rawBody, Object.fromEntries(req.headers));

  // Normalize and write to DB (provider-specific write logic abstracted)
  await handleWebhookEvent(event, provider);
  return Response.json({ ok: true });
}));
```

### Recommendation: Option A (per-provider)

| | Per-provider | Unified |
|---|---|---|
| Signature verification clarity | Each function has its own verification, isolated failure domain | One place but routing logic adds complexity |
| Operational simplicity | Easy to disable one provider by disabling its function | Single point of failure |
| Supabase trigger config | One HTTP trigger per path | One trigger, needs `x-payment-provider` header |
| Debugging | Clear which provider caused issues | Mixed logs require provider tag |
| Adding new provider | New function, zero impact on existing | Edit router, risk of regression |

Keep `stripe-webhook` as-is. Add `paystack-webhook` and `flutterwave-webhook` alongside it. All three write to the same `stripe_subscriptions` / `user_tiers` via normalized handlers, but keyed on `provider`.

---

## 6. Migration Steps (Parallel-Run, No Flag Day)

**Principle:** Stripe remains the default throughout. Paystack is added as a shadow provider that never fires unless explicitly called.

### Step 1 — DB: Add `payment_customers` and `price_book` tables (non-breaking)

- Create `payment_customers` with `provider` column.
- Populate from existing `stripe_customers` via one-time migration SQL.
- Create `price_book` with existing Stripe price IDs as rows.
- Add `provider` column to `stripe_subscriptions` (nullable, default `'stripe'` for existing rows).
- RLS: same patterns as existing tables.
- **Rollback:** Drop new tables. Existing `stripe_customers` + `stripe_subscriptions` unaffected.
- **Verification:** `SELECT provider, count(*) FROM payment_customers GROUP BY provider` returns stripe rows.

### Step 2 — Backend: Abstract DB access (non-breaking)

- Add `src/lib/payment/db.ts` with `getPaymentCustomer(userId, provider)` and `upsertPaymentCustomer(...)`.
- Refactor `create-checkout-session`, `check-subscription`, `customer-portal` to use the new accessor (reads from `payment_customers`, falls back to `stripe_customers` for existing users).
- **Rollback:** Revert to direct `stripe_customers` queries in those functions.
- **Verification:** Existing Stripe checkout still works end-to-end.

### Step 3 — Backend: Create provider interface + Stripe implementation (non-breaking)

- Write `src/lib/payment/providers/types.ts` (interface above).
- Write `src/lib/payment/providers/stripe-provider.ts` wrapping existing Stripe logic.
- Write `src/lib/payment/router.ts` with `selectProvider()`.
- Write `src/lib/payment/index.ts` factory: `getProvider(key)`.
- None of this runs in production yet; no function calls the new code.
- **Rollback:** Delete files. No production state changed.

### Step 4 — DB: Add `price_book` rows for Paystack (non-breaking)

- Insert Paystack NGN pricing rows into `price_book`.
- pro = 550000 kobo (₦5,500), enterprise = 1100000 kobo (₦11,000).
- **Rollback:** `DELETE FROM price_book WHERE provider = 'paystack'`.
- **Verification:** `SELECT * FROM price_book WHERE provider = 'paystack'` returns rows.

### Step 5 — Edge: Create `paystack-webhook` (non-breaking)

- New edge function, not called by any frontend flow yet.
- Handles `paystack.subscription.created`, `charge.success`, `transfer.success`, etc.
- Writes normalized events to `stripe_subscriptions` / `user_tiers` using the same `handleChange`/`handleDeletion` pattern as `stripe-webhook`.
- Test locally against Paystack sandbox events.
- **Rollback:** Delete the function. No production state.
- **Verification:** `supabase functions invoke paystack-webhook --body ...` with sandbox payload.

### Step 6 — Edge: Create Paystack checkout path (shadow mode)

- Add `create-paystack-session` edge function that uses `PaystackProvider` to create a transaction.
- Gate it behind a feature flag env var `ENABLE_PAYSTACK_CHECKOUT=false` (default false).
- When flag is true, frontend can call it. Still no production traffic without flag flip.
- **Rollback:** Set `ENABLE_PAYSTACK_CHECKOUT=false` or delete function.
- **Verification:** With flag=true, checkout creates a Paystack transaction and returns authorization URL.

### Step 7 — Frontend: Add Paystack checkout option (controlled)

- Add Paystack to `subscription-tiers.ts` alongside Stripe prices (from `price_book` lookup).
- Show Paystack option in pricing UI only when `ENABLE_PAYSTACK_CHECKOUT=true`.
- Uses existing `SubscriptionContext` — only the checkout trigger changes.
- **Rollback:** Set flag false, Paystack option disappears from UI.
- **Verification:** Flag=true shows Paystack option; flag=false hides it.

### Step 8 — Pilot: Enable Paystack for NGN users only (gradual rollout)

- Set `ENABLE_PAYSTACK_CHECKOUT=true`.
- In `router.ts`, route NGN currency to Paystack; all others still go to Stripe.
- Monitor: `stripe_subscriptions` rows where `provider = 'paystack'`.
- **Roll back:** set `selectProvider` to always return `stripe` for all currencies.
- **Verification:** NGN checkout → Paystack URL; USD checkout → Stripe URL.

### Step 9 — Stripe cleanup (post-stabilization, after 30 days)

Once Paystack subscription lifecycle is confirmed stable:
- Migrate `stripe_subscriptions.provider` to non-nullable.
- Update `stripe-webhook` to set `provider = 'stripe'` on writes.
- Drop `stripe_customers` table (all data in `payment_customers`).
- Update `check-subscription` to remove `stripe_customers` JOIN.

### Step 10 — Add Flutterwave (same pattern, repeat steps 4–8)

- Add `price_book` rows for KES/GHS Flutterwave pricing.
- Add `flutterwave-webhook`.
- Add `flutterwave-provider.ts`.
- Add to router logic.
- Gate behind feature flag.

---

## 7. Open Questions

1. **Chargeback handling:** Per-provider or unified? Paystack and Flutterwave have different dispute resolution flows. Do you want a single `disputes` table with a `provider` column, or separate tables?
2. **Enterprise tier on Paystack:** Paystack subscriptions have limits (e.g., no multi-currency, limited plan counts). How should enterprise be priced via Paystack — annual billing to reduce per-transaction costs, or a different product entirely?
3. **Currency conversion on display:** When a user sees pricing, is the displayed amount (e.g., ₦5,500) pulled from `price_book` at render time, or cached in the frontend? If cached, what's the invalidation strategy when you update a price?
4. **Refunds:** Who handles refunds — the provider directly (Stripe dashboard / Paystack dashboard) or through the app? If through the app, the `cancelSubscription` interface needs a `refund` variant.
5. **Partial upgrades/downgrades:** If a user on Pro Stripe wants to switch to enterprise Paystack — is this a cross-provider migration or a new subscription? What's the UX?
6. **Trial periods:** Does Paystack support free trials? If not, how does the migration handle users who were trialing on Stripe and convert to Paystack?
7. **Webhook retry / idempotency:** All three providers have webhook retry semantics. Is the `stripe_subscriptions` upsert already idempotent (it uses `ON CONFLICT`), and does the same apply for Paystack/Flutterwave events?
8. **Geographic restrictions:** Should `selectProvider` also consider the user's country (not just currency)? A user with USD wallet but in Nigeria might still prefer Paystack for local reasons. How is `userCountry` populated — from `profiles.country` or from IP geolocation at checkout time?
9. **PCI-DSS scope:** Adding Paystack/Flutterwave does not change PCI scope (you're not handling card data), but if you eventually use Paystack's Recurrent Charge (authorized card on file), that may have different compliance requirements.

---

## 8. Provider-Specific Gotchas

**Paystack:**

- `transaction.initialize` returns an `authorization_url` — redirect the user there, not a hosted page you control. On `charge.success` webhook, update the subscription — not on `subscription.create` (which is only for planned subscription objects).
- Subscription objects in Paystack are not as rich as Stripe — no `cancel_at_period_end`, no `trialing`. `cancel()` is immediate.
- Test mode uses `https://api.paystack.co`; live uses a different base URL. SDK has no built-in env switching — must be done via env var.
- Reference field for reconciliation must be unique; use `crypto.randomUUID()`.

**Flutterwave:**

- Webhook signature header is `Verifi-Fraud`, not `flutterwave-signature`. HMAC-SHA256 of raw body.
- `verify_transaction` endpoint is required to confirm webhook authenticity before acting on it.
- Subscription cancel is immediate, like Paystack — no `cancel_at_period_end`.
- KES/GHS settlements may have minimum payout thresholds — factor into pricing.

**Stripe (existing gotchas):**

- `stripe_subscriptions.customer_id` FK is not on `stripe_customers.user_id` but on `stripe_customers.customer_id` — an unusual indirect FK that `check-subscription` handles with a JOIN. The new abstraction should not propagate this pattern.
- Two hardcoded price IDs in `stripe-webhook/index.ts` and `check-subscription/index.ts` — both must be replaced with `price_book` lookups simultaneously, or the tier resolution will diverge.

---

## 9. Files to Change (Reference Only — Not Modified)

This section is for orientation; no files were modified.

| File | Change |
|------|--------|
| `src/lib/payment/providers/types.ts` | New — interface definition |
| `src/lib/payment/providers/stripe-provider.ts` | New — Stripe impl |
| `src/lib/payment/providers/paystack-provider.ts` | New — Paystack impl |
| `src/lib/payment/providers/flutterwave-provider.ts` | New — Flutterwave impl |
| `src/lib/payment/router.ts` | New — `selectProvider()` |
| `src/lib/payment/price-book.ts` | New — price lookup |
| `src/lib/payment/index.ts` | New — factory `getProvider()` |
| `src/lib/payment/db.ts` | New — `payment_customers` accessor |
| `supabase/functions/paystack-webhook/index.ts` | New — Paystack webhook |
| `supabase/functions/flutterwave-webhook/index.ts` | New — Flutterwave webhook |
| `supabase/functions/create-checkout-session/index.ts` | Refactor to use provider abstraction |
| `supabase/functions/check-subscription/index.ts` | Refactor to use `payment_customers` + provider impl |
| `supabase/functions/customer-portal/index.ts` | Refactor to use provider impl |
| `supabase/functions/stripe-webhook/index.ts` | Minor — use `price_book` for tier resolution |
| `src/lib/subscription-tiers.ts` | Refactor to use `price_book` for price IDs |
| `src/contexts/SubscriptionContext.tsx` | No change — already abstracted via `check-subscription` |
| `supabase/migrations/004X_payment_providers.sql` | New — `payment_customers`, `price_book`, data migration |

---

**No implementation. This document is for design review.**

# Stripe billing catalog and webhook — what was done and why

Last updated: 2026-10-10. Stripe account `acct_1RBGUq2KF4vMCpn8` (live), Supabase project `mxtsdgkwzjzlttpotole`.

## 1. Incident: webhook failing since 2026-09-18

Stripe disabled `https://mxtsdgkwzjzlttpotole.supabase.co/functions/v1/stripe-webhook` after repeated delivery failures.

- **Root cause:** `supabase/functions/stripe-webhook/index.ts` called the synchronous `stripe.webhooks.constructEvent`. Deno only has async Web Crypto, so Stripe's `SubtleCryptoProvider` threw `cannot be used in a synchronous context` on every event, and the function returned 400.
- **Not the cause:** JWT verification. The deployed function already had `verify_jwt: false`.
- **Fix (PR #118, deployed as function v71):** `await constructEventAsync(body, sig, secret, undefined, Stripe.createSubtleCryptoProvider())`, and `verify_jwt = false` pinned in `supabase/config.toml` so a redeploy cannot silently re-enable JWT checks.
- **Consequence while it was down:** events were never applied. Subscription `sub_1U5ng02KF4vMCpn8llArgdm3` was cancelled in Stripe but still shows `active` / tier `pro` in the database. Replaying its `customer.subscription.deleted` event reconciles it (downgrades that user to free).

### Second bug found by simulation
Stripe API `2025-03-31.basil` and later move `current_period_end` from the subscription onto `items.data[0]`. The handler read `sub.current_period_end * 1000`, producing `Invalid time value` and a 500 *after* signature verification passed. The handler now reads either location (`periodEnd()` / `toIso()` in `stripe-webhook/index.ts`) and tolerates null.

### Production drift note
The repo copy of the handler contains an `issuing_transaction.created` case that calls the RPC `adjust_wallet_balance`. Production v71 was deployed from the live v70 source plus only the async fix, so that case was not shipped. Do not deploy it until the `adjust_wallet_balance` migration is confirmed applied in production.

## 2. Catalog convention (one Stripe account, many projects)

Stripe webhooks and products are account-wide, so projects are kept apart by labels, not by separate accounts.

| Object | Label | Example |
|---|---|---|
| Product | metadata `project`, `tier`, `catalog_version`; name `"<Project> – <Tier>"` | `VortexCore – Pro` |
| Price | metadata `project`, `tier`, `billing`, `catalog_version`; `lookup_key` = `{project}_{tier}_{interval}` | `vortexcore_pro_monthly` |
| Legacy price | additionally `legacy=true` | one-time SubTrack Pro price |
| Webhook endpoint | metadata `project` | `vortexcore` |

Rules:
1. Never hand-pick price IDs in application code. Use `lookup_key`, and register the price ID in `PRICE_CATALOG` (needed by the read path, which only stores `price_id`).
2. One webhook endpoint per project. Reserved project slug: `lanonasis-memory` (memory-as-a-service billing, not yet shipped).
3. To retire a price: set `active=false`; never delete.

### Live catalog (catalog_version 1)

| Tier | Product | Price | Lookup key | Price ID |
|---|---|---|---|---|
| Free | `prod_VPgUMifcv7DweW` | none (no charge) | n/a | n/a |
| Hobby | `prod_VPgUJHdLWKnEFV` | $9.99 / month | `vortexcore_hobby_monthly` | `price_1UOr852KF4vMCpn8TlJ5MMn9` |
| Pro | `prod_VPgULfl2pNoYAW` | $29.99 / month | `vortexcore_pro_monthly` | `price_1UOr872KF4vMCpn81Q4FSS67` |
| Enterprise | `prod_VPgVs0aqC71N0d` | $49.99 / month | `vortexcore_enterprise_monthly` | `price_1UOr882KF4vMCpn8mLZJAN20` |

Prices are provisional until UAT passes. To change one, create a new price with the same lookup key (use `transfer_lookup_key`), deactivate the old, and add the new ID to `PRICE_CATALOG`.

### Legacy SubTrack Pro (kept, not renamed)
Products `prod_SdidKo4BZeQRwb` (Enterprise, $9.99), `prod_SdideR9hikhJ6V` (Pro, $4.99), `prod_Sdid8AZs4RXD4c` (Basic) are tagged `project=subtrack`. Their prices still resolve to pro / enterprise through the catalog and the `STRIPE_PRO_PRICE_ID` / `STRIPE_ENT_PRICE_ID` env overrides.

### Untagged items
`Development Services` (`prod_SRgh4WJaza7W77`) and `Brand items` (`prod_SEpP8hz9MQ9Ugq`) are not part of the product catalog and have no project tag yet. They need an owner decision (suggested: a separate company-services compartment).

## 3. Entitlements and Supabase sync

Source of truth: `supabase/functions/_shared/subscription-logic.ts`, used by both the webhook (write path) and `check-subscription` (read path).

| Tier | max_queries_per_day | can_use_advanced_models |
|---|---|---|
| free | 10 | false |
| hobby | 50 | true while active/trialing |
| pro | 100 | true while active/trialing |
| enterprise | 500 | true while active/trialing |

Hobby's 50 is a placeholder; adjust in `TIER_ENTITLEMENTS` after UAT.

Tier resolution order: env-overridden legacy IDs → `PRICE_CATALOG` → price `metadata.tier` → `free`. The metadata fallback means a newly created price entitles correctly before the catalog is redeployed, and the handler logs a warning so the gap gets closed.

Database (no schema change was needed):
- `user_tiers.tier_name` is free text with no CHECK constraint, so `hobby` works as is. Writes go through the service role (RLS is select-only for users).
- A row per user is created by the trigger chain `auth.users → profiles → user_tiers` (`sync_auth_user_to_public` → `initialize_user_tier`, both `SECURITY DEFINER` with a pinned `search_path`). The handler upserts on `user_id`.
- `plan_type` enum (`free|pro|enterprise`) on `security_service.users.plan` is not written by the webhook. Extend it only if something starts writing `hobby` there.
- Optional hardening: revoke `EXECUTE` on the two trigger functions from `anon` and `authenticated`.

### Why the project guard is off
A user has one profile across services, so a subscription bought under one project is honoured by the others. The handler does not reject events by `project`. The labels still exist, so the guard can be turned on later without touching Stripe.

## 4. Verification performed

- Unit tests: `src/test/__tests__/billing/price-catalog.test.ts` imports the real shared module (11 assertions: tier order, catalog resolution, metadata fallback, entitlements).
- Local simulation (Deno, fake PostgREST): signed events in the `2025-03-31.basil` shape returned 200 and wrote the expected `stripe_subscriptions` and `user_tiers` rows for hobby, enterprise, legacy SubTrack pro, an unlisted price with metadata, an unknown price (free), and deletion (free). A forged signature returned 400.
- Stripe CLI sandbox simulation: genuine Stripe-signed events passed signature verification on the fixed handler; the previous handler failed them with the SubtleCrypto error (control).
- Not verified: that production `STRIPE_WEBHOOK_SECRET` equals the signing secret of endpoint `we_1U5ySC2KF4vMCpn8BMek6XAu`. Secrets cannot be read. The check is one real delivery (section 6).

## 5. Related changes made at the same time

- **Gate 7 (PR #120):** the Vercel provenance check matched `GITHUB_SHA`, which on pull requests is the merge commit and never has a deployment. It now uses `PROVENANCE_SHA` (the PR head SHA).
- **Auth PR #113:** adds a `role` column the auth service reads on every authenticated request, and the repo has no migration path in its deploy. Merging without the column would turn every authenticated request into a 500. A migration (`services/auth-service/prisma/migrations/20261010120000_add_user_role`, additive, default `USER`) was added to the PR and the PR merged. **It still has to be applied to the `vortex_auth` database before the new auth-service image is deployed**, then the first admin promoted manually. Rollback: redeploy the previous image, then `DROP COLUMN role; DROP TYPE "UserRole"`.

## 6. Rollout, rollback, open items

Rollout order: merge the catalog PR → deploy the function with `verify_jwt=false` → resend one real event → reconcile the stale subscription.

Resend a live event to the endpoint (needs `stripe login --project-name "lan onasis"`; the live CLI key expired 2026-07-26, and a stale `STRIPE_API_KEY` in the shell overrides the profile, so run with `env -u STRIPE_API_KEY`):

```
stripe --project-name "lan onasis" events resend <evt_id> --live --webhook-endpoint=we_1U5ySC2KF4vMCpn8BMek6XAu
```

Do not replay `invoice.payment_failed` for an already-cancelled subscription (it would set it to `past_due`).

Rollback: redeploy the previous function version (v71) from the Supabase dashboard. Catalog objects are additive and can be deactivated.

Open items:
1. Source of the Stripe → Slack forwarder is unknown (not in Supabase functions or Stripe endpoints). Check Stripe Dashboard → Workflows / Event destinations, and Slack → Workflow Builder.
2. Apply the #113 migration to `vortex_auth`.
3. Live secret-alignment check (section 6).
4. Project tag for `Development Services` and `Brand items`.
5. UAT pass over prices and entitlements.
6. Re-enable the subtrack-pro.com endpoint `we_1RiSB62KF4vMCpn8afHaBbrF` only if that service is still live.

## 7. Stripe Sync Engine and the rename to `stripe-entitlements` (2026-10-11)

The Supabase Stripe Sync Engine integration was enabled on `mxtsdgkwzjzlttpotole`. It created the `stripe` schema (a raw mirror of Stripe objects), the functions `stripe-setup` and `stripe-worker`, the cron job `stripe-sync-worker`, and its own Stripe endpoint `we_1UPEWV2KF4vMCpn8Rl6cqlWp`.

It also deploys a function named `stripe-webhook`. That is the name our entitlement handler used, so the install replaced our code and entitlement sync stopped.

What was done:
- Our handler now lives at `supabase/functions/stripe-entitlements` and is deployed under that name (`verify_jwt = false`).
- Endpoint `we_1U5ySC2KF4vMCpn8BMek6XAu` points at `/functions/v1/stripe-entitlements`.
- `stripe-webhook` belongs to the Sync Engine. **Never deploy a function with that name from this repo.**

The two run side by side and write different schemas:

| | Sync Engine | Entitlements |
|---|---|---|
| Function | `stripe-webhook` (managed) | `stripe-entitlements` (this repo) |
| Stripe endpoint | `we_1UPEWV2…` (92 events) | `we_1U5ySC2…` (5 events) |
| Writes | `stripe.*` | `public.stripe_subscriptions`, `public.user_tiers` |

Verified live: replaying `evt_1UM88d2KF4vMCpn8OREiyJzp` (`customer.subscription.deleted`) set `sub_1U5ng02KF4vMCpn8llArgdm3` to `canceled` and the user to `free`. This also confirms `STRIPE_WEBHOOK_SECRET` matches the endpoint's signing secret.

The `wrappers` extension (0.6.2) is installed but has no Stripe foreign server. It gives query-time read access to Stripe and does not receive webhooks, so it is not a replacement for either function.

Possible later change: derive `user_tiers` from `stripe.subscriptions` with a trigger and retire `stripe-entitlements`.

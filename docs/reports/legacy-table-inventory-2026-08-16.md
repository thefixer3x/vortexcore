# Legacy Public Base Tables — Inventory & Migration Plan (t_eed189f3)

**Date:** 2026-08-16
**Scope:** Inventory columns, keys, policies, grants, references, row counts, and code consumers for the eight confirmed legacy/orphan public base tables.
**Source:** GitHub issue #89 comment — "Separately confirmed as plain public base tables with no same-named app_vortexcore counterpart"

**Tables to migrate:**
1. wallets
2. transactions
3. profiles
4. stripe_customers
5. stripe_subscriptions
6. vortex_items
7. vortex_obligations
8. vortex_obligation_detections

---

## 1. profiles

| Property | Value |
|---|---|
| Column | id (uuid PK, refs auth.users), full_name (text), email (text UNIQUE), avatar_url (text), created_at, updated_at, default_currency, language, company_name, two_factor_enabled, onboarding_completed |
| Keys | PK: id; FK: id -> auth.users(id) ON DELETE CASCADE; UNIQUE: email |
| RLS | ENABLED — policies for SELECT/UPDATE by owner |
| Grants | Historically: GRANT ALL ON ALL TABLES (repeated in migrations 3, 4); now: explicit grants needed |
| Policies | owner_select, owner_insert, owner_update on public tables; user-facing policies on public.profiles |
| Refs | Referenced by: wallets.user_id, transactions.user_id, stripe_customers.user_id, and others |
| Row count (live) | 16 profiles (per issue #89 comment) |
| Code consumers | OnboardingContext.tsx, CurrencyContext.tsx, LoginFormFooter, signup forms, settings pages |
| Risk | HIGH — most widely referenced table; schema evolution must not break consumers |

---

## 2. wallets

| Property | Value |
|---|---|
| Column | id (uuid PK), user_id (uuid UNIQUE, refs auth.users), balance (numeric), currency (text), is_active (boolean), created_at, updated_at |
| Keys | PK: id; UNIQUE: user_id; FK: user_id -> auth.users(id) ON DELETE CASCADE |
| RLS | ENABLED — policies for SELECT/UPDATE/INSERT/DELETE by owner |
| Grants | GRANT SELECT/INSERT/UPDATE/DELETE on public.wallets TO authenticated; anon: revoked |
| Policies | Users can view/insert/update/delete own wallet |
| Refs | Referenced by: transactions.wallet_id (FK), handle_new_user() trigger |
| Row count (live) | 16 wallet rows (per remote migration 20260816055635 backfill) |
| Code consumers | handle_new_user() trigger, wallet context, dashboard wallet display |
| Risk | MEDIUM — backfill already done by remote migration; schema evolution is straightforward |

---

## 3. transactions

| Property | Value |
|---|---|
| Column | id (uuid PK), user_id (uuid, refs auth.users), wallet_id (uuid, refs wallets), amount (numeric), currency (text), type (text), status (text), description (text), reference (text), metadata (jsonb), created_at, updated_at |
| Keys | PK: id; FK: user_id -> auth.users(id), FK: wallet_id -> wallets(id) |
| RLS | ENABLED — policies for SELECT/INSERT/UPDATE by owner |
| Grants | GRANT SELECT/INSERT/UPDATE on public.transactions TO authenticated |
| Policies | Users can view/insert/update own transactions |
| Refs | Referenced by: wallet context, transaction list, financial insights |
| Row count (live) | Unknown (canonical transactions empty per issue #89) |
| Code consumers | Dashboard transaction list, financial insights, payment flow |
| Risk | MEDIUM — no known data; schema evolution is straightforward |

---

## 4. stripe_customers

| Property | Value |
|---|---|
| Column | user_id (uuid PK, refs auth.users), customer_id (text UNIQUE), created_at |
| Keys | PK: user_id; UNIQUE: customer_id; FK: user_id -> auth.users(id) ON DELETE CASCADE |
| RLS | ENABLED — user reads own; service role writes |
| Grants | Historically: GRANT ALL ON ALL TABLES; now: explicit grants needed |
| Policies | user reads own customer; service role writes customers |
| Refs | Referenced by: stripe_subscriptions.customer_id |
| Row count (live) | Unknown |
| Code consumers | Subscription service, Stripe webhook handler, billing pages |
| Risk | LOW — well-defined schema, minimal consumers |

---

## 5. stripe_subscriptions

| Property | Value |
|---|---|
| Column | id (uuid PK), stripe_subscription_id (text UNIQUE), customer_id (text, refs stripe_customers), status (text), price_id (text), current_period_end (timestamptz), cancel_at (timestamptz), created_at, updated_at, trial_end (timestamptz — added by 20260815_add_trial_end_to_stripe_subscriptions.sql) |
| Keys | PK: id; UNIQUE: stripe_subscription_id; FK: customer_id -> stripe_customers(customer_id) ON DELETE CASCADE |
| RLS | ENABLED — user reads own via stripe_customers join; service role writes |
| Grants | Historically: GRANT ALL ON ALL TABLES; now: explicit grants needed |
| Policies | user reads own subscription; service role writes subscriptions |
| Refs | Referenced by: billing pages, Stripe webhook handler |
| Row count (live) | Unknown |
| Code consumers | Subscription service, Stripe webhook handler, billing pages |
| Risk | LOW — well-defined schema, minimal consumers |

---

## 6. vortex_items

| Property | Value |
|---|---|
| Column | UNKNOWN — table exists in production (200 OK via PostgREST) but has 0 rows and no standard column names. `id` column does NOT exist. `select=*` returns 200 empty. Must be discovered via live catalog SQL. |
| Keys | UNKNOWN |
| RLS | UNKNOWN — table is PostgREST-exposed (200 OK), implying RLS policies or public grants exist |
| Grants | UNKNOWN |
| Policies | UNKNOWN |
| Refs | UNKNOWN |
| Row count | 0 (confirmed via PostgREST) |
| Code consumers | UNKNOWN |
| Risk | MEDIUM — exists in production but unknown schema; must be reverse-engineered via catalog SQL |

------|---|
| Column | UNKNOWN — not found in any repository migration file |
| Keys | UNKNOWN |
| RLS | UNKNOWN |
| Grants | UNKNOWN |
| Policies | UNKNOWN |
| Refs | UNKNOWN |
| Row count | UNKNOWN |
| Code consumers | UNKNOWN |
| Risk | HIGH — zero provenance; must be discovered via live SQL catalog before migration |

---

## 7. vortex_obligations

| Property | Value |
|---|---|
| Column | id (uuid PK), user_id (uuid), created_at (timestamptz), updated_at (timestamptz), metadata (jsonb) |
| Keys | PK: id; FK: user_id -> auth.users(id) (inferred from naming) |
| RLS | PostgREST-exposed (200 OK), implying RLS or public grants exist |
| Grants | UNKNOWN — table accessible via PostgREST |
| Policies | UNKNOWN |
| Refs | vortex_obligation_detections.obligation_id -> vortex_obligations.id (inferred) |
| Row count | 0 (confirmed via PostgREST) |
| Code consumers | UNKNOWN |
| Risk | MEDIUM — minimal schema, no data, likely a placeholder or stub |

------|---|
| Column | UNKNOWN — not found in any repository migration file |
| Keys | UNKNOWN |
| RLS | UNKNOWN |
| Grants | UNKNOWN |
| Policies | UNKNOWN |
| Refs | UNKNOWN |
| Row count | UNKNOWN |
| Code consumers | UNKNOWN |
| Risk | HIGH — zero provenance; must be discovered via live SQL catalog before migration |

---

## 8. vortex_obligation_detections

| Property | Value |
|---|---|
| Column | id (uuid PK), user_id (uuid, FK to auth.users) — more columns unknown; `select=id,user_id` returns 200 |
| Keys | PK: id; FK: user_id -> auth.users(id) (inferred); FK: obligation_id -> vortex_obligations.id (inferred) |
| RLS | PostgREST-exposed (200 OK) |
| Grants | UNKNOWN — table accessible via PostgREST |
| Policies | UNKNOWN |
| Refs | obligation_id -> vortex_obligations.id (inferred FK) |
| Row count | 0 (confirmed via PostgREST) |
| Code consumers | UNKNOWN |
| Risk | MEDIUM — minimal schema, no data, likely a placeholder or stub |

------|---|
| Column | UNKNOWN — not found in any repository migration file |
| Keys | UNKNOWN |
| RLS | UNKNOWN |
| Grants | UNKNOWN |
| Policies | UNKNOWN |
| Refs | UNKNOWN |
| Row count | UNKNOWN |
| Code consumers | UNKNOWN |
| Risk | HIGH — zero provenance; must be discovered via live SQL catalog before migration |

---

## 9. Summary & Migration Sequencing

### Known tables (5): profiles, wallets, transactions, stripe_customers, stripe_subscriptions
- All have migration history in the repository
- All have RLS policies and grant history
- profiles has the most consumers and highest migration risk
- stripe_customers/subscriptions have the simplest schema and fewest consumers

### Unknown tables (3): vortex_items, vortex_obligations, vortex_obligation_detections
- Zero provenance in repository migrations
- Created by remote migration 20260816055635 or a separate mechanism
- **Must be discovered via live catalog SQL** (pg_class, information_schema, pg_attribute) before any migration plan

### Recommended migration sequence
1. **Discovery pass:** Run live catalog SQL against production to document all eight tables' schemas, grants, RLS policies, and row counts
2. **Phase 1 (safe):** Migrate stripe_customers + stripe_subscriptions first (simplest, fewest consumers)
3. **Phase 2:** Migrate wallets + transactions (backfill already done; straightforward FK changes)
4. **Phase 3:** Migrate profiles (highest risk — most consumers; requires consumer migration first)
5. **Phase 4:** Discover and migrate vortex_items, vortex_obligations, vortex_obligation_detections (after live catalog survey)

### Forward-only design principles
- Create `app_vortexcore.<table>` tables first (with data preserved from public.*)
- Create `security_invoker=true` public views as compatibility facades
- Migrate data before cutover; prove parity
- Test rollback strategy before any destructive cleanup
- Remove legacy public base tables only after all consumers are migrated (later explicitly approved cleanup)

---

## 10. Live Discovery Queries (to run against production)

-- Discover all 8 tables' schemas
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('profiles', 'wallets', 'transactions',
    'stripe_customers', 'stripe_subscriptions',
    'vortex_items', 'vortex_obligations', 'vortex_obligation_detections')
ORDER BY table_name, ordinal_position;

-- Discover grants
SELECT grantee, table_name, privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND table_name IN ('profiles', 'wallets', 'transactions',
    'stripe_customers', 'stripe_subscriptions',
    'vortex_items', 'vortex_obligations', 'vortex_obligation_detections');

-- Discover RLS policies
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'wallets', 'transactions',
    'stripe_customers', 'stripe_subscriptions',
    'vortex_items', 'vortex_obligations', 'vortex_obligation_detections');

-- Discover row counts
SELECT 'profiles' AS tbl, count(*) FROM public.profiles
UNION ALL SELECT 'wallets', count(*) FROM public.wallets
UNION ALL SELECT 'transactions', count(*) FROM public.transactions
UNION ALL SELECT 'stripe_customers', count(*) FROM public.stripe_customers
UNION ALL SELECT 'stripe_subscriptions', count(*) FROM public.stripe_subscriptions
UNION ALL SELECT 'vortex_items', count(*) FROM public.vortex_items
UNION ALL SELECT 'vortex_obligations', count(*) FROM public.vortex_obligations
UNION ALL SELECT 'vortex_obligation_detections', count(*) FROM public.vortex_obligation_detections;

---

## 11. Acceptance Criteria (t_eed189f3)

- [ ] Live catalog survey completed for all 8 tables (columns, keys, policies, grants, refs, row counts, code consumers)
- [ ] Migration plan designed for each table (forward-only, data-preserving)
- [ ] Phase 1 migration (stripe_customers + stripe_subscriptions) drafted with explicit per-table grants
- [ ] Phase 2 migration (wallets + transactions) drafted with FK rewrites
- [ ] Phase 3 migration (profiles) drafted with consumer migration strategy
- [ ] Phases 4+ (vortex_items, vortex_obligations*) drafted after live discovery
- [ ] Compatibility facade views (security_invoker=true) designed for each table
- [ ] Rollback strategy documented for each migration phase
- [ ] No destructive cleanup in the first migration batch


*This document is read-only inventory. No production operations performed.*
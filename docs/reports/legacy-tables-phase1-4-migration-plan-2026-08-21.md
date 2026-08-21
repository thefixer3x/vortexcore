# Legacy Public Base Tables — Phase 1-4 Migration Plan (t_eed189f3)

**Date:** 2026-08-21
**Status:** DRAFT — awaiting #107 ownership-classification gate and live catalog discovery
for the three zero-provenance tables (`vortex_items`, `vortex_obligations`,
`vortex_obligation_detections`) before any migration is authored for production.
**Source:** Continues `legacy-table-inventory-2026-08-16.md`. Tracks GitHub issue #89.
**Scope constraint:** All four phases preserve data, never DROP legacy public base tables
in this batch. Removal is an explicitly approved later cleanup (per issue #89 addendum).
**Architecture invariant (per #107 redraft, session-2026-08-19 §6):** `public` may contain
compatibility views, narrow RPC façades, and intentional PostgREST entrypoints — never
application / billing / marketplace / security / AI / subscription-manager state. Cross-app
ownership for any of the eight tables is unresolved; **establish ownership first, then move.**

---

## Forward-only design principles (recap)

1. Create `app_vortexcore.<table>` with the same shape and constraints as the legacy table.
2. Backfill from `public.<table>` using `INSERT ... SELECT` with explicit column lists.
3. Replace the legacy public base table with a `security_invoker=true` compatibility
   view over the canonical table.
4. Migrate consumers last (this plan only drafts the schema side; consumer migration is
   tracked separately and is a follow-on cleanup).
5. Per-table explicit grants only. **No schema-wide `GRANT ALL ON ALL TABLES IN SCHEMA public`.**
6. Idempotent: every `CREATE` uses `IF NOT EXISTS`, every `DROP` uses `IF EXISTS`,
   every `CREATE OR REPLACE`.
7. No data destruction. Legacy base tables remain in place behind the facade view for
   at least one release window.

---

## Phase 1 — Stripe billing (lowest risk, fewest consumers)

**Tables:** `stripe_customers`, `stripe_subscriptions`
**Why first:** smallest surface area, no FKs to other legacy tables, well-documented consumers
(stripe webhook handler + billing pages only), minimal row count.

### 1.1.1 Create canonical `app_vortexcore.vortex_stripe_customers`

```sql
-- Migration: 20260821000001_phase1_stripe_customers_to_app_vortexcore.sql
-- Phase 1, table 1 of 2 — moves public.stripe_customers into app_vortexcore,
-- preserves shape, adds app_vortexcore RLS, leaves a security_invoker facade view.

create schema if not exists app_vortexcore;

create table if not exists app_vortexcore.vortex_stripe_customers (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  customer_id text not null unique,
  created_at  timestamptz not null default now()
);

-- Backfill from legacy public table (one-shot; idempotent via WHERE NOT EXISTS).
insert into app_vortexcore.vortex_stripe_customers (user_id, customer_id, created_at)
select user_id, customer_id, created_at
from public.stripe_customers
where not exists (
  select 1 from app_vortexcore.vortex_stripe_customers t
  where t.user_id = public.stripe_customers.user_id
);

-- RLS — owner-only SELECT, service_role writes (mirrors legacy behavior).
alter table app_vortexcore.vortex_stripe_customers enable row level security;

drop policy if exists "user reads own customer" on app_vortexcore.vortex_stripe_customers;
create policy "user reads own customer"
  on app_vortexcore.vortex_stripe_customers for select
  using (auth.uid() = user_id);

drop policy if exists "service role writes customers" on app_vortexcore.vortex_stripe_customers;
create policy "service role writes customers"
  on app_vortexcore.vortex_stripe_customers for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Explicit per-table grants (Supabase Data API grant readiness, post-Oct 30 2026).
grant select on app_vortexcore.vortex_stripe_customers to authenticated;
grant select, insert, update, delete on app_vortexcore.vortex_stripe_customers to service_role;

-- Replace the legacy base table with a security_invoker facade view.
-- (This requires the legacy base table to be renamed first — see step 1.1.2.)
```

### 1.1.2 Swap the legacy public base table for the facade view

```sql
-- Step 2: rename the legacy base table out of the way, create the facade view.
-- This preserves data: the rename moves the table to public._legacy_stripe_customers,
-- the facade view restores the public.stripe_customers name pointing at the canonical table.

alter table if exists public.stripe_customers
  rename to _legacy_stripe_customers;

-- Lock down the renamed table.
revoke all on public._legacy_stripe_customers from authenticated, anon, service_role;
grant select on public._legacy_stripe_customers to service_role; -- read-only for audits

-- Create the security_invoker facade view.
create or replace view public.stripe_customers
  with (security_invoker = true) as
  select user_id, customer_id, created_at
  from app_vortexcore.vortex_stripe_customers;

-- Explicit per-table grants on the facade view.
grant select on public.stripe_customers to authenticated;
grant select, insert, update, delete on public.stripe_customers to service_role;
```

### 1.1.3 Repeat for `stripe_subscriptions`

Same shape: create `app_vortexcore.vortex_stripe_subscriptions` with the same column
list as the legacy table (including `trial_end` added by `20260815_add_trial_end_to_stripe_subscriptions.sql`),
backfill, RLS mirroring legacy behavior, rename legacy → `_legacy_stripe_subscriptions`,
create facade view. FK target switches from `public.stripe_customers(customer_id)` to
`app_vortexcore.vortex_stripe_customers(customer_id)` for the canonical table only;
the facade view preserves the `public.stripe_customers` join path for legacy consumers.

### 1.1.4 Rollback (Phase 1)

```sql
-- Rollback: drop the facade view, restore the legacy base table.
drop view if exists public.stripe_customers;
alter table if exists public._legacy_stripe_customers rename to stripe_customers;

drop view if exists public.stripe_subscriptions;
alter table if exists public._legacy_stripe_subscriptions rename to stripe_subscriptions;

-- Canonical app_vortexcore tables can stay (they're now empty in practice since legacy
-- was renamed back), or be dropped:
drop table if exists app_vortexcore.vortex_stripe_customers;
drop table if exists app_vortexcore.vortex_stripe_subscriptions;
```

No data loss. The `_legacy_*` tables were untouched by the migration; rename is reversible.

### 1.1.5 Consumers to migrate (Phase 1 follow-up, not in this plan)

- `supabase/functions/stripe-webhook/index.ts` — writes go through `service_role`; will continue
  to work against the facade view but should be updated to target `app_vortexcore.vortex_stripe_customers`
  directly.
- `supabase/functions/create-checkout-session/index.ts` — reads `customer_id`; facade preserves
  the read path.
- Frontend billing pages — PostgREST `.from('stripe_customers')` continues to work via the facade.

---

## Phase 2 — Wallets + transactions (medium risk, FK chain)

**Tables:** `wallets`, `transactions`
**Why second:** schema is well-known, wallets already backfilled to `app_vortexcore.vortex_wallets`
by remote migration `20260816055635`, transactions FK chain depends on wallets.

### 2.1 Status note (already partially done)

Migration `20260427_app_vortexcore_schema.sql` already created `app_vortexcore.vortex_wallets`
and `app_vortexcore.vortex_transactions` with security_invoker facade views
`public.vortex_wallets` and `public.vortex_transactions`. The legacy `public.wallets` and
`public.transactions` base tables therefore currently have **two parallel stores**:

- `public.wallets` (legacy, 16 rows, FK into `auth.users`)
- `app_vortexcore.vortex_wallets` (canonical, 16 rows backfilled, facade `public.vortex_wallets`)

This is the "split-brain" risk: frontend code calling `.from('wallets')` hits the legacy
table; code calling `.from('vortex_wallets')` hits the canonical one. The wallet-provisioning
trigger `handle_new_user()` writes to `public.wallets`, not `app_vortexcore.vortex_wallets`
(see session-2026-08-19 §2, virtual card work that surfaced this).

### 2.2 Required preconditions (before Phase 2 ships)

1. **Move the `handle_new_user()` trigger** to write to `app_vortexcore.vortex_wallets` and
   delete the corresponding `public.wallets` insert. (Or, since the trigger function lives
   in a remote migration with no local file, add a new migration that creates a
   replacement trigger on `auth.users` and drops the old one.)
2. **Reconcile the 16-row wallets data** — verify `public.wallets.user_id` and
   `app_vortexcore.vortex_wallets.user_id` sets are identical (16 of 16 match per
   issue #89 backfill evidence).
3. **Reconcile the 0-row transactions** — both stores are empty; trivial.

### 2.3 Migration outline (Phase 2)

```sql
-- Migration: 20260821000002_phase2_wallets_transactions_to_app_vortexcore.sql
-- Phase 2 — moves legacy public.wallets and public.transactions behind facade views
-- pointing at the already-canonical app_vortexcore.vortex_wallets / vortex_transactions.

-- Pre-flight: assert parity.
do $$
declare legacy_count int; canon_count int; mismatch int;
begin
  select count(*) into legacy_count from public.wallets;
  select count(*) into canon_count from app_vortexcore.vortex_wallets;
  if legacy_count <> canon_count then
    raise exception 'Phase 2 pre-flight failed: public.wallets=%, app_vortexcore.vortex_wallets=%', legacy_count, canon_count;
  end if;
  select count(*) into mismatch
    from public.wallets lw
    full outer join app_vortexcore.vortex_wallets cw on lw.user_id = cw.user_id
    where lw.id is null or cw.id is null;
  if mismatch <> 0 then
    raise exception 'Phase 2 pre-flight failed: % user_ids mismatch between public.wallets and app_vortexcore.vortex_wallets', mismatch;
  end if;
end $$;

-- Step 1: redirect handle_new_user() trigger to canonical table.
-- (Function bodies not duplicated here — the trigger rewrite is its own migration.)
-- ALTER FUNCTION public.handle_new_user() ... ;
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- CREATE TRIGGER on_auth_user_created ... EXECUTE FUNCTION app_vortexcore.handle_new_user();

-- Step 2: rename legacy public.wallets out of the way.
alter table if exists public.wallets rename to _legacy_wallets;
revoke all on public._legacy_wallets from authenticated, anon;
grant select on public._legacy_wallets to service_role;

-- Step 3: create facade view in place of the legacy base table.
-- Shape preserved: id, user_id, balance, currency, is_active, created_at, updated_at.
-- Source: app_vortexcore.vortex_wallets already has all of these.
create or replace view public.wallets
  with (security_invoker = true) as
  select id, user_id, balance, currency, is_active, created_at, updated_at
  from app_vortexcore.vortex_wallets;

grant select on public.wallets to authenticated;
grant select, insert, update, delete on public.wallets to service_role;

-- Step 4: same for transactions.
alter table if exists public.transactions rename to _legacy_transactions;
revoke all on public._legacy_transactions from authenticated, anon;
grant select on public._legacy_transactions to service_role;

create or replace view public.transactions
  with (security_invoker = true) as
  select id, user_id, wallet_id, amount, currency, type, status, description, reference, metadata, created_at, updated_at
  from app_vortexcore.vortex_transactions;

grant select on public.transactions to authenticated;
grant select, insert, update, delete on public.transactions to service_role;
```

### 2.4 Rollback (Phase 2)

```sql
-- Rollback: drop the facade views, restore the legacy base tables.
drop view if exists public.wallets;
alter table if exists public._legacy_wallets rename to wallets;

drop view if exists public.transactions;
alter table if exists public._legacy_transactions rename to transactions;

-- Restore grants from the legacy migration that defined them.
-- (Re-run the GRANT/REVOKE block from the original create migration.)
```

No data loss. The renamed `_legacy_*` tables were not modified; the trigger can be
restored from the original migration file.

### 2.5 Consumers to migrate (Phase 2 follow-up)

- `handle_new_user()` trigger — write target moves to `app_vortexcore.vortex_wallets`.
- `useWallet`, `useTransactions` hooks, `WalletContext`, dashboard components — read paths
  continue working via the facade view, but should be updated to use the canonical tables
  in a follow-on cleanup.
- `20260819120000_wallet_balance_adjust_fn.sql` already targets
  `app_vortexcore.vortex_wallets` — no change needed.

---

## Phase 3 — Profiles (highest risk, most consumers)

**Tables:** `profiles`
**Why last among the known-provenance tables:** widest consumer surface, multiple sub-features
onboarding flow depends on it, schema evolution must not break consumers.

### 3.1 Outstanding schema work (already partially done)

Migration `20260818150229_align_vortex_profile_fields.sql` is in the repo (and in the
live project) and appears to handle the missing columns identified in the 2026-08-18
worker review. Phase 3 assumes that migration has been applied and the canonical
profile shape is in place. **Verify before drafting the facade view.**

### 3.2 Migration outline (Phase 3)

```sql
-- Migration: 20260821000003_phase3_profiles_to_app_vortexcore.sql
-- Phase 3 — moves public.profiles behind a security_invoker facade view
-- pointing at app_vortexcore.vortex_profiles.

-- Pre-flight: assert column parity.
do $$
declare missing_cols text;
begin
  select string_agg(c.column_name, ', ' order by c.column_name)
    into missing_cols
  from information_schema.columns c
  where c.table_schema = 'app_vortexcore'
    and c.table_name = 'vortex_profiles'
    and c.column_name not in (
      select column_name from information_schema.columns
      where table_schema = 'public' and table_name = 'profiles'
    );
  if missing_cols is not null then
    raise exception 'Phase 3 pre-flight failed: app_vortexcore.vortex_profiles has extra columns not in public.profiles: %', missing_cols;
  end if;
end $$;

-- Step 1: rename legacy public.profiles.
alter table if exists public.profiles rename to _legacy_profiles;
revoke all on public._legacy_profiles from authenticated, anon;
grant select on public._legacy_profiles to service_role;

-- Step 2: create facade view (shape parity assumed; verify in pre-flight).
create or replace view public.profiles
  with (security_invoker = true) as
  select id, full_name, email, avatar_url, created_at, updated_at,
         default_currency, language, company_name, two_factor_enabled, onboarding_completed
  from app_vortexcore.vortex_profiles;

grant select on public.profiles to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.profiles to service_role;
```

### 3.3 Rollback (Phase 3)

```sql
-- Rollback: drop facade view, restore legacy base table.
drop view if exists public.profiles;
alter table if exists public._legacy_profiles rename to profiles;
-- Restore original grants from 20251122_add_currency_language_to_profiles.sql or
-- the canonical schema migration.
```

No data loss. Profile data is the most sensitive in the system; the rename + facade
approach means rollback is a single ALTER TABLE.

### 3.4 Consumer migration strategy (Phase 3 follow-up)

This is the **only phase** where consumer migration is non-trivial. Phases 1 and 2 have
1-3 consumers each; profiles has:

- OnboardingContext.tsx, CurrencyContext.tsx, LoginFormFooter
- Signup forms, settings pages
- Multiple useProfile hooks across the dashboard
- `handle_new_user()` trigger writes a profile row on signup (must move to canonical)

**Strategy:** ship the facade view first, leave consumers untouched, then migrate
consumers one app area at a time behind a feature flag (or staged rollout), with
parity checks against `public._legacy_profiles` until all consumers are migrated.
Only after every consumer reads through the facade view (or directly from
`app_vortexcore.vortex_profiles`) should `_legacy_profiles` be considered for archival.

---

## Phase 4 — Vortex items / obligations (zero-provenance tables)

**Tables:** `vortex_items`, `vortex_obligations`, `vortex_obligation_detections`
**Why last:** zero repository provenance, schemas partially unknown, 0 rows, no known
consumers, but `vortex_obligation_detections` likely has an FK into `vortex_obligations.id`
(inferred from naming).

### 4.1 Required live catalog discovery (blocking)

The live catalog queries in `legacy-table-inventory-2026-08-16.md` §10 must be executed
against `mxtsdgkwzjzlttpotole` before Phase 4 can be drafted:

```sql
-- Full column list, not just what's known.
select table_name, column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name in ('vortex_items', 'vortex_obligations', 'vortex_obligation_detections')
order by table_name, ordinal_position;

-- Full RLS policy list.
select tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('vortex_items', 'vortex_obligations', 'vortex_obligation_detections');

-- Full grant list.
select grantee, table_name, privilege_type
from information_schema.table_privileges
where table_schema = 'public'
  and table_name in ('vortex_items', 'vortex_obligations', 'vortex_obligation_detections');

-- FK chain (who points at these tables, who do they point at).
select
    tc.table_schema || '.' || tc.table_name as source_table,
    kcu.column_name as source_column,
    ccu.table_schema || '.' || ccu.table_name as target_table,
    ccu.column_name as target_column
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu
  on tc.constraint_name = kcu.constraint_name and tc.table_schema = kcu.table_schema
join information_schema.constraint_column_usage ccu
  on ccu.constraint_name = tc.constraint_name and ccu.table_schema = tc.table_schema
where tc.constraint_type = 'foreign key'
  and (ccu.table_name in ('vortex_items', 'vortex_obligations', 'vortex_obligation_detections')
       or tc.table_name in ('vortex_items', 'vortex_obligations', 'vortex_obligation_detections'));
```

### 4.2 Decision tree after discovery

| Discovery result | Action |
|---|---|
| Zero rows + zero consumers + zero downstream FKs | Drop directly (`drop table`); document in #107 cleanup. **No migration needed.** |
| Zero rows + zero consumers + FKs pointing at them from other tables | Move behind facade view, then update the pointing FKs to target `app_vortexcore.vortex_<table>` first. |
| Has rows OR has consumers | Full Phase 4 migration (rename → facade view, same shape as Phase 1-3). |
| Has RLS policies referencing app logic | Hand off to VERA for security review before any migration. |

### 4.3 Migration outline (Phase 4 — template)

Same shape as Phase 1-3 once discovery is complete: rename → facade view → RLS mirror →
explicit grants. The exact column list and RLS policies are deferred until §4.1 discovery.

### 4.4 Rollback (Phase 4 — template)

Same as Phase 1-3: drop facade view, rename back. **Or, if Phase 4 resolves to "drop
directly" per §4.2 row 1, rollback is `drop table` (no data to restore).**

---

## Cross-cutting rollback strategy

### R1. Single-step rename means single-step rollback

Every phase renames the legacy public base table to `_legacy_<name>` before creating
the facade view. Rollback is always:

```sql
drop view if exists public.<table>;
alter table if exists public._legacy_<table> rename to <table>;
```

No data is touched on the renamed table during the migration, so rollback is lossless
up to the moment consumers write through the facade view.

### R2. Pre-flight parity assertions

Each phase begins with a DO block that asserts row count + user_id parity between
the legacy and canonical tables. A failed assertion aborts the migration before any
DDL is issued.

### R3. Per-table explicit grants only

No phase uses schema-wide grants. Rollback restores the original per-table grants
from the originating migration file.

### R4. Service-role verification after each phase

After each phase migration, run:

```sql
-- As service_role, exercise every CRUD verb through the facade view.
set role service_role;
select count(*) from public.<table>;
insert into public.<table> (...) values (...) returning *;
update public.<table> set ... where ...;
delete from public.<table> where ...;
reset role;

-- As authenticated (impersonate a real user), exercise SELECT.
set role authenticated;
select set_config('request.jwt.claim.sub', '<test_user_id>', true);
select * from public.<table> where user_id = '<test_user_id>'::uuid;
reset role;

-- As anon, expect 0 rows (RLS denies).
set role anon;
select * from public.<table>;
reset role;
```

A failure on any verb means rollback immediately.

### R5. Post-rollback data parity check

After rolling back, assert:

```sql
select count(*) as legacy_rows from public.<table>;
-- Should equal pre-migration row count.
```

### R6. Window before legacy base table removal

Per issue #89 addendum, legacy public base tables are NOT dropped in any phase.
Removal is a separately approved cleanup, tracked under #107, after all consumers
have been migrated. The renamed `_legacy_*` tables remain in `public` (read-only
to service_role) for at least one full release window.

---

## What this plan does NOT cover

1. **Consumer migration** — every phase notes which consumers read/write the affected
   table. Migrating consumers to target `app_vortexcore.<table>` directly is a
   follow-on cleanup, not in this plan.
2. **Dropping the `_legacy_*` tables** — explicitly out of scope per issue #89 addendum
   and #107 redraft.
4. **Cross-app ownership resolution** — seftec-store collision (issue #107) and the
   `virtual_cards → sm_subscriptions` FK (session-2026-08-19 §4.4) must be resolved
   before this plan's Phase 1 can ship, because Phase 1 doesn't move `stripe_subscriptions`
   out of `public` if any other app in the project also reads it.
5. **Live catalog discovery for the 3 zero-provenance tables** — Phase 4 is a template
   until §4.1 discovery runs against `mxtsdgkwzjzlttpotole`.

---

## Open questions for the operator (before any phase ships)

1. **Order of phases 1 and 3:** is Phase 3 (lower risk? no — Phase 1 has lower risk and
   fewer consumers) the right next step, or should we do Phase 1 first? Recommendation:
   Phase 1, in the order written.
2. **Trigger rewrite scope:** is `handle_new_user()` rewrite in scope for Phase 2, or a
   separate card? Recommendation: separate card; Phase 2 pre-condition.
3. **Phase 4 decision authority:** who decides "drop directly" vs "full migration" for
   the zero-provenance tables after discovery? Recommendation: VERA for the RLS/policy
   review; NORA for the product/feature decision (do these tables have a planned
   consumer?); CODA for the SQL once both clear.
4. **Cross-app FK validation:** before Phase 1 ships, confirm seftec-store's edge
   functions do not read `public.stripe_subscriptions` or `public.stripe_customers`.
   Recommendation: run `select * from public.subscriptions` and check seftec-store
   for any `.from('stripe_subscriptions')` calls.

---

## Status against t_a4cc6236 acceptance criteria

- [x] Live catalog survey completed for all 8 tables (inventory §1-8; Phase 4 still
      needs §4.1 catalog queries for full column lists on the 3 zero-provenance tables)
- [x] Phase 1-4 migrations drafted (this document; Phase 4 is a template pending discovery)
- [x] Rollback strategy documented (R1-R6 above)
- [ ] Issue #89 updated with this plan

---

## References

- Inventory: `docs/reports/legacy-table-inventory-2026-08-16.md`
- Reconciliation: `docs/reports/migration-reconciliation-2026-08-16.md`
- Session summary: `docs/reports/session-2026-08-19-platform-work-summary.md`
- Issue #89: https://github.com/thefixer3x/vortexcore/issues/89
- Issue #107 (parent remediation): https://github.com/thefixer3x/vortexcore/issues/107
- Canonical schema: `supabase/migrations/20260427_app_vortexcore_schema.sql`
- Remote-only migrations: `20260816055635_fix_app_vortexcore_facade_grants_and_backfill.sql`,
  `20260816064721_harden_vortex_security_advisor_findings.sql`,
  `20260816064741_revoke_public_execute_on_vortex_rpcs.sql`

---

*This document is a planning artifact. No production operations performed. No migration
files were created in `supabase/migrations/` for this plan — the SQL blocks above are
drafts to be moved into numbered migrations only after each phase is individually approved
per the cross-cutting rollback strategy and the #107 ownership-classification gate.*
# Migration Reconciliation Report — t_d887445e

**Date:** 2026-08-16
**Scope:** Reconcile remote migration `20260816055635_fix_app_vortexcore_facade_grants_and_backfill` with repository history. Quarantine unsafe SQL in `20260816_fix_missing_columns_and_tables.sql`.
**Status:** Review complete. Quarantine proposed. Replacement migration drafted.

---

## 1. Remote Migration Provenance

**Migration ID:** `20260816055635_fix_app_vortexcore_facade_grants_and_backfill`
**Applied by:** Hermes run 53 (remote gateway worker)
**Timestamp:** ~2026-08-16 06:00 UTC
**Worktree status:** No corresponding file exists in `supabase/migrations/`.

### What it did (per GitHub issue #89 comments)
- Repaired **explicit, per-table, per-role privileges** on the three canonical `app_vortexcore` base tables:
  - `app_vortexcore.vortex_wallets`
  - `app_vortexcore.vortex_transactions`
  - `app_vortexcore.vortex_settings`
- **Backfilled 16 wallet rows** for 16 public profiles.
- Post-migration: `authenticated` and `service_role` have effective CRUD on all three base tables. `anon` remains denied.

### Why this is a governance gap
A remote Hermes worker mutated production without a checked-in migration file. The changes are effective but have no version-control provenance, no test evidence, and no rollback plan stored in the repository.

---

## 2. Repository Migration History (chronological)

| # | Migration file | Date | Key actions |
|---|---|---|---|
| 1 | `2025-08-30_tighten_privileges.sql` | Aug 2025 | Revoke anon, grant authenticated/service_role |
| 2 | `2025-08-30_edge_rate_limits.sql` | Aug 2025 | Create public.edge_rate_limits; SECURITY DEFINER no search_path |
| 3 | `20250928_clean_vortex_core_tables.sql` | Sep 2025 | Create profiles/wallets/transactions in public; CREATE handle_new_user() SECURITY DEFINER; GRANT ALL ON ALL TABLES |
| 4 | `20250929_optimize_rls_policies.sql` | Sep 2025 | RLS consolidation; GRANT ALL repeated |
| 5 | `20251122_add_currency_language_to_profiles.sql` | Nov 2025 | ADD COLUMN default_currency, language to profiles |
| 6 | `20251122_create_wallets_transactions_tables.sql` | Nov 2025 | Create public.wallets/transactions (IF NOT EXISTS); explicit per-table grants |
| 7 | `20260427_app_vortexcore_schema.sql` | Apr 2026 | **Canonical architecture:** app_vortexcore schema, invoker facades, control_room |
| 8 | `20260815_add_onboarding_completed_to_profiles.sql` | Aug 2026 | ADD COLUMN onboarding_completed to profiles |
| 9 | `20260815_add_trial_end_to_stripe_subscriptions.sql` | Aug 2026 | ADD COLUMN trial_end to stripe_subscriptions |
| 10 | `20260815_add_two_factor_enabled_to_profiles.sql` | Aug 2026 | ADD COLUMN two_factor_enabled to profiles |
| 11 | `20260816_fix_missing_columns_and_tables.sql` | Aug 2026 | **UNSAFE — see Section 3** |

---

## 3. Unsafe SQL Analysis — 20260816_fix_missing_columns_and_tables.sql

### 3.1 Creates duplicate public base tables (CRITICAL)
The migration creates `public.vortex_wallets` and `public.vortex_transactions` as **BASE TABLES** (lines 44, 75).

**Conflict:** The canonical architecture (migration 7) already defines `app_vortexcore.vortex_wallets` and `app_vortexcore.vortex_transactions` with **security_invoker=true public facades**. Creating duplicate base tables in public **breaks** the facade pattern: the `IF NOT EXISTS` check in the canonical schema's facade-creation logic will now skip facade creation because a base table exists, and the new base tables have a **different schema** (e.g., `user_id` column naming, different column sets).

**Impact:**
- Facade views are skipped or become inconsistent
- Frontend queries using `security_invoker=true` views will reach duplicate tables with potentially incompatible schemas
- Data in existing `app_vortexcore` tables is **not** migrated to these new tables

### 3.2 Schema-wide GRANT ALL (CRITICAL)
Lines 163-164:
```sql
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
```

This contradicts:
- Issue #89's rewrite requirements (explicit per-table grants only)
- Issue #96's findings (Supabase Data API explicit grants)
- The principle of least privilege
- The approach in migration 6 (20251122), which uses explicit grants

### 3.3 SECURITY DEFINER without constrained search_path (HIGH)
Line 124: `public.create_user_wallet()` uses `SECURITY DEFINER` with no `search_path` constraint. The `app_vortexcore.touch_updated_at` function (migration 7, line 77) correctly uses `SET search_path = pg_catalog, app_vortexcore`.

### 3.4 Nested dollar-quoted SQL blocks (MEDIUM)
The migration uses `DO $$ ... END $$;` blocks containing nested `$$` function body delimiters. This can cause parsing failures in some PostgreSQL versions.

### 3.5 No existing-user backfill (MEDIUM)
The migration only creates wallets on signup (lines 123-136). Existing users have no wallets created.

---

## 4. Quarantine Plan

**Action:** Rename `20260816_fix_missing_columns_and_tables.sql` to `20260816_fix_missing_columns_and_tables.sql.QUARANTINED`.

The quarantined file will contain:
- Original SQL preserved with a header explaining why it is unsafe
- Line-numbered reference to each defect in Section 3
- Notes on what the remote migration `20260816055635` accomplished instead

---

## 5. Replacement Migration Plan

A replacement migration will:
1. **Add missing profiles columns** using IF NOT EXISTS — safe, idempotent.
2. **Add explicit per-table grants** on `app_vortexcore` base tables for authenticated and service_role only.
3. **Backfill wallets** for existing profiles that lack one.
4. **Revoke** any existing `GRANT ALL` on affected tables.
5. **Constrain** `public.create_user_wallet()` search_path.
6. **Validate** with explicit per-table grant verification.

---

## 6. Security Advisor Findings — Nine Vortex WARNs

| # | Finding | Function/Table | Severity | Remediation |
|---|---|---|---|---|
| 1 | Mutable search_path | `app_vortexcore.touch_updated_at` | MEDIUM | Already uses SET search_path; verify live |
| 2 | Public SECURITY DEFINER — anon executable | `vortex_delete_ai_credential` | HIGH | Revoke from PUBLIC |
| 3 | Public SECURITY DEFINER — anon executable | `vortex_get_ai_credential_status` | HIGH | Revoke from PUBLIC |
| 4 | Public SECURITY DEFINER — anon executable | `vortex_get_setting` | HIGH | Revoke from PUBLIC |
| 5 | Public SECURITY DEFINER — anon executable | `vortex_set_setting` | HIGH | Revoke from PUBLIC |
| 6-9 | Duplicate role-specific warnings for 2-5 | Same as 2-5 | HIGH | Address in same pass |

---

## 7. Acceptance Criteria (t_d887445e)

- [x] Migration provenance documented (this report)
- [ ] `20260816_fix_missing_columns_and_tables.sql` quarantined (renamed + header comment)
- [ ] Replacement migration created following canonical `app_vortexcore` architecture
- [ ] No `GRANT ALL ON ALL TABLES` in any migration file
- [ ] All SECURITY DEFINER functions have constrained `search_path`
- [ ] Explicit per-table, per-role grants only
- [ ] Existing-user backfill included
- [ ] Dry-run passes on isolated database
- [ ] Two-user RLS isolation tested
- [ ] Remote migration provenance documented


*This report is read-only evidence. No production operations performed.*
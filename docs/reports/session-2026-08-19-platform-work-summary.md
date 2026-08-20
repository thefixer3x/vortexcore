# Session Summary — 2026-08-19 → 2026-08-20 — Bulk Payments, Virtual Cards, Issuing+Connect Planning, DB Reconciliation

**Repo:** thefixer3x/vortexcore (`vortex-core-app`)
**Supabase project:** `mxtsdgkwzjzlttpotole` ("the-fixer-initiative", shared across VortexCore, seftec-store, Maple Movement Hub, and others)
**Status:** All items below are shipped and pushed to `main` unless noted otherwise.

---

## 1. Bulk Payments (closes #93)

Replaced a 9-line stub at `/profile/payments/bulk-payments` with a real, tier-gated feature.

- `src/hooks/use-bulk-payments.ts` — fetches wallet + transactions, groups by `metadata.batch_id` into batches; `submitBatch()` inserts all recipients as one atomic multi-row `vortex_transactions.insert([...])` sharing a generated `batchId`.
- `src/components/payments/bulk-payments/{BulkPaymentForm,BulkPaymentHistory,BulkPaymentDashboard}.tsx` — manual entry + CSV import, tier-gated recipient limits (`free: 5, pro: 50, enterprise: ∞`), expandable batch history.
- Added a `/bulk-payments` → `/profile/payments/bulk-payments` redirect route (`src/App.tsx`) — the bare path referenced in issue #93's title had never actually resolved; a prior fork's claim that it "no longer 404s" was checked and found false, then fixed for real.
- `scripts/acceptance-gate/routes.json` updated to track the new route.

**Commit:** `aa8678b`

---

## 2. Virtual cards: opened self-service creation, linked real wallet funding

Found (via live Stripe MCP query — zero cardholders/cards ever existed on the account) that virtual card creation had been silently failing for every real user since it shipped.

**Root causes fixed** in `supabase/functions/stripe/index.ts`:
- `create_cardholder` / `create_card` required an `'issuer'`/`'admin'` role that nothing in the codebase ever grants (roles come only from `app_metadata`, settable only server-side). Gate removed; ownership is now enforced by checking the cardholder's `metadata.user_id` against the caller instead.
- `get_card_details` was gated to `'admin'`/`'compliance'` only, blocking card owners from ever seeing their own PAN/CVC. Gate removed, relies on the same DB-ownership check as `get_card`.
- Three existing ownership checks (`get_card`, `update_card`, `get_transactions`) tightened from fail-open (`vc && vc.user_id !== auth.userId`) to fail-closed (`!vc || vc.user_id !== auth.userId`).
- Cardholder creation now requires and forwards a real billing address (Stripe requires this) — added to `VirtualCardForm.tsx` / `VirtualCardManager.tsx` / `virtualCardService.ts` / `lib/stripe.ts`.

**New: real wallet-linked spend authorization**, chosen over keeping cards admin-gated or funding cards from an unrelated static limit:
- `supabase/functions/stripe-issuing-authorization/index.ts` (new, standalone `Deno.serve`, not `withAuthMiddleware` — Stripe calls this with `stripe-signature`, synchronous, 2s budget) — approves/declines `issuing_authorization.request` by checking the card's wallet balance. Fails closed on every ambiguous case (unknown card, missing wallet, currency mismatch, bad signature, locked card).
- `supabase/functions/stripe-webhook/index.ts` — added `issuing_transaction.created` handling: idempotency-checked (via `reference = transaction.id`) atomic wallet debit/credit through a new `adjust_wallet_balance` RPC.
- `supabase/migrations/20260819120000_wallet_balance_adjust_fn.sql` — `SECURITY DEFINER` RPC restricted to `service_role`, avoids read-modify-write races on `vortex_wallets.balance`.

**Commit:** `028eb3b`

**Not yet done:** real Stripe Issuing balance funding (blocked on the DB reconciliation below), and the Connect-per-user-account migration (tracked as an epic, see next section).

---

## 3. Stripe Issuing + Connect research and tracking

Researched via Stripe MCP (`search_stripe_documentation`, live account `acct_1RBGUq2KF4vMCpn8`, `livemode: true`) whether Issuing balance funding is per-user or platform-wide.

**Finding:** this repo uses Direct Issuing only (one platform account, one shared Issuing balance) — confirmed via full-repo grep, zero Stripe Connect code exists here. A *different* app in the same Supabase project (`seftec-store`) has its own, separate, and largely non-functional Stripe Connect implementation for marketplace payments (see §4.3) — unrelated to card funding, not a usable reference pattern.

To get per-user isolated card funding requires "Issuing for platforms" — Connect Custom accounts, each with its own Issuing balance, funded via Connect balance transfers from the platform account.

**Tracked as GitHub issues** (thefixer3x/vortexcore):
- **#106** (epic) — migrate virtual cards from shared Direct Issuing to Issuing + Connect
- **#107** — virtual card tables shared with unrelated app (seftec-store) in the same Supabase project *(scope substantially broadened after §4 below — see §5)*
- **#108** — create connected accounts + KYC/requirements collection
- **#109** — scope cardholder/card actions to the user's connected account
- **#110** — per-user funding via Connect balance transfers (open design question: wallet-as-ledger-with-real-transfers vs. Stripe-balance-as-source-of-truth — needs explicit user decision)
- **#111** — re-evaluate the real-time authorization webhook (§2) once per-account Stripe balances exist
- **#112** — ADR: Issuing + Connect architecture decision

**Explicit decision from this session:** do not fund the current shared-balance Issuing model yet. Hold until at least the schema isolation in §5 is underway — the shared-project collisions found below make "who does this balance actually belong to" an open question.

---

## 4. Shared-Supabase-project architecture audit

### 4.1 The database is shared across multiple unrelated apps

`mxtsdgkwzjzlttpotole` is not VortexCore-only. Confirmed live: `virtual_cards` and `profiles` are column-merged between VortexCore and seftec-store's schemas; `subscriptions` coexists as a seftec-store billing table alongside VortexCore's own `stripe_subscriptions`/`user_tiers`. A stray `{sub-track-pro}` placeholder on a VortexCore test invoice (fixed earlier this session) was traced to this same root cause.

### 4.2 A real, partially-completed isolation migration already exists

This was not discovered by reading code — it surfaced via the `lanonasis` memory system (`mcp__claude_ai_a-lanonasis__search_memories`), which is the actual system of record for this work; none of it is in any repo's git history:

- **2026-01-06** — Phase 1 (16 schemas created: `security_service`, `auth_gateway`, `shared_services`, `analytics`, `billing`, `marketplace`, `vendors`, `client_services`, `control_room`, plus `app_the_fixer_initiative`, `app_onasis_core`, `app_lanonasis_maas`, `app_seftec`, `app_seftechub`, `app_vortexcore`, `app_mcp_monorepo`) → Phase 2 (4 security tables) → same-day Phase 4/5 (46 more tables: `auth_gateway` +6, `analytics` 18, `billing` 9 incl. `stripe_connect_accounts`, `marketplace` 13 incl. `marketplace_transactions`). 51 tables total, 57 `public` facade views, 72 tables still in `public`. Branch `claude/database-reorganization-guide-S5X86`, commit `83bb34d` — **location of that branch not yet confirmed; it explains why seftec-store's migrations don't define `stripe_connect_accounts`/`marketplace_transactions` even though the live tables are correct.**
- **2026-08-16** — a separate audit (surfaced via memory, cross-referenced with GitHub issue #89) confirmed `app_vortexcore.{vortex_wallets,vortex_transactions,vortex_settings}` are correctly isolated with `public` facade views over them — proof the target pattern works. Also found: a concurrent Hermes worker (run 53) applied a production migration with no matching local file, and flagged 8 orphaned `public` base tables with no `app_vortexcore` counterpart: `profiles`, `wallets`, `transactions`, `stripe_customers`, `stripe_subscriptions`, `vortex_items`, `vortex_obligations`, `vortex_obligation_detections`.
- **Hermes Kanban board** (`devops` board, `~/.hermes/kanban/boards/devops/kanban.db`) had two tasks tracking this, `t_78719b4c` and `t_a4cc6236`, both created 2026-08-18, both sitting `blocked` with zero runs/activity since creation.

### 4.3 seftec-store's own Stripe Connect code is not a safe reference pattern

Live tables `billing.stripe_connect_accounts` / `marketplace.marketplace_transactions` are correctly isolated with `public` facade views — the architecture *is* live and correct there. But the seftec-store repo itself (`seftechub-workspace/apps/seftec-store`) has no migration defining either table, no `/marketplace/onboarding` route for Stripe's own onboarding redirect to land on, and no caller anywhere for its `create_payment` action — the function has likely never run end-to-end. Do not copy its patterns.

### 4.4 A live, dangerous structural collision, caught before any data existed

`public.virtual_cards.subscription_id` carries a foreign key into `public.sm_subscriptions` — VortexCore's virtual-card table pointing at SubTrack's *external* subscription-tracking feature (Netflix/Spotify-style tracking, not VortexCore billing). Both tables were at 0 rows when found — a schema correction, not a data migration. **Must be removed before any real Issuing traffic.**

### 4.5 Billing split-brain

Two subscription stores disagree: `public.stripe_subscriptions` (2 rows, real Stripe truth, what `check-subscription` actually reads) vs. `billing.subscriptions` (1 row, `status=active, plan_name=free, stripe_subscription_id=NULL`) — and `public.subscriptions` is a facade view over the *latter*. Querying `public.subscriptions` currently shows stale/wrong state.

---

## 5. #89 reconciliation applied

**Commit `eb257d4`**, pushed to `main`.

1. **Deleted** `supabase/migrations/20260816_fix_missing_columns_and_tables.sql` — it had been copied to a `.QUARANTINED` sibling on 2026-08-18 but the original was never removed, so it still matched `migrations/*.sql` and would have applied its schema-wide `GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated` on the next push to a fresh environment. Confirmed via the live migration ledger (`supabase_migrations.schema_migrations`) it was **never actually applied** to `mxtsdgkwzjzlttpotole` — corrects an earlier same-session claim that it was already the final state after a replay.
2. **Backfilled 6 migrations** that were applied directly to the live project with no local file, captured verbatim (read-only `SELECT` against `schema_migrations.statements`, not reconstructed): `20260816055635_fix_app_vortexcore_facade_grants_and_backfill`, `20260816064721_harden_vortex_security_advisor_findings`, `20260816064741_revoke_public_execute_on_vortex_rpcs`, `20260819014135_add_trial_end_to_stripe_subscriptions`, `20260819015142_fix_sync_auth_user_to_public_target_base_table`, `20260819015351_pin_search_path_sync_auth_user_to_public`. All six `created_by: info@lanonasis.com` — same operator as this repo, consistent with concurrent work from another worktree/session rather than unrelated drift.
3. GitHub #89 updated with full evidence and an explicit standing instruction: **do not run `supabase db push` blindly against this project** — it is shared across apps/sessions; diff the live ledger first.
4. Hermes task `t_78719b4c` marked `done`. `t_a4cc6236` (8-table inventory) left `blocked` — its own acceptance items are unmet; folded into the broader #107 scope below instead of force-closed.

---

## 6. Redefinition of #107 (not yet filed — pending review)

Originally scoped narrowly ("move conflicting tables out of `public`"). Should become the parent remediation:

> Complete `onasis-core-v2` schema isolation and eliminate shared-`public` ownership.

Invariant: `public` may contain compatibility views, narrow RPC façades, and intentional PostgREST entrypoints — never application/billing/marketplace/security/AI/subscription-manager state.

Proposed acceptance criteria:
1. Every live `public` base table gets an owner classification (platform/shared, billing, marketplace, security, specific app, legacy, unknown).
2. Every canonical object has a tracked migration.
3. No VortexCore FK references another app's domain table (§4.4).
4. `virtual_cards.subscription_id → sm_subscriptions` removed before Issuing goes live.
5. One authoritative subscription-state model, not `stripe_subscriptions` + unrelated `billing.subscriptions` (§4.5).
6. All `public` compatibility objects are `security_invoker` views/RPC façades.
7. A clean DB replay reproduces the same schema.
8. CI gate rejects new unapproved `public` base tables (shrinking allowlist: 91 → 70 → 40 → 15 → ~0).
9. Application code is schema-aware, doesn't silently hit a same-named `public` object.
10. Only after all of the above does real Issuing funding / Connect production rollout resume.

**Do not move tables based on name alone** — establish ownership and a single source of truth first, then add façades only where backward compatibility requires them.

---

## 7. Still open / next steps

- Hand off the §6 scope (plus the memory-system history in §4.2 and the Hermes board state) to a dedicated audit agent — a draft handoff prompt exists in this session's transcript, not yet finalized or dispatched.
- Locate branch `claude/database-reorganization-guide-S5X86` / commit `83bb34d` to reconcile provenance for `billing.stripe_connect_accounts` and `marketplace.marketplace_transactions`.
- User decision still pending: fund the current shared-balance Issuing model now (fast, likely wasted once Connect migration lands) vs. hold for #107.
- User decision still pending (blocks #110/#111): wallet-as-ledger-with-real-transfers vs. Stripe-balance-as-source-of-truth for per-account funding.
- No implementation work has started on #107–#112 themselves — tracking issues only.

---

## References

- Commits: `aa8678b`, `028eb3b`, `12de7b2`, `eb257d4`
- Issues: #89, #93 (closed), #106, #107, #108, #109, #110, #111, #112
- Hermes tasks: `t_78719b4c` (done), `t_a4cc6236` (blocked)
- Existing reports: `docs/reports/migration-reconciliation-2026-08-16.md`, `docs/reports/legacy-table-inventory-2026-08-16.md`
- Memory entries (lanonasis): "Database Reorganization - Phase 1 & 2 Complete", "Database Reorganization - Phase 4 & 5 Complete", "Vortex Core settings and authenticated placeholder audit 2026-08-16", "VortexCore — Confirmed DB Ground Truth (2026-04-27)"

# Acceptance & Release Gates — VortexCore

Source: 2026-08-16 Production Audit · GitHub Issue #97 · Board phase 5 (Acceptance and staged rollout).
Commit gated: `bf76efd3` (main, 2026-08-16). Runner: `scripts/acceptance-gate/run-gates.sh`.

> **Policy:** No production deploy proceeds while any **HARD** gate is RED. Gate results are
> written to `audit/acceptance-gate-results.{log,json}` on every run for the audit trail.
> CI (`.github/workflows/acceptance-gate.yml`) enforces this as a required check.

Gate types:
- **HARD** — must pass; a RED result blocks deploy and fails CI.
- **SOFT** — may be `SKIP`ped when the required environment (DB, credentials, live host) is not
  available in the runner; a RED result (environment present but check failing) still blocks deploy.

---

## Gate 1 — Build Validation `HARD`

**Purpose:** clean install + production build from the exact commit, no TS/lint/test failures.

| Check | Command | Status @ bf76efd3 | Notes |
|---|---|---|---|
| Clean install | `bun install --frozen-lockfile` | ✅ PASS | 638 pkgs |
| Production build | `bun run build` | ✅ PASS | vite build, 1.5s; chunk-size warning only |
| Type check | `bunx tsc -b --noEmit` | 🔴 **FAIL** | see below |
| Lint | `bun run lint` | 🔴 **FAIL** | 130 problems (109 err / 21 warn) |
| Unit tests | `bunx vitest run` | ⏳ untested this run | wire in CI gate |

**Findings (must be resolved before deploy):**
- Strict TypeScript check fails on the current commit. Errors span production code, not just
  tests: `src/pages/Dashboard.tsx` (17), `src/hooks/useVortexChatPersistent.ts` (9),
  `src/components/ui/chart.tsx` (8), `src/components/settings/sheets/ProfileSheet.tsx` (8),
  `src/services/*` (virtualCard, personalizedAI, chatSession), plus `src/test/setup.ts` / e2e
  specs (missing `@types/node`, `crypto-js` declaration, `global` refs).
- ⚠️ The existing CI "Type checking" step runs `bun run build` only. Vite (swc) does **not**
  type-check, so CI is green while `tsc --noEmit` is red. The gate below uses real `tsc`.
- Lint fails primarily on `supabase/functions/stripe/index.ts` (no-case-declarations) and
  `tailwind.config.ts` (require import).

**Exit:** all five checks green, or the gate is RED and deploy is blocked.

---

## Gate 2 — Schema Migration Safety `HARD` (env-gated)

**Purpose:** migration dry-run on an isolated DB + RLS cross-user isolation + no missing grants.

| Check | How | Depends on |
|---|---|---|
| Migration dry run on isolated DB | run pending `supabase/migrations/*.sql` against a **throwaway** branch/DB; abort on error | sibling P0 t_5e7e78bd (migration 20260816 rewrite — unsafe as written) |
| RLS cross-user isolation | `scripts/rls-validate.sql` + REST deny-by-default checks (user A vs user B) | `SUPABASE_DB_CONNECTION_STRING`, test JWTs |
| No new tables missing grants | verify each new table has RLS + explicit grants | `scripts/rls-validate.sql` |

**Status @ bf76efd3:** ⏳ **SKIP** in this run — no DB connection / test credentials, and the
20260816 migration is under active rewrite by t_5e7e78bd. This gate cannot meaningfully pass
until that lands.

---

## Gate 3 — E2E Coverage `HARD` (env-gated)

**Purpose:** authenticated Playwright coverage across every primary route; protected routes block
unauthenticated users; error handling 403/500/404 covered.

| Check | Spec | Status |
|---|---|---|
| Authenticated route coverage | `src/test/e2e/*.spec.ts` (auth, ai-chat, deeplink) | present; needs run vs live/env backend |
| Protected routes | `src/test/e2e/protected-routes.spec.ts` (unauth → redirect to `/`) | present |
| Error handling 403/500/404 | `src/test/e2e/error-pages.spec.ts` (404) — 403/500 missing | partial |

**Status @ bf76efd3:** ⏳ **SKIP** in this run — requires Playwright browsers + a reachable
backend/Supabase and test creds. Error handling currently covers 404 only; 403 and 500 paths
are **not** yet speced (child card).

---

## Gate 4 — Visual Validation `SOFT` (env-gated)

**Purpose:** mobile/tablet/desktop visual snapshots, no overlapping controls, dark mode correct.

| Check | How | Status |
|---|---|---|
| Responsive snapshots | Playwright screenshot projects (Mobile Chrome/Safari + desktop) | ⛔ no snapshot specs exist |
| No overlapping controls | snapshot diff / overlap assertion per viewport | ⛔ not implemented |
| Dark mode render | theme-toggle snapshot in dark mode | ⛔ not implemented |

**Status @ bf76efd3:** ⛔ **NOT IMPLEMENTED** — no visual regression infra. Child card created.
SOFT gate: skipped without browser + host, but RED when run and failing.

---

## Gate 5 — Data Hygiene `HARD`

**Purpose:** zero sample financial records in prod bundles, zero raw SQL errors visible, no
hardcoded dates past 2024, no fabricated/fake "Live" metrics.

| Check | How | Status @ bf76efd3 |
|---|---|---|
| Sample/fake financial data | `scripts/acceptance-gate/data-hygiene-check.mjs` | run in gate (see report) |
| Raw SQL errors in UI | same scan (grep for `error`, SQL tracebacks in user-facing strings) | run in gate |
| Hardcoded dates > 2024 | same scan (`20(2[5-9]|[3-9][0-9])` date literals) | run in gate |
| Fabricated metrics / fake "Live" | same scan (`demo`, `sample`, fake `$` amounts, `API Online` style strings) | run in gate |

Sibling P0 t_3e525fdc owns the code-level removal of fake dashboard state; this gate **scans and
reports** so the release can never ship it.

---

## Gate 6 — Route Completeness `HARD`

**Purpose:** route inventory test prevents navigation to 404/placeholder destinations.

| Check | How | Status @ bf76efd3 |
|---|---|---|
| Route inventory manifest | `scripts/acceptance-gate/routes.json` | committed (see below) |
| Static: every route registered in router | `scripts/acceptance-gate/route-inventory-check.mjs` vs `src/App.tsx` | run in gate |
| Live: every route resolves (no 404/placeholder) | same script with `BASE_URL` set + auth | optional live probe |

**Known violation @ bf76efd3:** `/notifications`, `/security`, `/help` render `<ComingSoon/>`
placeholder — a **placeholder destination**, which the gate flags as WARN/BLOCK per policy.
Sibling t_3affa9d5 tracks `/bulk-payments` 404 + route completeness audit.

---

## Gate 7 — Deployment Provenance `HARD` (env-gated)

**Purpose:** deployment SHA displayed in diagnostics; SHA correlated with the Vercel build; commit
history matches deployed artifacts.

| Check | How | Depends on |
|---|---|---|
| SHA in diagnostics | app diagnostics panel renders the built commit SHA | sibling P0 t_38b6f77d (provenance not yet established) |
| SHA ↔ Vercel build correlation | compare `vercel env`/build log SHA to deployed SHA | `VERCEL_TOKEN`, project id |

**Status @ bf76efd3:** ⏳ **SKIP** — sibling t_38b6f77d owns establishing provenance. Gate reads
its output.

---

## Acceptance criteria (Issue #97)

- [x] All 7 gates documented as checklist — this file
- [x] No deployment without all gates passing — policy + CI gate workflow
- [x] Gating automation exists (CI integration) — `scripts/acceptance-gate/` + `.github/workflows/acceptance-gate.yml`
- [x] Results logged for audit trail — `audit/acceptance-gate-results.{log,json}` per run

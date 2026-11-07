# VortexCore Gap-Closure Implementation Plan

Status: draft for review · Created 2026-11-07 · Owner: VortexCore team

This plan lists every missing or half-wired piece found in a codebase review,
grouped into phases. Each item names the user-visible gap, the fix, and the
evidence (file) so it can be checked off independently.

Rules that apply to every phase (from AGENTS.md / project memory):
- New business tables live in `app_vortexcore` with `security_invoker` views in `public`, prefixed `vortex_`.
- Money movement runs server-side (edge functions, secret key); the wallet trigger blocks client-side balance changes.
- AI calls go through `ai-router`; no vendor names in the UI.
- Shared-table access policies are never changed without confirmation.
- Default currency NGN; every amount renders through `useCurrency().formatCurrency()`.

---

## Phase 1 — Correctness & currency consistency (small, no new backend)

| # | Gap | Fix | Evidence |
|---|-----|-----|----------|
| 1.1 | Side nav shows `USD NGN` | Remove hardcoded ` NGN` suffix | `src/components/layout/SideNavProfile.tsx:30` |
| 1.2 | Context default is `USD`, spec says NGN | Default `currency` state to `NGN` | `src/contexts/CurrencyContext.tsx:21` |
| 1.3 | Transactions page is empty (hardcoded `[]`), search does nothing, "New" button dead | Load `vortex_transactions` for the user, real tab filters (income/expense/pending), search, date/category filter; "New" opens `DashboardActionDialog` | `src/pages/Transactions.tsx` |
| 1.4 | Amounts use per-row currency / own formatter | Route all amounts via `formatCurrency` (Transactions, ModernTransactionList, AccountCard, ModernAccountCard, Obligations, BulkPayment*) | multiple |
| 1.5 | Legacy `TransactionList.tsx` uses mock data | Delete if unused, else wire to real data | `src/components/dashboard/TransactionList.tsx` |
| 1.6 | `InsightWidget` / `BankStatementAnalysis` contain placeholder content | Feed from `useFinancialInsights` / `import-statement` | `src/components/dashboard/InsightWidget.tsx`, `src/components/insights/BankStatementAnalysis.tsx` |

Decision needed: show amounts in the **user's currency label only** (no FX) or **convert with live FX rates**? Phase 1 assumes label-only; FX is Phase 4.

## Phase 2 — Settings fully wired

Settings rows that open nothing today (no sheet exists for the id):

| Row | Sheet id | Fix |
|-----|----------|-----|
| Cookies | `cookies` | Cookie/consent sheet, persisted in `vortex_settings` |
| Public business profile | `public-profile` | Public profile sheet (display name, address, logo) |
| Taxes | `taxes` | Tax ID / VAT settings sheet |
| Mobile Payments | `mobile-payments` | Mobile money / USSD preference sheet |
| Cards & Bank Accounts | `cards` | Payment methods sheet (Phase 3 backend) |
| Cash Payments | `cash` | Cash collection preference sheet |

Sheets that exist but don't persist:
- `AccountSecuritySheet` — switches use `defaultChecked`, buttons do nothing. Persist login/suspicious-activity alerts in `vortex_settings`; add login history (Supabase auth audit) and device/session list with sign-out-others.
- Settings `handleSave` shows a "notifications saved" toast for every sheet — make each sheet own its own save + message.
- Spec items with no UI yet: **sub-users & permissions**, **payment approval workflow**, **biometric toggle** (component exists, not surfaced), **2FA enrol** (`TwoFactorAuthForm` exists, not in settings), **feedback / report an issue**.
- Language selector: only en/fr/es; confirm locale files in `/locals` cover all strings.

## Phase 3 — Wallet funding & payment methods (new backend)

Today: "Add funds" only inserts a transaction row; no card vaulting; `pay-obligation` is wallet-only.

1. **Provider choice** (decision needed): Paystack/Flutterwave for NGN cards & bank transfer, Stripe for USD/EUR cards — or one provider.
2. Table `app_vortexcore.vortex_payment_methods` (+ public view): user_id, provider, provider_ref (token only), brand, last4, exp, is_default. No PAN ever stored.
3. Edge functions:
   - `payment-methods` — create setup session, list, set default, remove.
   - `fund-wallet` — charge a saved method or start hosted checkout; credit wallet **only from verified webhook**.
   - `payment-webhook` — signature-verified; idempotent on provider reference; writes completed transaction and credits `vortex_wallets` with service role.
4. Setting `default_payment_source` (`wallet` | method id) + optional "fall back to card when wallet is short" for `pay-obligation`.
5. UI: Cards & Bank Accounts sheet, Add Funds dialog with method picker, receipt.
6. Secrets: provider secret key + webhook secret (also outstanding: `STRIPE_WEBHOOK_SECRET`).

## Phase 4 — Payments features from the spec

| Feature | Current state | Fix |
|---------|---------------|-----|
| Send money / bills / request | Dialog inserts a row, no real movement | `transfer` edge function (wallet→wallet internal; external via provider), `pay-bill` using `say_bills` provider |
| Saved beneficiaries | `BeneficiaryManager` is a stub heading | CRUD on `beneficiaries` table (verify its policies first — shared table) |
| Bulk upload | `BulkUpload` stub; bulk payments record rows only | CSV parse → preview → submit via server function with balance check |
| Beneficiary categories | `CategoryManager` stub | Simple tag CRUD |
| QR payments | Missing | Generate receive QR (wallet id + amount), scan-to-pay with camera |
| Recurring payments | Missing (obligations detect but don't auto-pay) | `vortex_recurring_payments` + scheduled function (pg_cron) |
| Confidential mode | Missing | Per-transaction flag + display-name override |
| Multiple wallets / currency wallets | Single primary wallet | Create-wallet flow per currency |
| FX conversion | Missing | Rates function + optional converted display |

## Phase 5 — Insights, security, compliance

- Budgets: user-set category budgets + AI suggestions (Insights page currently read-only).
- Forecasting & notifications: cash-flow forecast from obligations + recurring; notification rules per payment type.
- Fraud/anomaly alerts on new transactions (trigger → ai-router classification → notification).
- KYC/AML: verification status, document upload (storage bucket), gate higher limits.
- Offline mode: cache balances/transactions (service worker + IndexedDB).
- Onboarding: `OnboardingFlow` exists with placeholder steps — wire to first-login state.
- In-app support chat surfaced in nav; feedback form.

## Phase 6 — Integrations & hardening

- Open Banking account linking (`obf-accounts` exists, no UI).
- Investment tracking, insurance/loan eligibility insights.
- Unused functions review: `gemini-ai` (legacy), `openai-assistant`, `payment`, `verify`, `callback-handler` — keep, wire, or delete.
- ~240 older database warnings review (shared DB — confirm per table).
- Tests per phase: currency formatting, funding idempotency, transfer balance rules, approval workflow permissions.

---

## Open decisions (needed before the phase starts)

1. Phase 1: label-only currency vs converted amounts.
2. Phase 3: payment provider(s) for funding and saved cards.
3. Phase 4: real external transfers/bill payments now, or internal-only first.
4. Phase 2: who can be a sub-user and what roles (viewer / initiator / approver / admin)?

## Suggested order

Phase 1 → Phase 2 (UI that doesn't need Phase 3) → Phase 3 → Phase 4 → Phase 5 → Phase 6.

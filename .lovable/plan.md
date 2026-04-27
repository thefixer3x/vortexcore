# Phased Plan: TypeScript + AI Chat + Stripe (aligned with existing roadmap)

This plan reconciles your two existing roadmaps:
- `docs/superpowers/plans/2026-04-26-vortexai-migration-plan.md` (VortexAI → Onasis router)
- `docs/superpowers/plans/2026-04-27-phase3-4-plan.md` (Stripe subscriptions + i18n)

It keeps their confirmed ground truths intact and slots the current TypeScript build errors in front as Phase 1.

---

## Ground truths I will NOT violate

- **Supabase project:** `mxtsdgkwzjzlttpotole` (NOT `ptnrwrgzrsbocgxlpvhd`)
- **AI router URL:** `https://ai.vortexcore.app` (the `vortex-ai` edge fn proxies to it)
- **Stripe price IDs (test mode):**
  - Pro → `price_1RiSAL2KF4vMCpn8wUyDio3N` ($4.99/mo)
  - Enterprise → `price_1RiSAi2KF4vMCpn8B18AAI8v` ($9.99/mo)
- **Do not** hand-edit `src/integrations/supabase/types.ts` — regenerate after migrations.
- **Do not** delete `openai-chat` / `ai-router` until `vortex-ai` is verified.
- **Do not** touch `sm_*` tables (SubTrack feature, not billing).
- **Do not** drop/truncate `user_tiers` (16 real users on free tier).
- All new edge fns use `withAuthMiddleware`; webhook uses service role.

---

## Phase 1 — Get the build green (TypeScript only, no behavior changes)

Goal: `tsc` passes so we can ship anything else.

1. **AI chat JSON typing** — `useVortexChatPersistent.ts`, `chatSessionService.ts`, `EnhancedVortexAIChat.tsx`
   - Read: `(row.messages as unknown as Message[]) ?? []`
   - Write: cast outgoing `messages` as `any` at the Supabase boundary (`Json` column)
   - Treat `sessions[i].messages` as `any[]` for length/preview
   - Guard `user?.id` (early return) in load/delete/rename
2. **`fetch` wrapper** — `src/lib/logrocket-utils.ts`
   - Use `(...args: Parameters<typeof window.fetch>) => originalFetch(...args)`, browser-only
3. **Dashboard action narrowing** — `src/pages/Dashboard.tsx`
   - `if (actionConfig) { … } else { … }` before property access
4. **`personalizedAIService`** — point at the actually-existing tables in this project (`wallets`, `transactions`, `vortex_settings` if present); remove references to tables not in current schema
5. **`virtualCardService`** — early-return on null ids
6. **Cleanup** — remove TS6198/TS6133 unused imports/destructures in `FinancialOverviewTabs.tsx`, `OverviewTabContent.tsx`, etc.
7. **crypto-js typings** — add `@types/crypto-js` (or tiny ambient `d.ts`)

Exit: `bun run build` clean, preview boots.

---

## Phase 2 — AI chat (execute the existing VortexAI migration plan)

Follow `2026-04-26-vortexai-migration-plan.md` §6 verbatim.

1. **Confirm `ONASIS_AI_GATEWAY_KEY` secret** is set on `mxtsdgkwzjzlttpotole`. If missing, request it via the secret tool — this is the only real blocker.
2. **Create `supabase/functions/vortex-ai/index.ts`** — thin proxy to `https://ai.vortexcore.app/api/v1/ai-chat`
   - `withAuthMiddleware`
   - Accept BOTH contracts: `{ prompt, history, systemPrompt }` AND `{ messages, wantRealtime }`
   - Inject VortexAI system prompt as `messages[0]`
   - Forward `X-API-Key: $ONASIS_AI_GATEWAY_KEY` + user JWT
   - Strip `onasis_metadata`, return `{ response: string }`
3. **Deploy** `vortex-ai` and smoke-test via `curl_edge_functions`
4. **Repoint frontend invokes** to `vortex-ai`:
   - `src/components/ai/OpenAIChat.tsx` (line ~65)
   - `src/hooks/useVortexChat.ts` (line ~74)
   - `src/hooks/useVortexChatPersistent.ts` (any `ai-router`/`openai-chat` calls)
5. **Verify session persistence** via `ai_chat_sessions` (already migrated)
6. **Defer deletion** of `openai-chat` / `ai-router` / `gemini-ai` / `openai-assistant` until after live verification (issue #68)

Exit: chat bubble works end-to-end signed in; no console errors; sessions persist + restore.

---

## Phase 3 — Stripe subscriptions (execute Phase 3 plan)

Follow `2026-04-27-phase3-4-plan.md`.

1. **DB migration** — `20260427_stripe_subscriptions.sql` creating `stripe_customers` + `stripe_subscriptions` with RLS (per §3.1). `supabase db push` then regenerate types.
2. **Tier constants** — `src/lib/subscription-tiers.ts` with the real price IDs above (§3.2).
3. **Update `create-checkout-session`** — link/upsert into `stripe_customers`, return `{ url }` (§3.3).
4. **Update `stripe-webhook`** — handle `checkout.session.completed`, persist `price_id`, AND update `user_tiers` row in the same handler (§3.4 + guardrail #8).
5. **New edge functions** (`withAuthMiddleware`):
   - `check-subscription` — returns `{ subscribed, tier, current_period_end }`
   - `customer-portal` — returns Stripe billing portal URL
6. **Frontend** — `SubscriptionContext` + `useSubscription` hook; wire `BillingSettings.tsx` and `SubscriptionSheet.tsx` (Lovable can do the visual rewrite once the hook interface is fixed).
7. **Verify in Stripe test mode** end-to-end → switch to `sk_live_*` only at go-live. Confirm `STRIPE_WEBHOOK_SECRET` is set; if `STRIPE_SECRET_KEY` is rejected, prompt update via the Stripe key tool.

Exit: signed-in user can subscribe → webhook upserts subscription + flips `user_tiers` → Manage opens portal.

---

## Phase 4 — Translations & polish

1. Extend `scripts/validate-translations.js` to check key coverage across all `locales/*.json`
2. Wire `useTranslation` into priority components (Insights / Dashboard / Settings / Subscription UI)
3. Backfill missing keys in `locales/en.json` first, mirror to other locales
4. CI: `i18n.yml` workflow green

Exit: priority flows fully translated; i18n CI green.

---

## Out of scope (handled separately)

- `api.lanonasis.com/api/v1/ai-chat` Lambda syntax error (§4.2 of the AI plan) — separate task, doesn't block VortexCore
- Postgres version upgrade (Supabase dashboard)
- Git revert/branch sync (you handle locally — I cannot run git)
- `services/auth-service/*` microservice (not part of main app build)

---

## Sequence & parallelism

```text
Phase 1 (build green)
   │
   ├─► Phase 2 (AI chat) ──────┐
   │                            ├─► Phase 4 (i18n)
   └─► Phase 3 (Stripe DB+fns) ─┘
```

Phase 3 DB work (migration + types regen) can start in parallel with Phase 2 — they don't touch the same files. Phase 4 starts once UI surfaces from Phase 3 land so we translate real strings, not placeholders.

---

After approval I'll start with Phase 1 and report back as soon as the build is green before moving to Phase 2.
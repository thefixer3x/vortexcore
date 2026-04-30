# VortexCore - Context Overview

> **Source of truth** for AI collaboration. When working on VortexCore, read this first.

## Quick Navigation

| Task | Reference |
|------|-----------|
| AI integration patterns | `architecture/decisions/adr-001-ai-router.md` |
| Stripe billing/subscription flow | `architecture/decisions/adr-002-stripe-billing.md` |
| Supabase Edge Function conventions | `architecture/decisions/adr-003-edge-functions.md` |
| OBF/Providus integration | `architecture/decisions/adr-004-obf-integration.md` |
| Dashboard page | `components/dashboard-page.md` |
| OBF components | `components/obf-components.md` |
| AI chat components | `components/ai-chat-components.md` |
| Auth components | `components/auth-components.md` |
| Custom hooks | `components/custom-hooks.md` |
| Database schema | `database-schema.md` |
| Development workflow | `workflows/development.md` |
| Deployment workflow | `workflows/deployment.md` |
| Testing workflow | `workflows/testing.md` |
| Development setup | `CLAUDE.md` (root) |

## Project Essentials

**What it does:** Fintech platform with banking services, transaction management, AI-powered financial insights, and virtual assistants.

**Tech Stack:**
- **Frontend:** Bun + React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend:** Supabase (Edge Functions + Postgres)
- **AI:** OpenAI (primary), Gemini, Perplexity (fallback), Onasis AI Router
- **Billing:** Stripe (Subscriptions, Checkout, Webhooks)
- **Mobile:** Capacitor

**Architecture:** Client-server with microservices support. Edge Functions handle server-side logic (auth, AI routing, billing). Frontend is a React SPA.

**Current Focus:** i18n/Lingo pipeline wiring (Phase 4) + OBF Providus integration (OBF-001-V)

## Key Patterns

### AI Router Pattern
`supabase/functions/ai-router/index.ts` — Single entry point for all AI providers:
- OpenAI GPT-4o-mini as primary
- Perplexity for real-time data fallback
- Brand voice enforcement via `VORTEX_SYSTEM_PROMPT`
- PII stripping before forwarding to external APIs

### Stripe Subscription Pattern
Three-tier system: `free` → `pro` → `enterprise`
- Webhook-driven: `stripe-webhook` updates `stripe_subscriptions` + `user_tiers` tables
- Edge function: `check-subscription` returns current tier for authenticated user
- Price IDs via environment: `STRIPE_PRO_PRICE_ID`, `STRIPE_ENT_PRICE_ID`

### Edge Function Middleware
`supabase/functions/_shared/middleware.ts` — Standard pattern for all edge functions:
- `withPublicMiddleware` — no auth required
- `withAuthMiddleware` — requires Bearer token, optional role checks
- Security headers injected automatically
- CORS resolved dynamically from `ALLOWED_ORIGINS` env

### OBF Integration Pattern
Providus bank integration via `onasis-gateway`:
- Feature flag `VITE_OBF_LIVE` gates all network calls (no fetch when false)
- Edge function `obf-accounts` proxies gateway API
- Credentials in Supabase Vault only (never exposed to browser)
- Schema validation via zod; 502 on violation

## Supabase Schema

**Key Tables:**
- `vortex_wallets` — user wallets with balance/currency
- `vortex_transactions` — transaction history with metadata
- `stripe_customers` → `stripe_subscriptions` → `user_tiers` — billing chain
- `agent_banks_sessions` / `agent_banks_memories` — AI memory system

**Amount normalization:** `vortex_transactions.amount` can be number|string — normalize on read.

Full schema: `database-schema.md`

## Environment Variables

### Required for Edge Functions (Supabase Vault)
- `OPENAI_API_KEY`
- `PERPLEXITY_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRO_PRICE_ID`
- `STRIPE_ENT_PRICE_ID`
- `ONASIS_GATEWAY_URL`
- `ONASIS_GATEWAY_TOKEN`
- `ALLOWED_ORIGINS`

### Required for Frontend (.env)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_OBF_LIVE` (boolean, default false)

## Directory Structure

```
├── src/
│   ├── components/       # React components (ai/, auth/, dashboard/, obf/, ui/)
│   ├── contexts/         # React contexts (Auth, Currency)
│   ├── hooks/            # Custom hooks (use-dashboard-data, use-obf-accounts, etc.)
│   ├── integrations/     # Supabase client + types (types auto-generated)
│   ├── pages/            # Route pages (Dashboard, Transactions, Settings, etc.)
│   ├── services/         # Business logic (obf/accounts, stripe/, chatSessionService)
│   └── lib/              # Utilities
├── supabase/
│   └── functions/        # Edge functions
│       ├── _shared/      # Shared middleware
│       ├── ai-router/    # AI provider routing
│       ├── stripe-webhook/  # Stripe event handler
│       ├── check-subscription/  # Subscription status
│       └── obf-accounts/  # Providus integration
└── docs/
    ├── context/          # This context system
    ├── superpowers/specs/  # Design specs
    └── architecture/     # ADRs
```

## Coding Standards

- Use **Bun** for all scripts and dev: `bun dev`, `bun test`, `bun build`
- Edge functions run on **Deno** runtime
- Prefer `Bun.serve()` over express/other servers
- Use `bun:sqlite` for SQLite, `Bun.sql` for Postgres via Supabase
- WebSocket built-in via `Bun.serve({ websocket: ... })`
- React components: functional with hooks, TypeScript strict mode
- Test with `bun test`

## AI Collaboration Notes

- Feature flag pattern: React layer controls whether to call edge functions
- Edge functions never expose raw upstream responses; they normalize/error-wrap
- PII stripping happens server-side before any external API call
- All AI responses processed through `formatResponse()` for brand voice consistency
- Use `normalizedAmount()` for transaction amounts (handle string|number)
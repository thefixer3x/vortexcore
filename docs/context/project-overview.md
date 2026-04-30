# VortexCore - Context Overview

> **Source of truth** for AI collaboration. When working on VortexCore, read this first.

## Quick Navigation

| Task | Reference |
|------|-----------|
| AI integration patterns | `architecture/decisions/adr-001-ai-router.md` |
| Stripe billing/subscription flow | `architecture/decisions/adr-002-stripe-billing.md` |
| Supabase Edge Function conventions | `architecture/decisions/adr-003-edge-functions.md` |
| OBF/Providus integration | `architecture/decisions/adr-004-obf-integration.md` |
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
Database types auto-generated in `src/integrations/supabase/types.ts` (Database type).
Key tables: `stripe_subscriptions`, `stripe_customers`, `user_tiers`, `agent_banks_*`

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

### Required for Frontend (.env)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_OBF_LIVE` (boolean, default false)
- `VITE_OPENAI_API_KEY` (only if not using edge function)

## Directory Structure

```
├── src/
│   ├── components/       # React components
│   ├── contexts/         # React contexts
│   ├── hooks/            # Custom React hooks
│   ├── integrations/     # Supabase client + types
│   ├── layouts/          # Page layouts
│   ├── pages/            # Route pages
│   ├── services/         # Business logic (obf/, stripe/)
│   ├── providers/        # Context providers
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

## AI Collaboration Notes

- Feature flag pattern: React layer controls whether to call edge functions
- Edge functions never expose raw upstream responses; they normalize/error-wrap
- PII stripping happens server-side before any external API call
- All AI responses processed through `formatResponse()` for brand voice consistency
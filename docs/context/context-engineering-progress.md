# Context Engineering Progress

**Last updated:** 2026-04-30

## Workflow for New Chat Sessions

When continuing this work, start with:
> "Continue context engineering - read context-engineering-progress.md for project settings and current status"

## Project Configuration

- **Location:** `docs/context/`
- **Format:** ADRs following `2026-04-26-obf-001-v-design.md` pattern
- **Source of truth:** This system is the new source of truth for AI collaboration

## Documentation Guidelines

### File Structure
```
docs/context/
├── project-overview.md           # Master navigation (start here)
├── context-engineering-progress.md  # This file
├── database-schema.md              # Database summary
├── architecture/decisions/        # ADRs
│   ├── adr-001-ai-router.md
│   ├── adr-002-stripe-billing.md
│   ├── adr-003-edge-functions.md
│   └── adr-004-obf-integration.md
├── components/                    # Component documentation
│   ├── dashboard-page.md
│   ├── obf-components.md
│   ├── ai-chat-components.md
│   ├── auth-components.md
│   └── custom-hooks.md
└── workflows/                     # Process documentation
    ├── development.md
    ├── deployment.md
    └── testing.md
```

### Naming Conventions
- ADRs: `adr-XXX-title.md`
- Component contexts: `component-name.md`
- Workflows: `workflow-name.md`

## Completed Phases

### Phase 1: Discovery & Core Documentation ✓
**Created:**
- `project-overview.md` — Master navigation with tech stack, patterns, coding standards
- 4 ADRs documenting key architectural decisions
- `context-engineering-progress.md` — Workflow state for new sessions

### Phase 2: Extended Context ✓
**Created:**
- Component documentation: dashboard, OBF, AI chat, auth, custom hooks
- Database schema summary with key tables and relationships
- Workflow documentation: development, deployment, testing

## Current Status

**Phase 1 + Phase 2 complete.** Context system includes:

**Architecture Decisions (4):**
- AI Router (OpenAI → Perplexity fallback, PII stripping, brand voice)
- Stripe Billing (webhook-driven, tier tables, pro/enterprise/freemium)
- Edge Function Conventions (shared middleware, security headers, auth)
- OBF Providus Integration (feature flag gating, no data model merge)

**Component Documentation (5):**
- Dashboard page + hooks
- OBF components (AccountPanel, AccountCard, TransactionList)
- AI chat components (VortexAIChat, EnhancedVortexAIChat, providers)
- Auth components (LoginForm, biometric, 2FA, OAuth)
- Custom hooks (useDashboardData, useOBFAccounts, useAnalytics, etc.)

**Database Schema:**
- vortex_wallets, vortex_transactions (financial core)
- stripe_customers → stripe_subscriptions → user_tiers (billing)
- agent_banks_* (AI memory system)
- Amount normalization pattern

**Workflows (3):**
- Development: Bun setup, Supabase local, git workflow
- Deployment: Netlify/Vercel, Supabase functions, secrets management
- Testing: Bun test framework, smoke scripts, Playwright E2E

## Next Steps

### Phase 3: Integration & Maintenance (optional)
- Set up ADR template for new architectural decisions
- Document i18n/Lingo pipeline
- Add more component documentation as patterns emerge
- Create maintenance checklist for keeping context current

## Key Discovery Notes

1. **Bun is primary runtime** — not Node.js (CLAUDE.md specifies this)
2. **Edge functions run on Deno** — different runtime from frontend
3. **Shared middleware pattern** — all edge functions use `_shared/middleware.ts`
4. **Feature flag pattern** — React layer controls whether to call edge functions
5. **OBF integration is isolated** — internal wallets and Providus accounts are separate
6. **Amount normalization needed** — `vortex_transactions.amount` can be number|string

## File Locations

All context files: `/Users/vortexcore/projects/vortexcore/docs/context/`
Design specs (existing): `/Users/vortexcore/projects/vortexcore/docs/superpowers/specs/`

## Commit History Reference

Recent commits showing architectural evolution:
- `ea5df50` Fix: decode JSON-wrapped src/integrations/supabase/types.ts
- `bc09c3b` Phase 4: i18n wiring + Lingo pipeline + reusable template
- `4bae456` Phase 3: Stripe subscription billing — edge functions + frontend context
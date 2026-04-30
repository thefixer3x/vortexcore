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

### ADR Format
- Filename: `adr-XXX-title.md`
- Sections: Context, Decision, Alternatives Considered, Consequences
- Include file paths for reference

### Project Overview
- Master navigation file: `docs/context/project-overview.md`
- Tech stack, key patterns, directory structure, coding standards
- Quick reference tables for task → doc mapping

### Naming Conventions
- ADRs: `adr-001-title.md`, `adr-002-title.md`, etc.
- Component contexts: `component-name-context.md`
- Workflows: `workflow-name.md`

## Completed Phases

### Phase 1: Discovery & Core Documentation ✓

**Completed:**
- Project structure analysis (src/, supabase/functions/, docs/)
- Key architectural decisions identified:
  1. AI Router pattern (ai-router/index.ts)
  2. Stripe subscription system (stripe-webhook, check-subscription)
  3. Edge function middleware conventions
  4. OBF Providus integration

**Created files:**
```
docs/context/
├── project-overview.md           # Master navigation + AI collaboration guide
├── context-engineering-progress.md  # This file
└── architecture/decisions/
    ├── adr-001-ai-router.md     # AI provider routing
    ├── adr-002-stripe-billing.md  # Subscription tiers
    ├── adr-003-edge-functions.md  # Middleware conventions
    └── adr-004-obf-integration.md  # Providus integration
```

## Current Status

**Phase 1 complete.** Core ADRs document the four major architectural decisions:
1. AI Router (OpenAI → Perplexity fallback, PII stripping, brand voice)
2. Stripe Billing (webhook-driven, tier tables, pro/enterprise/freemium)
3. Edge Function Conventions (shared middleware, security headers, auth)
4. OBF Providus Integration (feature flag gating, no data model merge, credential isolation)

## Next Steps

### Phase 2: Component Context (optional)
- Document key React components if requested
- Document database schema in more detail
- Add workflow documentation (deployment, testing)

### Phase 3: Integration & Maintenance (optional)
- Set up automated context updates on architectural changes
- Create template for new ADRs
- Document i18n/Lingo pipeline

## Key Discovery Notes

1. **Bun is primary runtime** — not Node.js (CLAUDE.md specifies this)
2. **Edge functions run on Deno** — different runtime from frontend
3. **Shared middleware pattern** — all edge functions use `_shared/middleware.ts`
4. **Feature flag pattern** — React layer controls whether to call edge functions
5. **OBF integration is isolated** — internal wallets and Providus accounts are separate

## File Locations

All context files: `/Users/vortexcore/projects/vortexcore/docs/context/`
Design specs (existing): `/Users/vortexcore/projects/vortexcore/docs/superpowers/specs/`

## Commit History Reference

Recent commits showing architectural evolution:
- `ea5df50` Fix: decode JSON-wrapped src/integrations/supabase/types.ts
- `bc09c3b` Phase 4: i18n wiring + Lingo pipeline + reusable template
- `4bae456` Phase 3: Stripe subscription billing — edge functions + frontend context
- `9ab64ca` Add app_vortexcore schema, public facades, and regenerate types
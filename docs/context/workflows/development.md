# Development Workflow

## Prerequisites

- **Runtime:** Bun (not Node.js)
- **Package manager:** bun (not npm/yarn/pnpm)
- **Edge functions:** Deno runtime (via Supabase CLI)

## Local Setup

### 1. Install dependencies
```bash
bun install
```

### 2. Environment variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Required frontend vars:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_OBF_LIVE` (boolean, default false)

### 3. Start development server
```bash
bun --hot ./index.ts
```
- Frontend: `http://localhost:3000`
- HMR enabled for React components
- API routes via Bun.serve

### 4. Supabase local development
```bash
supabase start        # Start local Postgres + Edge Functions
supabase db push      # Push schema changes
supabase functions serve  # Watch edge functions
```

## Frontend Development

### File Structure
```
src/
├── components/     # React components (grouped by feature)
├── pages/          # Route pages
├── hooks/          # Custom hooks
├── contexts/       # React contexts
├── services/       # Business logic
└── integrations/   # Supabase client
```

### Component Pattern
- Functional components with TypeScript
- Use existing component patterns (see `docs/context/components/`)
- Test via `bun test`

### State Management
- React Query for server state
- Context for UI state (Currency, Auth)
- Local state for component-level

## Edge Function Development

### Location
```
supabase/functions/
├── _shared/           # Shared middleware (don't modify)
├── ai-router/         # AI provider routing
├── stripe-webhook/     # Stripe event handling
├── check-subscription/  # Subscription status
└── obf-accounts/       # Providus integration
```

### Middleware Pattern
```typescript
serve(withAuthMiddleware(async (req, { auth, admin }) => {
  // auth.userId available
  // admin = service role client
  return new Response(JSON.stringify({ ... }), {
    headers: { "Content-Type": "application/json" }
  });
}));
```

### Testing Edge Functions
```bash
# Local emulation
supabase functions serve

# Invoke manually
curl -X POST http://localhost:54321/functions/v1/ai-router \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ANON_KEY" \
  -d '{"messages": [{"role": "user", "content": "hello"}]}'
```

## Adding New Features

1. Create design doc in `docs/superpowers/specs/`
2. Document decision in `docs/context/architecture/decisions/`
3. Implement with TDD (see `bun test`)
4. Update component context if new patterns emerge

## Git Workflow

**Branch strategy:** rebase, not merge commits
```bash
git checkout -b feature/my-feature
git rebase main
```

**Commit conventions:**
- `feat:`, `fix:`, `docs:`, `chore:` prefixes
- Reference issue numbers in body
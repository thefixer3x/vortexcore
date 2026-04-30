# ADR-003: Supabase Edge Function Conventions

**Date:** 2026-04-26
**Status:** Accepted

## Context

Multiple edge functions needed consistent patterns for auth, CORS, error handling, and security headers.

## Decision

Shared middleware in `_shared/middleware.ts` with two exported helpers:

```typescript
// Public endpoint — no auth
withPublicMiddleware(handler)

// Auth required — optional role checking
withAuthMiddleware(handler, ["GET", "POST"], ["admin"])
```

### Standard Edge Function Pattern

```typescript
serve(withAuthMiddleware(async (req, { auth, admin }) => {
  // auth.userId available
  // admin supabase client available (service role)
  return new Response(JSON.stringify({ ... }), {
    headers: { "Content-Type": "application/json" }
  });
}));
```

### Security Features (automatic)
- Security headers: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `X-XSS-Protection`
- Dynamic CORS based on `ALLOWED_ORIGINS` env var
- OPTIONS preflight handled automatically
- 401/403 responses for auth/role failures

### Error Handling
- All unhandled errors return `{ error: "Internal server error" }` with 500
- Original error logged to console (not returned to client)

## Consequences

**Positive:**
- Every edge function gets security headers automatically
- Auth logic centralized — no repeated Bearer token parsing
- Consistent error format across all functions

**Negative:**
- Middleware creates slight latency overhead (minimal)
- All functions must use this pattern (enforced via code review)
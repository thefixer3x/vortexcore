# VortexCore AI Surface — Consolidated Assessment & Plan

**Date:** 2026-09-11 (updated 2026-09-12)
**Scope:** AI chat surfaces, edge functions, auth, data safety
**Source:** Deep code review + live deployment probes against `mxtsdgkwzjzlttpotole`

---

## Executive Summary

VortexCore runs **three AI surfaces** hitting **three different backends** with different security postures. Neither the repo's `ai-router` nor the deployed v57 Lovable shim is safe to deploy as-is. The repo has PII stripping and input validation that v57 lacks, but its `isFallback()` trigger is self-cancelling (the system prompt forbids the exact phrase the regex detects), `formatResponse()` strips citation URLs the client depends on, and it unconditionally appends hardcoded investment advice. The fabricated citations problem lives in both versions — it's the system prompt, not the model provider. The highest-value fix is prompt-level and costs nothing.

---

## The Three Surfaces — Verified

| Surface | Frontend | Edge Function | `verify_jwt` | Auth middleware | State |
|---------|----------|---------------|--------------|-----------------|-------|
| `/ecosystem/perplexity` page | `PerplexityAIChat.tsx` | `ai-router` | `false` | `withPublicMiddleware` | Broken (see Known Issues) |
| Landing-page chat bubble | `OpenAIChat.tsx` (ALL pages) | `openai-chat` | `true` | `withAuthMiddleware` | Secure ✅ |
| `/ecosystem/gemini` page | `GeminiDemo.tsx` | `gemini-ai` | N/A | `withPublicMiddleware` | Unknown (may be dead code) |

**Additional callers of `ai-router`:**
- `src/hooks/useVortexChat.ts:74` — generic chat hook
- `src/hooks/useVortexChatPersistent.ts:206` — persistent session hook

Both call `ai-router` with anonymous access.

---

## The Two Versions — Honest Assessment

### `ai-router` in the repo (238 lines)

| Property | Value | Notes |
|----------|-------|-------|
| Primary provider | OpenAI `gpt-4o-mini` | Hardcoded at line 48 |
| Fallback | Perplexity `sonar-8k-online` | Hardcoded at `providers/perplexity.ts:33` |
| Auth | `withPublicMiddleware` | No JWT — anonymous access |
| Rate limiting | None | Anyone can drain API budgets |
| PII stripping | Yes (regex) | SSN, card, 10-16 digit patterns. Missing: BVN/NIN, emails, phone |
| Input validation | Yes | Role allowlist, content type check |
| Cold-fail | Yes | `throw new Error('Missing OPENAI_API_KEY')` |
| Citation handling | **Destroys them** | `formatResponse()` strips URLs from markdown citations |
| Advice safety | **Unsafe** | Appends hardcoded investment advice to responses |
| Model selector | Dead | UI offers 4 models, none threaded through |
| Perplexity key | Dead | `401 Invalid API key provided` |

### `ai-router` deployed (v57, 2026-08-03)

| Property | Value | Notes |
|----------|-------|-------|
| Provider | `ai.gateway.lovable.dev` → `gemini-2.5-pro` | Lovable gateway |
| Perplexity code | **Not deployed** | `providers/perplexity.ts` exists in repo but was dropped in Lovable rewrite |
| System prompt | Has fabrication directives | Same two lines as repo: "cite like [MSCI], [Reuters]" + "Never say I don't have real-time data" |
| Auth | `verify_jwt = false` | Anonymous access |
| Rate limiting | None | Same gap as repo |
| PII stripping | **None** | User messages sent raw to LLM |
| Model selector | Dead | Frontend sends `model: "sonar-8k-online"` but it is ignored |

### `openai-chat` (the support bubble) — The Only Secure Surface

| Property | Value |
|----------|-------|
| Auth | `verify_jwt = true`, `withAuthMiddleware` — returns 401 without JWT |
| Data | Queries `vortex_wallets`, `vortex_transactions`, `vortex_settings` via caller-scoped Supabase client with RLS |
| Provider | Lovable gateway → `gemini-2.5-flash` (if `LOVABLE_API_KEY`), else OpenAI `gpt-4o-mini` |
| System prompt | Explicitly forbids inventing balances, transactions, trends, or product features |
| Verified | No auth → 401; anon key as Bearer → 401 |

---

## Known Issues (Ranked by Severity)

### 🔴 BLOCKER 1: Cost DoS on `ai-router`
- `verify_jwt = false` in `supabase/config.toml`, `withPublicMiddleware` in code
- Anyone on the internet can drain OpenAI budgets through your Lovable account
- Already flagged in `AUDIT_2026-08-14.md` #4.2.1 and #4.2.2 as **Critical**
- Affects both repo and deployed versions

### 🔴 BLOCKER 2: Fabricated Citations — Repo-Native, Not a Lovable Invention
- The `VORTEX_SYSTEM_PROMPT` in the repo contains two directives:
  1. `"cite data sources inline when they are external (e.g. [MSCI], [Reuters])"`
  2. `"Forbidden: 'I don't have real-time data…'"`
- **These are in the repo, not a Lovable deviation.** Both repo and deployed v57 have them.
- Deploying the repo version would NOT fix fabricated citations.

### 🔴 BLOCKER 3: Perplexity Fallback Is Architecturally Unreachable
- `isFallback()` regex matches `"I don't have real-time data"` — the exact phrase the system prompt **forbids** the model from emitting
- The fallback only fires when the model disobeys its own prompt
- The regex is not just "too narrow" — it is **self-cancelling**
- Additionally, Perplexity API key returns `401` — the fallback path never works even if the trigger fired

### 🟡 HIGH 4: `formatResponse()` Destroys Citation Provenance
- `processed.replace(/\[(.*?)\]\((.*?)\)/g, '[$1]')` strips URLs from markdown citations
- The client (`PerplexityAIChat.tsx:112`) extracts citations **only** from markdown links
- The router deletes precisely what the client depends on — citation chips can never populate
- Invented `[Reuters]` tokens become indistinguishable from real sources

### 🟡 HIGH 5: Hardcoded Investment Advice Appended to Every Response
- If response doesn't contain "recommend" or "suggestion", appends:
  `"I recommend monitoring these trends closely for investment opportunities."`
- Unconditional string concatenation — financial advice with no basis in user data or question
- This is a compliance risk in a fintech product

### 🟡 HIGH 6: Perplexity SSE vs Client JSON Mismatch
- Perplexity path returns `text/event-stream`
- Client reads `data?.response` — a JSON field
- Result: silent blank — nothing rendered when Perplexity actually works

### 🟡 HIGH 7: CORS + Credentials Reflection
- `middleware.ts:26-33`: when `ALLOWED_ORIGINS` is empty, reflects any Origin back with `Access-Control-Allow-Credentials: true`
- Combined with Supabase cookie-based auth, any malicious site a logged-in user visits can make credentialed requests
- Affects `ai-router`, `stripe`, and any function using shared middleware

### 🟡 MEDIUM 8: PII Stripping is Regex-Only
- Strips long-digit patterns, CC numbers, SSNs
- Missing: BVN/NIN (Nigeria-specific), emails, phone numbers, addresses
- Users paste account numbers, BVNs into AI chat — these pass through to LLMs

### 🟡 MEDIUM 9: Perplexity Stream Cache Memory Leak
- `perplexity.ts:68-91`: stores raw `ReadableStream` objects in memory
- `tee()` called on already-splitted streams; cached copy is never consumed
- Streams evicted only by TTL — unbounded memory growth

### 🟢 LOW 10: Dead Model Selector in UI
- Dropdown offers 4 models, but `ai-router` hardcodes `gpt-4o-mini` and `perplexity.ts` hardcodes `sonar-8k-online`
- `model` field from request body is never read

### 🟢 LOW 11: `openai-chat` Auth Header Parsing Bug
- `openai-chat/index.ts:113`: `auth.split('Bearer ')` leaves `***` if header format is unexpected
- Parsing bug — should use `.replace('Bearer ', '')` or `split('Bearer ')[1]`

---

## Quick Recommendation

**Neither version is deployable as-is.** "Deploy the repo version" would fix input hygiene (PII stripping, validation) but regress on citation integrity (`formatResponse` strips provenance) and advice safety (hardcoded investment append).

The highest-value fix is **prompt-level and costs nothing**:
1. Drop the two lines from `VORTEX_SYSTEM_PROMPT`: "cite data sources inline like [MSCI], [Reuters]" and "Forbidden: I don't have real-time data"
2. That kills fabrication on the live shim today without any code deploy
3. Then decide whether to keep v57 (simpler, no Perplexity) or deploy a fixed repo version

Auth and rate limiting (`verify_jwt = true`, per-IP rate limit) are missing from both and should be added wherever this lands.

---

## Trackable Plan

### Phase 1: Prompt hygiene — zero code deploy (30 min) — **DO THIS FIRST**

| # | Task | Where |
|---|------|-------|
| 1.1 | Remove "cite data sources inline like [MSCI], [Reuters]" from system prompt | Supabase dashboard → Functions → ai-router → env/prompt |
| 1.2 | Remove "Forbidden: I don't have real-time data" from system prompt | Same |
| 1.3 | Add honest-fallback instruction: "If you don't know current data, say so plainly" | Same |

**This alone stops fabricated citations on the live deployment.** No code deploy needed.

### Phase 2: Kill the bleeding — auth and rate limits (1–2 hours)

| # | Task | Files |
|---|------|-------|
| 2.1 | Set `ALLOWED_ORIGINS` to explicit list (`https://me.vortexcore.app`) | Function env / `supabase/config.toml` |
| 2.2 | Set `verify_jwt = true` on `ai-router` | `supabase/config.toml` |
| 2.3 | Add per-IP rate limiting to `ai-router` | `middleware.ts` + new rate-limit util |
| 2.4 | Fix `openai-chat` Authorization header parsing | `openai-chat/index.ts:113` |

### Phase 3: If deploying the repo version (half-day)

| # | Task | Files |
|---|------|-------|
| 3.1 | **Delete `formatResponse()` entirely** — let model produce clean markdown | `ai-router/index.ts` |
| 3.2 | Remove the hardcoded investment advice append | `ai-router/index.ts` |
| 3.3 | Change Perplexity fallback to return JSON matching the client | `providers/perplexity.ts` |
| 3.4 | Escalate on `wantRealtime === true` directly instead of `isFallback()` | `ai-router/index.ts` |
| 3.5 | Thread `body.model` through to providers OR remove dead dropdown | `ai-router/index.ts` + `PerplexityAIChat.tsx` |

### Phase 4: Data safety (half-day)

| # | Task | Files |
|---|------|-------|
| 4.1 | Add email/BVN/NIN/phone regex patterns to `stripPII()` | `ai-router/index.ts` |
| 4.2 | Fix Perplexity cache to store assembled text (not raw streams) | `providers/perplexity.ts` |

---

## Tracking Against AUDIT_2026-08-14.md

| Audit Item | This Plan | Status |
|------------|-----------|--------|
| 4.2.1 `verify_jwt = false` for AI functions | BLOCKER 1 | **PENDING** |
| 4.2.2 `ai-router` no rate limiting | BLOCKER 1 | **PENDING** |
| 4.3.3 Wildcard CORS on functions | HIGH 7 | **PENDING** |
| 4.4.2 PII sent to LLMs without redaction | MEDIUM 8 | **PENDING** |

---

## Quick Decisions Needed

1. **Keep v57 shim or deploy a fixed repo version?**
   - v57: simpler, no Perplexity, no `formatResponse()` bug, no hardcoded advice append — but no PII stripping, no input validation
   - Repo: has PII stripping and validation, but has `formatResponse()`, hardcoded advice, self-cancelling fallback
   - **Recommendation:** Fix prompt + add auth to v57 for now. Fix repo version later if Perplexity is needed.

2. **Perplexity API key**: renew or deprecate?

3. **`useVortexChat` hooks**: still used beyond PerplexityDemo?

---

## Key Files Reference

- **Edge Functions:** `supabase/functions/ai-router/`, `supabase/functions/openai-chat/`, `supabase/functions/gemini-ai/`, `supabase/functions/_shared/middleware.ts`
- **Frontend:** `src/pages/PerplexityDemo.tsx`, `src/components/ai/PerplexityAIChat.tsx`, `src/components/ai/OpenAIChat.tsx`, `src/App.tsx`
- **Hooks:** `src/hooks/useVortexChat.ts`, `src/hooks/useVortexChatPersistent.ts`
- **Config:** `supabase/config.toml`, `netlify.toml`, `vercel.json`
- **Audit:** `docs/reports/AUDIT_2026-08-14.md`

# VortexCore AI Surface — Consolidated Assessment & Plan

**Date:** 2026-09-11
**Scope:** AI chat surfaces, edge functions, auth, data safety
**Source:** Deep code review + live deployment probes against `mxtsdgkwzjzlttpotole`

---

## Executive Summary

VortexCore runs **three AI surfaces** that hit **three different backends** with wildly different security postures. The repo\'s `ai-router` source code does NOT match what is deployed (v57 is a Lovable rewrite). The support bubble (`openai-chat`) is the only well-secured surface. Two blockers demand immediate attention: anonymous AI access drains LLM budgets, and the deployed `ai-router` system prompt instructs the model to fabricate citations.

---

## The Three Surfaces — Verified

| Surface | Frontend | Edge Function | `verify_jwt` | Auth middleware | Deployed reality |
|---------|----------|---------------|--------------|-----------------|------------------|
| `/ecosystem/perplexity` page | `PerplexityAIChat.tsx` | `ai-router` | `false` | `withPublicMiddleware` | Repo code ≠ deployed v57 (Lovable shim) |
| Landing-page chat bubble | `OpenAIChat.tsx` (rendered on ALL pages) | `openai-chat` | `true` | `withAuthMiddleware` | Repo matches deployed — correct |
| `/ecosystem/gemini` page | `GeminiDemo.tsx` | `gemini-ai` | N/A | `withPublicMiddleware` | Direct Gemini calls, no financial context |

**Additional callers of `ai-router`:**
- `src/hooks/useVortexChat.ts:74` — generic chat hook
- `src/hooks/useVortexChatPersistent.ts:206` — persistent session hook

Both call `ai-router` and are subject to the same anonymous access issue.

---

## Repo vs Deployed — The Core Discrepancy

### `ai-router` in the repo (238 lines)
- **Primary provider:** OpenAI `gpt-4o-mini` (hardcoded line 48)
- **Fallback:** Perplexity `sonar-8k-online` (hardcoded in `providers/perplexity.ts:33`)
- **Auth:** `withPublicMiddleware` — no JWT required
- **PII strip:** regex-only (SSN, card, 10-16 digit numbers)
- **Model selector:** UI offers 4 models, but none are threaded through to the router
- **Rate limiting:** none
- **CORS:** `Access-Control-Allow-Origin: *` (line 185)

### `ai-router` deployed (v57, 2026-08-03)
- **Provider:** `ai.gateway.lovable.dev` → Google `gemini-2.5-pro`
- **Perplexity code:** `providers/perplexity.ts` exists in repo but was **dropped in the Lovable rewrite**
- **System prompt contains two toxic directives:**
  1. `"Cite external data sources inline like [MSCI], [Reuters] when relevant"` — tells model to fabricate citation-shaped tokens
  2. `"Never say I don\'t have real-time data"` — forbids the only honest answer
- **Model field:** frontend sends `model: "sonar-8k-online"` but the deployed function ignores it entirely

**Result:** The Nigeria trends reply with `[Reuters]` and `[BusinessDay]` citations was **fabricated**, not retrieved.

### `openai-chat` (the support bubble) — The Good One
- **Auth:** `verify_jwt = true`, uses `withAuthMiddleware` — returns 401 without JWT
- **Data:** Queries `vortex_wallets`, `vortex_transactions`, `vortex_settings` via caller-scoped Supabase client with RLS enforcement
- **Provider:** Lovable gateway → `gemini-2.5-flash` (if `LOVABLE_API_KEY`), else OpenAI `gpt-4o-mini`
- **System prompt:** Explicitly forbids inventing balances, transactions, trends, or product features
- **Verified:** No auth → 401; anon key as Bearer → 401

### `gemini-ai` (unused?)
- **Auth:** `withPublicMiddleware` — anonymous access
- **No financial context** — direct Gemini calls
- **Frontend:** `GeminiDemo.tsx` at `/ecosystem/gemini`
- **Assessment:** May be dead code; confirm if any user-facing path routes here

---

## Verified Issues (Ranked by Severity)

### 🔴 BLOCKER 1: Cost DoS on `ai-router`
- `verify_jwt = false` in `supabase/config.toml`, `withPublicMiddleware` in code
- Anyone on the internet can drain OpenAI + Perplexity budgets
- Already flagged in `AUDIT_2026-08-14.md` #4.2.1 and #4.2.2 as **Critical**
- **Status:** PENDING

### 🔴 BLOCKER 2: Fabricated Citations in Deployed `ai-router`
- Two system prompt directives tell the model to: (a) fabricate citation tokens like `[Reuters]`, (b) never admit knowledge cutoff
- This is **financial misinformation** on a consumer-facing interface
- **Status:** PENDING (can be fixed via deployed function env — no code deploy needed)

### 🔴 BLOCKER 3: Perplexity API Key is Dead
- Live probe confirmed: `401 Invalid API key provided` on `api.perplexity.ai/chat/completions`
- The fallback path never works in practice
- `PERPLEXITY_API_KEY` either expired or was revoked
- **Status:** PENDING

### 🟡 HIGH 4: Dead Model Selector in PerplexityAIChat
- Frontend dropdown offers 4 models (sonar-8k-online, sonar-small-online, mixtral-8x7b-instruct, claude-3-sonnet-20240229)
- `ai-router/index.ts:48` hardcodes `gpt-4o-mini`; `perplexity.ts:33` hardcodes `sonar-8k-online`
- `model` field from request body is never read — every request hits the same two models
- "VortexAI Advanced / Analyst / Express" options are a UI lie
- **Status:** PENDING

### 🟡 HIGH 5: CORS + Credentials Reflection
- `middleware.ts:26-33`: when `ALLOWED_ORIGINS` is empty, reflects any Origin back with `Access-Control-Allow-Credentials: true`
- Combined with Supabase cookie-based auth, any malicious site a logged-in user visits can make credentialed cross-origin requests
- Affects `ai-router`, `stripe`, and any function using shared middleware
- **Status:** PENDING

### 🟡 MEDIUM 6: Perplexity Stream Cache Memory Leak
- `perplexity.ts:68-91`: `responseCache` stores raw `ReadableStream` objects
- `tee()` called on already-splitted streams; cached copy is never consumed
- Streams evicted only by TTL — unbounded memory growth over time
- **Status:** PENDING

### 🟡 MEDIUM 7: PII Stripping is Regex-Only
- `ai-router/index.ts:86-96`: strips long-digit patterns, CC numbers, SSNs
- Names, emails, BVN/NIN (Nigeria-specific), phone numbers, addresses all pass through to LLMs
- **Status:** PENDING (AUDIT_2026-08-14.md #4.4.2 — High)

### 🟢 LOW 8: `isFallback()` Regex Too Narrow
- Only matches `"I don\'t have real-time data"`
- Common refusals like "my knowledge cuts off in October 2023" bypass Perplexity fallback entirely
- **Status:** PENDING

### 🟢 LOW 9: `formatResponse()` Incomplete Sanitization
- Only replaces "the assistant" and "vortexai" → "I"
- Other system-prompt leaks in model output pass through untouched
- **Status:** PENDING

### 🟢 LOW 10: `openai-chat` Auth Header Bug
- `openai-chat/index.ts:113`: `auth.split(\'Bearer \'` leaves `***` if header format is unexpected
- Parsing bug — should handle edge cases
- **Status:** PENDING

---

## Tracking Against AUDIT_2026-08-14.md

| Audit Item | This Plan | Current Status |
|------------|-----------|----------------|
| 4.2.1 `verify_jwt = false` for AI functions | BLOCKER 1 | **PENDING** |
| 4.2.2 `ai-router` no rate limiting | BLOCKER 1 | **PENDING** |
| 4.3.3 Wildcard CORS on functions | HIGH 5 | **PENDING** |
| 4.4.2 PII sent to LLMs without redaction | MEDIUM 7 | **PENDING** |

**New findings not in audit:**
- Deployed `ai-router` system prompt instructs fabrication of citations
- Repo code ≠ deployed code for `ai-router`
- Perplexity API key is dead
- Model selector is a dead UI element
- `openai-chat` auth header parsing bug
- Stream cache memory leak

---

## Trackable Plan

### Phase 1: Kill the bleeding (1–2 hours)
| # | Task | Files |
|---|------|-------|
| 1.1 | Set `ALLOWED_ORIGINS` to explicit list | `supabase/config.toml` / function env |
| 1.2 | Set `verify_jwt = true` on `ai-router` | `supabase/config.toml` |
| 1.3 | Add per-IP rate limiting to `ai-router` | `middleware.ts` + new rate-limit util |
| 1.4 | Fix `openai-chat` Authorization header parsing | `openai-chat/index.ts:113` |

### Phase 2: Prompt hygiene — zero code deploy (30 min)
| # | Task | Where |
|---|------|-------|
| 2.1 | Remove "Cite sources inline like [MSCI], [Reuters]" | Supabase dashboard |
| 2.2 | Remove "Never say I don\'t have real-time data" | Supabase dashboard |
| 2.3 | Add honest-fallback instruction | Supabase dashboard |

### Phase 3: Fix repo `ai-router` (half-day)
| # | Task | Files |
|---|------|-------|
| 3.1 | Thread `body.model` through to correct provider | `ai-router/index.ts` |
| 3.2 | Broaden `isFallback()` regex | `ai-router/index.ts` |
| 3.3 | Strip `formatResponse()` to only sanitize brand leaks | `ai-router/index.ts` |
| 3.4 | Fix Perplexity cache — assemble text, cache JSON, not streams | `providers/perplexity.ts` |

### Phase 4: Fix Perplexity model selector UI (2 hours)
| # | Task | Files |
|---|------|-------|
| 4.1 | Wire `model` through OR remove dead options | `PerplexityAIChat.tsx` + `ai-router/index.ts` |
| 4.2 | If keeping: pass `body.model` through | `PerplexityAIChat.tsx:94`, `providers/perplexity.ts:33` |
| 4.3 | If removing: collapse to 2 honest choices | `PerplexityAIChat.tsx:27-32` |

### Phase 5: PII & data safety (half-day)
| # | Task | Files |
|---|------|-------|
| 5.1 | Add email/BVN/NIN/phone regex to `stripPII()` | `ai-router/index.ts` |
| 5.2 | Or better: strip all user content beyond last message | `ai-router/index.ts` |
| 5.3 | Audit `gemini-ai` for same issues | `gemini-ai/index.ts` |

### Phase 6: Deprecation & consolidation (1 day)
| # | Task | Files |
|---|------|-------|
| 6.1 | Confirm `openai-chat` is correct path for support bubble | Code review |
| 6.2 | Decide: does `ai-router` serve any page `openai-chat` shouldn\'t? | Architecture decision |
| 6.3 | If `ai-router` only for PerplexityDemo: deprecate hooks | `useVortexChat.ts`, `useVortexChatPersistent.ts` |
| 6.4 | Clean up `gemini-ai` if no frontend routes here | `GeminiDemo.tsx` |

---

## Quick Decisions Needed

1. **Perplexity API key**: Renew or deprecate?
2. **Repo vs deployed `ai-router`**: Deploy repo version, or accept Lovable shim + fix prompt?
3. **`useVortexChat` hooks**: Still used beyond PerplexityDemo?

---

## Key Files Reference

- **Edge Functions:** `supabase/functions/ai-router/`, `supabase/functions/openai-chat/`, `supabase/functions/gemini-ai/`, `supabase/functions/_shared/middleware.ts`
- **Frontend:** `src/pages/PerplexityDemo.tsx`, `src/components/ai/PerplexityAIChat.tsx`, `src/components/ai/OpenAIChat.tsx`, `src/App.tsx`
- **Hooks:** `src/hooks/useVortexChat.ts`, `src/hooks/useVortexChatPersistent.ts`
- **Config:** `supabase/config.toml`, `netlify.toml`, `vercel.json`
- **Audit:** `docs/reports/AUDIT_2026-08-14.md`

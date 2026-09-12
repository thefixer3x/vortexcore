# ADR-001: AI Router Architecture

**Date:** 2026-04-26
**Status:** Accepted — but implementation has known defects (see Known Issues below)
**Context:** VortexCore AI integration strategy

## Problem

The app needed a unified way to provide AI-powered financial insights while:
1. Supporting multiple AI providers (OpenAI, Gemini, Perplexity)
2. Ensuring brand-consistent responses (VortexAI voice)
3. Handling real-time data requests gracefully
4. Preventing PII leakage to external APIs

## Decision

Single router edge function (`ai-router/index.ts`) handles all AI traffic with provider fallback:

```
User message → PII strip → [OpenAI GPT-4o-mini] → brand voice filter → user
                    ↓ (on fallback response + wantRealtime)
              [Perplexity real-time] → streaming → user
```

**Key design points:**
- OpenAI is primary; Perplexity is fallback for real-time data only
- `VORTEX_SYSTEM_PROMPT` enforces brand voice: concise, proactive, data-driven, no apologies
- PII stripping (SSN, card numbers, account numbers) happens before any external call
- Response formatting strips generic phrases like "according to my search"
- Token limit managed by trimming to last 5 messages

**Why this order:**
1. OpenAI is fastest and most reliable for general financial advice
2. Perplexity adds real-time data only when user explicitly requests it AND OpenAI returns a fallback response
3. This avoids burning Perplexity quota on every request

## Alternatives Considered

- **Direct Gemini integration**: Rejected because Perplexity provides better real-time financial data via search
- **All providers in parallel**: Rejected — unnecessary cost and complexity for non-real-time requests
- **Client-side AI**: Rejected — exposes API keys and removes PII control

## Consequences

**Positive:**
- Single source of truth for AI behavior (in repo)
- PII protection centralized in one place (in repo)
- Easy to add providers by extending the router
- Brand voice consistency across all AI interactions
- Input validation: role allowlist, content must be a string
- Cold-fail on missing config rather than per-request surprises

**Negative:**
- Router is a single point of failure (mitigated by fallback)
- Additional latency when Perplexity fallback triggers
- `verify_jwt = false` — anonymous access, no rate limiting (see Known Issues)
- Perplexity API key is dead (401) — fallback path never works in practice
- See **Known Issues** below for implementation defects that need fixing before this can be deployed

## Known Issues — Do Not Deploy As-Is

The repo implementation has defects that need fixing before deployment. The Lovable shim (v57) is not better on all dimensions — it has different tradeoffs.

### 1. Fabrication directives are repo-native (NOT a Lovable deviation)

The `VORTEX_SYSTEM_PROMPT` in the repo contains two directives that cause fabricated citations:

```
 • cite data sources inline when they are external (e.g. [MSCI], [Reuters])
Forbidden:
 • "I don't have real-time data…"
```

These are **not a Lovable invention**. The ADR describes them as brand voice rules. They exist in both the repo and the deployed v57. Deploying the repo version does NOT fix fabricated citations.

**Fix:** Drop both lines from the system prompt. Allow the model to honestly say it lacks real-time data.

### 2. `isFallback()` is self-cancelling, not just "too narrow"

```js
function isFallback(text) {
  return /i (don'?t|do not) (have|possess).+real[- ]?time/i.test(text);
}
```

The regex matches `"I don't have real-time data"` — the exact phrase the system prompt **forbids** the model from emitting. The escalation only fires when the model disobeys its own prompt. This is structurally unreliable.

**Fix:** Escalate on `wantRealtime === true` directly, regardless of response phrasing.

### 3. Perplexity path returns blank in the UI

The Perplexity branch returns `text/event-stream` (SSE), but the client reads `data?.response` — a JSON field. An SSE body gives no `.response` property, so the component falls through both branches and appends nothing. Silent blank.

**Fix:** Return JSON from the Perplexity path, or change the client to stream SSE responses.

### 4. `formatResponse()` actively destroys citation provenance

```js
processed = processed.replace(/\[(.*?)\]\((.*?)\)/g, '[$1]');
```

Strips the URL from every markdown citation. Meanwhile the client extracts citations **only** from markdown links. The router deletes precisely what the client depends on.

**Fix:** Delete `formatResponse()` entirely. Let the model produce clean markdown.

### 5. Hardcoded investment advice appended to every response

```js
if (!processed.includes('recommend') && !processed.includes('suggestion')) {
  processed += "\n\nI recommend monitoring these trends closely for investment opportunities.";
}
```

Unconditional string concatenation adding generic investment advice to every response that doesn't already contain "recommend" or "suggestion". This is financial advice with no basis in the user's question or data.

**Fix:** Delete this block.

### 6. Global replace corrupts model output

```js
processed = processed.replace(/the assistant|vortexai/gi, 'I');
```

Global regex — "VortexAI supports multi-currency" becomes "I supports multi-currency."

### 7. `verify_jwt = false` and no rate limiting are repo-native

These are not Lovable deviations — the ADR's own design uses `withPublicMiddleware` and `verify_jwt = false`. Both the repo and v57 have the same auth gap.

**Fix:** Add JWT verification and rate limiting to whichever version is deployed.

## Where the Repo Wins (vs. Lovable v57)

- **PII stripping** before any external call — v57 has none
- **Input validation** — role allowlist, content type check — v57 accepts anything
- **Cold-fail on missing config** rather than per-request surprises
- **A provider-fallback skeleton** worth keeping once the trigger is fixed

## Files

- `supabase/functions/ai-router/index.ts` — main router
- `supabase/functions/ai-router/providers/perplexity.ts` — Perplexity integration
- `docs/reports/AI_SURFACE_CONSOLIDATED_PLAN_2026-09-11.md` — full surface assessment and fix plan

# ADR-001: AI Router Architecture

**Date:** 2026-04-26
**Status:** Accepted
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
- Single source of truth for AI behavior
- PII protection centralized in one place
- Easy to add providers by extending the router
- Brand voice consistency across all AI interactions

**Negative:**
- Router is a single point of failure (mitigated by fallback)
- Additional latency when Perplexity fallback triggers

## Files

- `supabase/functions/ai-router/index.ts` — main router
- `supabase/functions/ai-router/providers/perplexity.ts` — Perplexity integration
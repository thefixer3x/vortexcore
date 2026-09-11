# AI Chat Components Context

**Purpose:** Multi-provider AI chat interface with brand voice enforcement

## Components

### EnhancedVortexAIChat
**File:** `src/components/ai/EnhancedVortexAIChat.tsx` (12.2K)

Primary chat component featuring:
- Multi-provider support (OpenAI, Gemini, Perplexity)
- Real-time streaming responses
- Message history with React Query
- Session persistence

### OpenAIChat / GeminiAIChat / PerplexityAIChat
**Files:** `src/components/ai/OpenAIChat.tsx`, etc.

Provider-specific chat implementations:
- Direct to respective AI provider APIs
- Provider-specific UI styling
- Model selection controls

### VortexAIChat / VortexAISearch
**Files:** `src/components/ai/VortexAIChat.tsx`, `VortexAISearch.tsx`

Router-connected components:
- `VortexAIChat` — uses `ai-router` edge function
- `VortexAISearch` — search-focused variant

## Hooks

### useVortexChat
**File:** `src/hooks/useVortexChat.ts` (5.1K)

Core chat logic:
- Sends messages to `ai-router` edge function
- Handles streaming responses
- Manages message history
- Applies brand voice formatting to responses

### useVortexChatPersistent
**File:** `src/hooks/useVortexChatPersistent.ts` (9.6K)

Enhanced version with:
- Local storage persistence
- Session management
- Auto-save drafts
- Chat session CRUD via Supabase

## Service Layer

### chatSessionService
**File:** `src/services/chatSessionService.ts` (7.6K)

Supabase-backed session management:
- `createSession(userId, metadata)`
- `addMessage(sessionId, message)`
- `getSessionHistory(sessionId)`

### personalizedAIService
**File:** `src/services/personalizedAIService.ts` (11.9K)

User preference learning:
- Tracks interaction patterns
- Personalizes recommendations
- Stores preferences in `agent_banks_memories` table

## AI Router Integration — VERIFIED STATUS (2026-09-11)

**Repo code ≠ deployed code.** This is the critical fact.

### `ai-router` in the repo
Routes OpenAI → Perplexity with PII stripping, brand voice enforcement.
- `supabase/functions/ai-router/index.ts` — main router, `withPublicMiddleware`
- `supabase/functions/ai-router/providers/perplexity.ts` — Perplexity provider
- **Not deployed.** The deployed v57 (2026-08-03) is a Lovable rewrite.

### `ai-router` deployed (v57)
- Provider: `ai.gateway.lovable.dev` → `gemini-2.5-pro`
- Perplexity code dropped in rewrite
- System prompt has toxic directives: fabricate citations, forbid admitting ignorance
- `verify_jwt = false`, no rate limiting

### `openai-chat` — the support bubble (the only well-secured surface)
- `verify_jwt = true`, uses `withAuthMiddleware`
- Queries caller-scoped financial context via RLS
- Provider: Lovable gateway → Gemini or OpenAI

### Callers
| Component | Calls | Auth required? |
|-----------|-------|----------------|
| `PerplexityAIChat.tsx` | `ai-router` | No (public middleware) |
| `OpenAIChat.tsx` | `openai-chat` | Yes (JWT) |
| `GeminiDemo.tsx` | `gemini-ai` | No (public middleware) |
| `useVortexChat.ts` | `ai-router` | No |
| `useVortexChatPersistent.ts` | `ai-router` | No |

### Brand voice
The deployed `ai-router` system prompt instructs citation fabrication.
Do NOT reference `[MSCI]`, `[Reuters]` as real citation format — they are prompt-injected examples that the model invents.

### Perplexity API key
Dead (401). The fallback path never works. Either renew the key or deprecate the Perplexity path.
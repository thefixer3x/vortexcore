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

## AI Router Integration

All VortexAI chat routes through `ai-router/index.ts` edge function:

```
User message → PII strip → OpenAI → formatResponse → UI
                        ↓
                  Perplexity (if fallback + wantRealtime)
```

Brand voice rules enforced server-side:
- First-person only ("I", never "VortexAI")
- Concise, actionable, data-driven
- Citation format: [MSCI], [Reuters]
- Always end with recommendation
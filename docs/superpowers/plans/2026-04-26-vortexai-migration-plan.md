# VortexAI Migration Plan — Lovable → In-House Onasis AI Router
**Status:** Planning — Do not implement until this document is signed off  
**Date:** 2026-04-26  
**Author:** Claude Code (research session)  
**Goal:** Remove Lovable's direct-OpenAI AI routing and wire VortexCore's AI chat through the in-house Onasis AI Router (`onasis_ai_router`)

---

## 1. Context & Why This Exists

VortexCore's AI chat was wired by Lovable to call OpenAI directly via two Supabase edge functions (`openai-chat`, `ai-router`). These functions:
- Hardcode OpenAI as the provider (GPT-4o-mini)
- Use the `OPENAI_API_KEY` Supabase secret directly
- Bypass the in-house `onasis_ai_router` which is the intended vendor-agnostic AI backend
- Expose OpenAI as the visible provider (the in-house router is designed to mask this)

The Onasis AI Router (`onasis_ai_router`) is the correct backend. It:
- Is Ollama-first with vendor abstraction (DeepSeek, OpenAI, Anthropic fallback chain)
- Strips all vendor identifiers from responses (`sanitizeVendorResponse`)
- Applies Onasis/VortexAI branding via `addOnasisBranding`
- Integrates with the Lanonasis memory system for context-aware responses
- Is already deployed on Railway (exact URL TBD — see §4.1)

---

## 2. Endpoint Audit (Tested 2026-04-26)

### 2.1 Supabase Edge Functions — Project `mxtsdgkwzjzlttpotole`

| Function | Method | Status | Notes |
|----------|--------|--------|-------|
| `openai-chat` | POST | ✅ **200 LIVE** | Responds with `{"response":"..."}`. OPENAI_API_KEY is set in Supabase secrets. No auth header required (uses `withPublicMiddleware`). |
| `ai-router` | POST | ⚠️ **401 deployed** | Returns `{"code":"UNAUTHORIZED_NO_AUTH_HEADER","message":"Missing authorization header"}`. Deployed but requires `Authorization` header. |
| `obf-accounts` | POST | ⚠️ **401 deployed** | Requires auth. OBF feature — not in scope for this migration. |
| `gemini-ai` | POST | unknown | Not tested. Lovable-era function — in scope for removal. |
| `openai-assistant` | POST | unknown | Not tested. Lovable-era function — in scope for removal. |

**Test command:**
```bash
curl -s https://mxtsdgkwzjzlttpotole.supabase.co/functions/v1/openai-chat \
  -X POST -H "Content-Type: application/json" \
  -d '{"prompt":"ping"}'
# Returns: {"response":"Hello! How can I assist you today?"}
```

### 2.2 Onasis API Gateway — `api.lanonasis.com`

| Route | Method | Status | Notes |
|-------|--------|--------|-------|
| `/health` | GET | ✅ **200 LIVE** | `{"status":"ok","service":"Onasis-CORE API Gateway","version":"1.0.0"}` |
| `/api/v1/ai-chat` | POST | ❌ **500 broken** | AWS Lambda syntax error: `SyntaxError: Missing } in template expression`. A Netlify function at this route has a bug. |
| `/api/v1/memories/search` | POST | ⚠️ **400/401** | MaaS endpoint — auth required. Not in scope. |

**Key finding:** `api.lanonasis.com` is the **Onasis-CORE API Gateway** (`unified_gateway.js` in `onasis-gateway` repo), NOT the AI router. The two are separate services. The `/api/v1/ai-chat` route on this domain is a broken Netlify function — separate from the Railway-deployed `onasis_ai_router`.

### 2.3 Onasis AI Router (`onasis_ai_router`) — Railway

| Route | Method | Expected Status | Notes |
|-------|--------|----------------|-------|
| `/` | GET | ✅ 200 | Service info + available routes |
| `/health` | GET | ✅ 200 | Standard health check |
| `/ai-health` | GET | ✅ 200 | Checks Ollama + all vendor health |
| `/ai-services` | GET | ✅ 200 (auth required) | Lists available AI services |
| `/api/v1/ai-chat` | POST | ✅ 200 (auth required) | **Primary AI chat endpoint** |
| `/functions/v1/ai-chat` | POST | ✅ 200 (auth required) | Supabase-style alias — same handler |

**⚠️ Public URL unknown** — `.env.production` is dotenvx-encrypted. Must retrieve from Railway dashboard before implementation. Use `! railway status` or the Railway MCP once authenticated.

---

## 3. Architecture — Current vs Target

### 3.1 Current (Lovable's routing)

```
User types message
        │
        ▼
OpenAIChat.tsx (floating bubble)
        │
        │  supabase.functions.invoke('openai-chat')
        ▼
Supabase Edge Function: openai-chat
        │
        │  fetch("https://api.openai.com/v1/chat/completions")
        │  Authorization: Bearer $OPENAI_API_KEY
        ▼
OpenAI API (GPT-4o-mini)
        │
        ▼
{"response": "..."} ──► OpenAIChat.tsx renders reply
```

```
useVortexChat.ts (advanced hook)
        │
        │  supabase.functions.invoke('ai-router')
        ▼
Supabase Edge Function: ai-router
        │
        ├── Primary: OpenAI (GPT-4o-mini)
        └── Fallback: Perplexity (sonar-8k-online) if "I don't have real-time data"
        │
        ▼
{"response": "..."} ──► useVortexChat state
```

### 3.2 Target (In-house routing)

```
User types message
        │
        ▼
OpenAIChat.tsx (floating bubble)
        │
        │  supabase.functions.invoke('vortex-ai')
        ▼
Supabase Edge Function: vortex-ai  ◄─── NEW thin proxy
        │  Headers forwarded:
        │    X-API-Key: $ONASIS_AI_GATEWAY_KEY
        │    Authorization: Bearer $user_supabase_jwt (forwarded)
        │  Body:
        │    { messages: [system_prompt, ...history, user_msg], use_case: "vortex-financial-assistant" }
        │
        │  fetch("https://<RAILWAY_AI_ROUTER_URL>/api/v1/ai-chat")
        ▼
Onasis AI Router (Railway)
        │
        │  authenticateRequest → AUTH_GATEWAY_URL/v1/auth/resolve
        │
        ├── Vendor 1: Ollama (primary, local model)
        ├── Vendor 2: DeepSeek API (fallback)
        ├── Vendor 3: OpenAI GPT-4o-mini (fallback)
        └── Vendor 4: Supabase Edge Function (last resort)
        │
        │  sanitizeVendorResponse() ← strips vendor identifiers
        │  addOnasisBranding()      ← adds onasis_metadata
        ▼
{ response: "...", onasis_metadata: { powered_by: "Onasis-CORE", ... } }
        │
        ▼
vortex-ai edge function strips onasis_metadata, returns { response: "..." }
        │
        ▼
OpenAIChat.tsx renders reply (no change to frontend)
```

---

## 4. Pre-Implementation Checklist

These must ALL be verified before writing any code.

### 4.1 Resolve Railway URL for `onasis_ai_router`
- [ ] Authenticate Railway MCP (`mcp__railway__authenticate`)
- [ ] Run `railway status` in `onasis_ai_router` project directory
- [ ] Confirm the public domain (e.g., `https://onasis-ai-router-production.up.railway.app`)
- [ ] Verify `GET <RAILWAY_URL>/health` returns 200
- [ ] Verify `GET <RAILWAY_URL>/ai-health` returns vendor health

### 4.2 Fix the broken `/api/v1/ai-chat` on `api.lanonasis.com`
- [ ] Locate the Netlify function causing `SyntaxError: Missing } in template expression`
- [ ] Fix it OR note that `api.lanonasis.com/api/v1/ai-chat` is not the target endpoint (Railway URL is)
- [ ] **This is a separate task** — does not block VortexCore migration if Railway URL is confirmed

### 4.3 Set Supabase Edge Function Secret
- [ ] Create secret `ONASIS_AI_GATEWAY_KEY` in Supabase project secrets
  ```
  supabase secrets set ONASIS_AI_GATEWAY_KEY=lano_<your_key>
  ```
- [ ] Obtain the correct Lanonasis API key from `onasis_ai_router/.env.keys` or Railway env vars
- [ ] Confirm the key authenticates against `AUTH_GATEWAY_URL/v1/auth/resolve`

### 4.4 Set VortexAI System Prompt on Railway
- [ ] Update `OLLAMA_SYSTEM_PROMPT` in `onasis_ai_router` Railway environment variables:
  ```
  You are VortexAI, the embedded digital banker inside the VortexCore app.
  Tone: concise, proactive, analytics-driven, never apologetic, no third-person references to yourself.
  Always:
   • reply in first-person
   • cite data sources inline when they are external (e.g. [MSCI], [Reuters])
   • finish with 1 actionable recommendation (when relevant)
  Forbidden:
   • "I don't have real-time data…"
   • generic suggestions to "check Google"
  ```
- [ ] Alternatively, the edge function can inject the system prompt as the first `{ role: "system" }` message — this is preferred as it keeps VortexCore branding in the app, not the shared router

### 4.5 Verify Ollama is Running on Railway
- [ ] `GET <RAILWAY_URL>/ai-health` — check `ollama.status === "healthy"`
- [ ] If Ollama is not available, the router will fall back to DeepSeek → OpenAI — confirm fallback keys are set in Railway env

---

## 5. Files to Create / Modify / Delete

### 5.1 CREATE — New Supabase Edge Function

**`supabase/functions/vortex-ai/index.ts`**

Thin proxy. Accepts the current `openai-chat` request contract (`{ prompt, history?, systemPrompt? }`) AND the `ai-router` contract (`{ messages, wantRealtime? }`). Normalises both to the AI router's format and forwards.

Key responsibilities:
- Inject the VortexAI system prompt as first message if not already present
- Forward `X-API-Key: $ONASIS_AI_GATEWAY_KEY` to authenticate with the in-house router
- Forward user's Supabase JWT (`req.headers.authorization`) so the auth gateway can resolve the user
- Set `use_case: "vortex-financial-assistant"` header or body field
- Strip `onasis_metadata` from response before returning to frontend
- Return `{ response: "..." }` — same contract as current functions (no frontend changes)
- Return a user-friendly error toast payload on failure (not a raw error stack)

Request shape it accepts:
```typescript
// From OpenAIChat.tsx (openai-chat contract)
{ prompt: string, history?: { role: string, content: string }[], systemPrompt?: string }

// From useVortexChat.ts (ai-router contract)  
{ messages: { role: string, content: string }[], wantRealtime?: boolean }
```

Response shape it returns:
```typescript
{ response: string }  // success
{ error: string }     // failure — user-facing message only
```

### 5.2 MODIFY — Frontend Components

**`src/components/ai/OpenAIChat.tsx`**  
Line 65: Change `supabase.functions.invoke('openai-chat', ...)` → `supabase.functions.invoke('vortex-ai', ...)`  
Body format stays the same: `{ prompt, history }` — edge function handles normalisation.

**`src/hooks/useVortexChat.ts`**  
Line 74: Change `supabase.functions.invoke('ai-router', ...)` → `supabase.functions.invoke('vortex-ai', ...)`  
Body format stays the same: `{ messages, wantRealtime }` — edge function handles both contracts.

**`src/hooks/useVortexChatPersistent.ts`**  
Search for any `functions.invoke` call to `ai-router` or `openai-chat` and update to `vortex-ai`.

### 5.3 DELETE — Lovable's Direct-OpenAI Edge Functions

Once `vortex-ai` is tested and confirmed working:

| Path | Reason for deletion |
|------|---------------------|
| `supabase/functions/openai-chat/` | Replaced by `vortex-ai` |
| `supabase/functions/ai-router/` | Replaced by `vortex-ai` (includes `providers/perplexity.ts`) |
| `supabase/functions/gemini-ai/` | Lovable-era, no current frontend callers |
| `supabase/functions/openai-assistant/` | Lovable-era, no current frontend callers |

**Do NOT delete:**
- `supabase/functions/stripe-webhook/` — payment infrastructure
- `supabase/functions/create-checkout-session/` — payment infrastructure
- `supabase/functions/verify/` — auth flow
- `supabase/functions/auth/` — auth flow
- `supabase/functions/callback-handler/` — auth flow
- `supabase/functions/payment/` — payment infrastructure
- `supabase/functions/obf-accounts/` — OBF feature, live
- `supabase/functions/_shared/middleware.ts` — shared by remaining functions

---

## 6. Implementation Sequence

Execute in this exact order. Do not skip steps.

```
Step 1: Resolve Railway URL (§4.1)
         ↓
Step 2: Confirm Ollama health via /ai-health (§4.5)  
         ↓
Step 3: Set ONASIS_AI_GATEWAY_KEY in Supabase (§4.3)
         ↓
Step 4: Set OLLAMA_SYSTEM_PROMPT on Railway (§4.4)
         ↓
Step 5: Create supabase/functions/vortex-ai/index.ts (§5.1)
         ↓
Step 6: Deploy vortex-ai edge function:
        supabase functions deploy vortex-ai
         ↓
Step 7: Smoke test vortex-ai directly:
        curl -X POST .../functions/v1/vortex-ai \
          -H "Authorization: Bearer <user_jwt>" \
          -d '{"prompt":"What is my account balance?"}'
        → expect { response: "..." } with VortexAI voice
         ↓
Step 8: Update OpenAIChat.tsx invoke target (§5.2)
         ↓
Step 9: Update useVortexChat.ts invoke target (§5.2)
         ↓
Step 10: Update useVortexChatPersistent.ts if needed (§5.2)
          ↓
Step 11: Run bun run build → confirm zero TypeScript errors
          ↓
Step 12: Test in browser — sign in → open chat bubble → send message
          → confirm VortexAI brand voice
          → confirm no "OpenAI" or "GPT" references in response
          → confirm chat history persists across page reload
          ↓
Step 13: Delete Lovable edge functions (§5.3)
          ↓
Step 14: Deploy remaining functions:
         supabase functions deploy --no-verify-jwt openai-chat  ← skip (deleted)
         ↓
Step 15: Commit + push to main
```

---

## 7. In-House Router — Technical Reference

Source: `~/dev-hub/projects/onasis_ai_router/`

### 7.1 Request Contract

```http
POST /api/v1/ai-chat
X-API-Key: lano_<key>
Authorization: Bearer <user_jwt>   (optional but recommended)
Content-Type: application/json

{
  "messages": [
    { "role": "system", "content": "<VortexAI system prompt>" },
    { "role": "user",   "content": "What are my recent transactions?" }
  ],
  "use_case": "vortex-financial-assistant"
}
```

Accepts both:
- `messages` array (chat format)
- `prompt` string (shorthand, converted to `[{ role: "user", content: prompt }]`)

### 7.2 Response Contract

```json
{
  "response": "Based on your recent activity...",
  "onasis_metadata": {
    "service": "ai-chat",
    "user_auth_id": "...",
    "processing_time": 1234,
    "powered_by": "Onasis-CORE Partnership Platform",
    "partner_api_version": "2.0.0",
    "timestamp": "2026-04-26T..."
  }
}
```

The `vortex-ai` edge function should strip `onasis_metadata` before returning to the frontend. Return only `{ response }`.

### 7.3 Vendor Chain (Ollama-first)

```
1. Ollama        (local, configured via OLLAMA_BASE_URL + OLLAMA_MODEL)
2. DeepSeek API  (requires DEEPSEEK_API_KEY in Railway env)
3. OpenAI        (requires OPENAI_API_KEY in Railway env — already set per .env.production)
4. Supabase Edge Function (SUPABASE_URL + SUPABASE_EDGE_CHAT_PATH fallback)
```

Circuit breaker: after `VENDOR_CIRCUIT_THRESHOLD` (default 3) consecutive failures, a vendor is bypassed for `VENDOR_CIRCUIT_COOLDOWN_MS` (default 30s).

### 7.4 Authentication Flow

```
vortex-ai edge function
        │
        │  X-API-Key: $ONASIS_AI_GATEWAY_KEY
        ▼
onasis_ai_router: authenticateRequest middleware
        │
        │  GET AUTH_GATEWAY_URL/v1/auth/resolve
        │  forwards Authorization + X-API-Key headers
        ▼
Auth Gateway (internal Railway service, port 4000)
        │
        ├── validates API key OR JWT
        └── returns { authId, organizationId, authMethod, email }
        │
        ▼
req.uai populated → request proceeds to AI handler
```

### 7.5 System Prompt Configuration

**Preferred approach**: inject via `messages[0]` in the edge function. This keeps VortexCore branding in the app layer, not in the shared router. The router will prepend its own `OLLAMA_SYSTEM_PROMPT` first, then the injected system message follows — both are present in the final conversation context.

**Alternative**: set `OLLAMA_SYSTEM_PROMPT` on Railway to the VortexAI persona. Risk: this affects ALL use cases on the shared router, not just VortexCore.

**Recommendation**: use the edge function injection approach.

---

## 8. Known Issues & Blockers

| Issue | Severity | Status | Action |
|-------|----------|--------|--------|
| `api.lanonasis.com/api/v1/ai-chat` returns Lambda syntax error | Medium | Open | Fix Netlify function; separate task, does not block this migration since Railway URL is the target |
| `onasis_ai_router` Railway public URL unknown (encrypted env) | High | Blocking Step 1 | Complete Railway MCP auth OR run `railway status` locally in `onasis_ai_router/` dir |
| `ai-router` Supabase edge function requires auth header | Low | Known | Will be deleted; not a blocker |
| Ollama model availability on Railway | High | Unknown | Verify via `/ai-health` once Railway URL is confirmed |
| VortexAI system prompt not set on Railway | Medium | Open | Set `OLLAMA_SYSTEM_PROMPT` OR inject via edge function |

---

## 9. Out of Scope (This Plan)

- Migration of `useVortexChatPersistent.ts` session persistence to `ai_chat_sessions` — Phase 2 of the original plan
- Streaming responses (the in-house router does not currently stream; Perplexity streaming was Lovable-only)
- `wantRealtime` flag — the in-house router does not have a Perplexity integration; this flag can be accepted and ignored for now, or mapped to a `use_case` with web-search capabilities if/when added to the router
- Translation integration (Phase 4 of the original plan)
- Stripe subscription gating for AI tier limits (Phase 3 of the original plan)

---

## 10. Rollback Plan

If `vortex-ai` fails in production:
1. In `OpenAIChat.tsx`, revert invoke target back to `'openai-chat'`
2. In `useVortexChat.ts`, revert invoke target back to `'ai-router'`
3. Do NOT delete the old edge functions until `vortex-ai` has been stable for at least one full deploy cycle

Keep `openai-chat` and `ai-router` deployed but unused as a safety net until Step 13.

---

## 11. Relationship to Broader Phase Plan

This migration is a pre-requisite to Phase 2 (AI chat in live mode) of the Phased Fix Plan (`2026-04-26-phased-fix-plan.md`). Phase 2 should not begin until:
- `vortex-ai` edge function is deployed and smoke-tested (Step 7 above)
- `ai_chat_sessions` RLS migration is confirmed live (Phase 2 checklist item 2)

The TypeScript build is already green (Phase 1 complete as of 2026-04-26).

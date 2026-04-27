# VortexAI Migration Plan — Lovable → In-House Onasis AI Router
**Status:** IN PROGRESS — Steps 1-2 complete. Blocked on `ONASIS_AI_GATEWAY_KEY`.  
**Date:** 2026-04-26 | **Last updated:** 2026-04-27  
**Author:** Claude Code (research session)  
**Goal:** Remove Lovable's direct-OpenAI AI routing and wire VortexCore's AI chat through the in-house Onasis AI Router (`onasis_ai_router`)

---

## ⚡ AGENT HANDOFF STATE — Read Before Touching Anything

> This section is for any AI agent, human developer, or Lovable picking up this plan mid-stream. These are confirmed ground truths — do not override them based on assumptions, training data, or prior conversation context that contradicts these facts.

### Confirmed Facts (verified 2026-04-27 via SSH + MCP)

| Fact | Value | How confirmed |
|------|-------|---------------|
| VPS AI router URL | `https://ai.vortexcore.app` | SSH inspection + curl |
| VPS host | `168.231.74.29`, port 8000 | `ssh vps` → `pm2 list` |
| Router process | `node /opt/lanonasis/shared_services/onasis_ai_router/server.js` PID 1073 | SSH |
| Auth gateway | `https://auth.lanonasis.com/v1/auth/resolve` | curl → 401 confirms live |
| Target Supabase project | `mxtsdgkwzjzlttpotole` (the-fixer-initiative) | Supabase MCP |
| **DO NOT USE** | `ptnrwrgzrsbocgxlpvhd` = auth infrastructure DB, 0 users | Supabase MCP |
| Frontend hook | `src/hooks/useVortexChat.ts:74` calls `ai-router` | grep confirmed |
| Frontend component | `src/components/ai/OpenAIChat.tsx` calls `openai-chat` | codebase audit |
| `ai-router` auth | ✅ Returns 401 — `withPublicMiddleware` was fixed 2026-04-27 | code review |

### Step Progress

| Step | Status | Notes |
|------|--------|-------|
| 1. VPS URL confirmed | ✅ DONE | `https://ai.vortexcore.app` |
| 2. Ollama healthy | ✅ DONE | 11ms, Anthropic + OpenAI also healthy |
| 3. Set `ONASIS_AI_GATEWAY_KEY` secret | ❌ **BLOCKED** | Key not yet obtained — see §4.3 |
| 4. VortexAI system prompt | ⏳ Pending Step 3 | Inject in edge fn, not VPS env |
| 5. Create `vortex-ai` edge function | ⏳ Pending Step 3 | See §5.1 |
| 6-15. Remaining | ⏳ Pending | See §6 sequence |

**Single blocker:** Obtain a valid `ONASIS_AI_GATEWAY_KEY` (Lanonasis API key). Everything else is ready.

### GitHub Issues Created
- #65 — Create `vortex-ai` edge function
- #66 — Switch `useVortexChat` to `vortex-ai`
- #67 — Add auth to `ai-router` (security, done in code — needs deploy)
- #68 — Retire legacy AI edge functions (post-migration)

---

## 🚫 GUARDRAILS — Do Not Deviate

These rules exist because previous sessions drifted from confirmed facts. If you feel tempted to override any of these, stop and re-verify against the live system first.

1. **Never change the target URL** from `https://ai.vortexcore.app`. `api.lanonasis.com/api/v1/ai-chat` is a DIFFERENT broken endpoint (Lambda syntax error) — do not use it.
2. **Never use `ptnrwrgzrsbocgxlpvhd`** as the target Supabase project. That is the auth-gateway infrastructure DB with 0 users. All app data is in `mxtsdgkwzjzlttpotole`.
3. **Do not update `OLLAMA_SYSTEM_PROMPT` on the VPS** — the router is multi-tenant (shared Lanonasis service). Inject the VortexAI persona via `messages[0]` in the edge function only.
4. **Do not delete legacy edge functions** (`openai-chat`, `ai-router`) until `vortex-ai` has been smoke-tested and confirmed working in production.
5. **The `vortex-ai` edge function must use `withAuthMiddleware`** — not `withPublicMiddleware`. The auth gap was already identified and fixed in `ai-router`.
6. **Strip `onasis_metadata` before returning** to the frontend. The frontend expects `{ response: string }` only.
7. **Preserve commit `ffc4042`** — this fixed `client.ts` to point to the correct Supabase project. Do not revert it.

### For Lovable (if delegating UI work)
Lovable can safely work on UI-only files in Phase 2:
- ✅ `src/components/ai/OpenAIChat.tsx` — change invoke target (§5.2), visual tweaks
- ✅ `src/hooks/useVortexChat.ts` — change invoke target only (line 74)
- ❌ Do NOT let Lovable touch edge functions, `.env` files, or Supabase secrets
- ❌ Do NOT let Lovable regenerate `src/integrations/supabase/client.ts` — it will revert to the wrong DB
- ❌ If Lovable asks to "connect to Supabase", ensure it targets `mxtsdgkwzjzlttpotole` not its cached project

---

---

## 1. Context & Why This Exists

VortexCore's AI chat was wired by Lovable to call OpenAI directly via two Supabase edge functions (`openai-chat`, `ai-router`). These functions:
- Hardcode OpenAI as the provider (GPT-4o-mini)
- Use the `OPENAI_API_KEY` Supabase secret directly
- Bypass the in-house `onasis_ai_router` which is the intended vendor-agnostic AI backend
- Expose OpenAI as the visible provider (the in-house router is designed to mask this)

The Onasis AI Router (`onasis_ai_router`) is the correct backend. It:
- Is Ollama-first with vendor abstraction (Anthropic, OpenAI fallback chain via circuit breaker)
- Strips all vendor identifiers from responses (`sanitizeVendorResponse`)
- Applies Onasis/VortexAI branding via `addOnasisBranding`
- Integrates with the Lanonasis memory system for context-aware responses
- **Lives on the VPS at `https://ai.vortexcore.app`** (NOT Railway — Railway was a test snapshot)
  - Source: `/opt/lanonasis/shared_services/onasis_ai_router/` on 168.231.74.29
  - nginx proxies `ai.vortexcore.app` → `127.0.0.1:8000`
  - Process: `node /opt/lanonasis/shared_services/onasis_ai_router/server.js` (PID 1073)

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
| `/api/v1/ai-chat` | POST | ❌ **500 broken** | Netlify function syntax error: `SyntaxError: Missing } in template expression`. This route on `api.lanonasis.com` is a broken Netlify function (not the VPS router at `ai.vortexcore.app`). |
| `/api/v1/memories/search` | POST | ⚠️ **400/401** | MaaS endpoint — auth required. Not in scope. |

**Key finding:** `api.lanonasis.com` is the **Onasis-CORE API Gateway** (`unified_gateway.js` in `onasis-gateway` repo), NOT the AI router. The two are separate services. The `/api/v1/ai-chat` route on this domain is a broken Netlify function — separate from the Railway-deployed `onasis_ai_router`.

### 2.3 Onasis AI Router (`onasis_ai_router`) — VPS (`ai.vortexcore.app`)

**Updated 2026-04-27** — Confirmed live via SSH inspection and curl tests.

| Route | Method | Actual Status | Notes |
|-------|--------|--------------|-------|
| `/` | GET | ✅ **200 LIVE** | `{"service":"Onasis AI Service Router","status":"running","ai_provider":"Ollama"}` |
| `/health` | GET | ✅ **200 LIVE** | `{"status":"degraded"}` — degraded because `supabase-edge` adapter is unhealthy; Ollama/Anthropic/OpenAI are all healthy |
| `/ai-health` | GET | ✅ **200 LIVE** | `{"ollama":"healthy","anthropic":"healthy","openai":"healthy","supabase-edge":"unhealthy","overall_status":"degraded"}` — the 3 real vendors are healthy |
| `/ai-services` | GET | ✅ deployed (auth required) | Lists available AI services; needs Bearer/X-API-Key |
| `/api/v1/ai-chat` | POST | ✅ deployed (auth required) | **Primary AI chat endpoint**; returns 401 without valid token |
| `/functions/v1/ai-chat` | POST | ✅ deployed (auth required) | Supabase-style alias — same handler |

**Base URL: `https://ai.vortexcore.app`**  
Auth: `POST /api/v1/ai-chat` → middleware calls `https://auth.lanonasis.com/v1/auth/resolve` with forwarded headers.  
CORS: `CORS_ALLOWED_ORIGINS` is not set on VPS — restrictive. Direct browser calls from `vortexcore.app` would be blocked. The Supabase edge function proxy approach avoids this (server-to-server).

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
        │  fetch("https://ai.vortexcore.app/api/v1/ai-chat")
        ▼
Onasis AI Router (VPS — ai.vortexcore.app)
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

### 4.1 AI Router URL — ✅ RESOLVED (2026-04-27)

**`https://ai.vortexcore.app`** — confirmed live on VPS (168.231.74.29:8000).

- [x] Public URL confirmed: `https://ai.vortexcore.app`
- [x] `GET /health` → 200 (degraded but all real vendors healthy)
- [x] `GET /ai-health` → Ollama ✅, Anthropic ✅, OpenAI ✅, supabase-edge ❌ (unhealthy adapter, not a blocker)
- [x] `POST /api/v1/ai-chat` → 401 without auth (as expected — auth middleware is active)

### 4.2 Fix the broken `/api/v1/ai-chat` on `api.lanonasis.com`
- [ ] Locate the Netlify function causing `SyntaxError: Missing } in template expression`
- [ ] Fix it OR note that `api.lanonasis.com/api/v1/ai-chat` is not the target endpoint (Railway URL is)
- [ ] **This is a separate task** — does not block VortexCore migration since the target is the VPS URL (`https://ai.vortexcore.app`) confirmed in §4.1

### 4.3 Set Supabase Edge Function Secret
- [ ] Create secret `ONASIS_AI_GATEWAY_KEY` in Supabase project secrets
  ```
  supabase secrets set ONASIS_AI_GATEWAY_KEY=lano_<your_key>
  ```
- [ ] Obtain the correct Lanonasis API key — from `onasis_ai_router/.env.production` on VPS (dotenvx-encrypted) OR from the Onasis auth system admin panel (generates API keys validated at `https://auth.lanonasis.com`)
- [ ] Confirm the key authenticates: `curl -s https://auth.lanonasis.com/v1/auth/resolve -H "X-API-Key: lano_<your_key>"` → should return 200 with `{authId, organizationId}`

### 4.4 Set VortexAI System Prompt
- [ ] **Recommended**: Inject via `messages[0]` in the `vortex-ai` edge function (keeps VortexCore branding in the app layer, not the shared router)
- [ ] **Alternative**: Update `OLLAMA_SYSTEM_PROMPT` on VPS (`/opt/lanonasis/shared_services/onasis_ai_router/.env.production`) — but this affects ALL tenants using the shared router, not just VortexCore. Avoid unless single-tenant.
- [ ] If using VPS env var approach, update via: `ssh vps` → edit `.env.production` → `pm2 restart ecosystem.config.js` (or equivalent)

**VortexAI persona prompt (to inject in edge function):**
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

### 4.5 Verify Ollama — ✅ CONFIRMED (2026-04-27)
- [x] `GET https://ai.vortexcore.app/ai-health` → `ollama.status === "healthy"` (response_time: 11ms)
- [x] Fallback vendors also healthy: Anthropic (180ms), OpenAI (542ms)
- [x] `supabase-edge` adapter in the router is unhealthy — this is the router's internal Supabase edge function fallback, not VortexCore's. Does not block this migration.

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
Step 1: ✅ DONE — VPS URL confirmed: https://ai.vortexcore.app (§4.1)
         ↓
Step 2: ✅ DONE — Ollama healthy (§4.5)
         ↓
Step 3: Set ONASIS_AI_GATEWAY_KEY in Supabase (§4.3)
         ↓
Step 4: VortexAI system prompt — inject in edge function, not VPS env (§4.4)
         ↓
Step 5: Create supabase/functions/vortex-ai/index.ts (§5.1)
         ↓
Step 6: Deploy vortex-ai edge function:
        supabase functions deploy vortex-ai
         ↓
Step 7: Smoke test vortex-ai directly:
        curl -X POST https://mxtsdgkwzjzlttpotole.supabase.co/functions/v1/vortex-ai \
          -H "Authorization: Bearer <user_jwt>" \
          -H "Content-Type: application/json" \
          -d '{"prompt":"What is my account balance?"}'
        → expect { response: "..." } with VortexAI voice (no "OpenAI"/"GPT" references)
        → if it fails, check logs: supabase functions logs vortex-ai
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
Step 14: Deploy remaining functions (excluding deleted functions):
```bash
# Deploy remaining: vortex-ai, stripe, ai-router, gemini-ai, etc.
# openai-chat has been deleted — do NOT deploy it
supabase functions deploy vortex-ai
```
         ↓
Step 15: Commit + push to main
```

---

## 7. In-House Router — Technical Reference

**Canonical source (live):** `/opt/lanonasis/shared_services/onasis_ai_router/` on VPS 168.231.74.29  
**Repo version (version control):** `/opt/lanonasis/shared_services/onasis-agent-haven/services/onasis-ai-router/` — not yet cut over to prod

### 7.1 Request Contract

```http
POST https://ai.vortexcore.app/api/v1/ai-chat
X-API-Key: lano_<key>
Authorization: Bearer <user_jwt>   (optional, forwarded to auth gateway)
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
- `messages` array (chat format — preferred)
- `prompt` string (shorthand, converted to `[{ role: "user", content: prompt }]`)

**Auth gateway:** Every request to `/api/v1/ai-chat` hits `https://auth.lanonasis.com/v1/auth/resolve` (confirmed live — returns 401 for invalid key, 200 for valid). The `X-API-Key` or `Authorization: Bearer` header is forwarded for resolution.

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

**Live vendor health as of 2026-04-27:**
```
1. Ollama        ✅ healthy (11ms) — primary, local on VPS
2. Anthropic     ✅ healthy (180ms) — fallback
3. OpenAI        ✅ healthy (542ms) — fallback
4. supabase-edge ❌ unhealthy — the router's own internal Supabase edge function adapter; not related to VortexCore
```

Circuit breaker: after `VENDOR_CIRCUIT_THRESHOLD` (default 3) consecutive failures, a vendor is bypassed for `VENDOR_CIRCUIT_COOLDOWN_MS` (default 30s). Success decays failure count by 2.

### 7.4 Authentication Flow

```
vortex-ai edge function
        │
        │  X-API-Key: $ONASIS_AI_GATEWAY_KEY   ← Supabase secret
        │  Authorization: Bearer <user_jwt>      ← forwarded from VortexCore user session
        ▼
ai.vortexcore.app: authenticateRequest middleware
        │
        │  GET https://auth.lanonasis.com/v1/auth/resolve
        │  forwards Authorization + X-API-Key headers
        ▼
Auth Gateway (https://auth.lanonasis.com — confirmed live)
        │
        ├── validates API key OR JWT
        └── returns { authId, organizationId, authMethod, email }
        │
        ▼
req.uai populated → request proceeds to AI handler
```

**Confirmed:** `https://auth.lanonasis.com/v1/auth/resolve` returns 401 for invalid key and is reachable. `AUTH_GATEWAY_URL=https://auth.lanonasis.com` is set in the VPS process env.

### 7.5 System Prompt Configuration

**Preferred approach**: inject via `messages[0]` in the edge function. This keeps VortexCore branding in the app layer, not in the shared router. The router will prepend its own `OLLAMA_SYSTEM_PROMPT` first, then the injected system message follows — both are present in the final conversation context.

**Alternative**: set `OLLAMA_SYSTEM_PROMPT` on Railway to the VortexAI persona. Risk: this affects ALL use cases on the shared router, not just VortexCore.

**Recommendation**: use the edge function injection approach.

---

## 8. Known Issues & Blockers

| Issue | Severity | Status | Action |
|-------|----------|--------|--------|
| `api.lanonasis.com/api/v1/ai-chat` returns Lambda syntax error | Medium | Open | Fix Netlify function; separate task, does not block this migration since VPS URL is the target |
| `onasis_ai_router` VPS URL — **RESOLVED** | — | ✅ Done | `https://ai.vortexcore.app` confirmed live 2026-04-27 |
| `ai-router` Supabase edge function requires auth header | Low | Known | Will be deleted; not a blocker |
| Ollama health — **RESOLVED** | — | ✅ Done | Ollama healthy (11ms), Anthropic healthy, OpenAI healthy |
| `ONASIS_AI_GATEWAY_KEY` not yet in Supabase secrets | High | Blocking Step 3 | Retrieve valid API key from Onasis auth system; set as Supabase secret |
| VortexAI system prompt not set | Medium | Open | Inject in `vortex-ai` edge function as first `messages[0]` system message |
| CORS not configured on VPS | Medium | Known non-blocker | Edge function proxy (server-to-server) avoids CORS. If direct browser access ever needed, add `CORS_ALLOWED_ORIGINS=https://vortexcore.app,...` to VPS env and restart |

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

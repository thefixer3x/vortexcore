# BYOK — Bring Your Own ChatGPT (OpenAI) Key

End-users connect their own OpenAI API key so Premium AI surfaces in VortexCore
route through their personal ChatGPT/OpenAI account instead of the shared
Lovable AI Gateway.

> **Note on "Sign in with ChatGPT":** OpenAI does not currently expose a public
> consumer OAuth flow that lets a third-party app bill `chat/completions`
> against a user's ChatGPT subscription. Until they do, the user-facing flow is
> a one-click "Connect ChatGPT" button that takes the user to
> `platform.openai.com/api-keys`, then asks them to paste the `sk-…` key back.
> The DX is OAuth-like; the mechanism is BYOK.

## Architecture

```
Settings → Integrations
  └── "Connect ChatGPT" (paste sk-…)
        │
        ▼
  edge: connect-openai-key
        │  validates key (GET /v1/models)
        │  AES-GCM encrypts with VORTEX_BYOK_ENCRYPTION_KEY
        ▼
  app_vortexcore.vortex_user_ai_credentials  (RLS deny-all, service-role only)

Premium AI surface (e.g. OpenAIChat)
  └── supabase.functions.invoke('vortex-ai-byok', { messages })
        │
        ▼
  edge: vortex-ai-byok
        ├── load + decrypt user's key
        ├── try POST https://api.openai.com/v1/chat/completions
        │     ✓ → return { provider: 'openai-byok', response }
        │     401 → mark credential `invalid`, fall through
        └── fallback → POST ai.gateway.lovable.dev (Lovable AI)
              → return { provider: 'lovable-ai', response }
```

## Components

| Layer | Path |
|---|---|
| Table | `app_vortexcore.vortex_user_ai_credentials` (RLS deny-all) |
| Status RPC | `public.vortex_get_ai_credential_status(_provider)` |
| Delete RPC | `public.vortex_delete_ai_credential(_provider)` |
| Connect edge fn | `supabase/functions/connect-openai-key/index.ts` |
| Premium proxy | `supabase/functions/vortex-ai-byok/index.ts` |
| UI | `src/components/settings/sheets/IntegrationsSheet.tsx` (sheet id `integrations`) |

## Required secrets

Set in **Supabase → Edge Functions → Secrets**:

| Name | Purpose |
|---|---|
| `VORTEX_BYOK_ENCRYPTION_KEY` | Master secret used to derive an AES-GCM-256 key (`SHA-256(secret)`). Rotate by re-encrypting all rows. Do **not** store in DB. |
| `LOVABLE_API_KEY` | Already configured — used as the fallback path. |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-provided. Edge functions use it to read/write the credentials table (deny-all to the client). |

## Security model

- The credentials table has RLS with a single `USING (false)` policy → **no
  client (anon/auth) can ever SELECT or UPDATE it**. Only edge functions
  running with the service role can.
- The `key_hint` column (e.g. `••••a1b2`) is the only thing surfaced to the UI.
- Keys are AES-GCM-256 encrypted at rest. The IV is prepended to the
  ciphertext and the whole blob is base64-encoded.
- 401 responses from OpenAI flip `status='invalid'` so the next request falls
  back to Lovable AI instead of looping.

## Routing policy ("Premium-only")

Per product decision, the BYOK path is **only** used on Premium AI surfaces
(currently `OpenAIChat`, AI Insights). Default surfaces — VortexAI bubble,
Ecosystem chat — keep using `ai-router` against Lovable AI so we don't burn
the user's quota on background interactions.

To opt a surface in: change `supabase.functions.invoke('ai-router', …)` →
`supabase.functions.invoke('vortex-ai-byok', …)`. Same request shape:
`{ messages: ChatMessage[] }`.

## Future: real "Sign in with ChatGPT"

If/when OpenAI ships a billable consumer OAuth scope:

1. Apply for OpenAI Platform OAuth (verified partner).
2. Add a `provider='openai-oauth'` row in the same credentials table storing
   refresh tokens instead of `sk-…`.
3. Add a refresh helper to `vortex-ai-byok` and prefer the OAuth row when both
   exist. UI changes are minimal — same sheet, different button label.

## Open items

- [ ] Add `VORTEX_BYOK_ENCRYPTION_KEY` secret before the connect flow will
      work end-to-end.
- [ ] Wire the **Settings → Integrations** row in `PersonalSettings` so users
      can open the sheet (id `integrations`).
- [ ] Switch `OpenAIChat` to invoke `vortex-ai-byok` instead of `ai-router` to
      activate the Premium routing.

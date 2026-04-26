# OBF-001-V Integration Runbook

**Scope:** VortexCore side of the OBF-001 cross-repo spike.
**Gateway side:** tracked in onasis-gateway as OBF-001-G.

---

## Prerequisites

- onasis-gateway running locally or on a reachable URL with:
  - `GET /v1/aisp/accounts` returning an array of `OBFAccount` objects
  - `GET /v1/aisp/accounts/:id/transactions` returning an array of `OBFTransaction` objects
  - A service token you control
- Supabase project with edge function deployment access

---

## Step 1 — Set gateway secrets in Supabase Vault

```bash
supabase secrets set ONASIS_GATEWAY_URL=https://your-gateway-url
supabase secrets set ONASIS_GATEWAY_TOKEN=your-service-token
```

These never leave the edge function environment. Not in `.env`, not in the browser bundle.

---

## Step 2 — Deploy the edge function

```bash
supabase functions deploy obf-accounts --no-verify-jwt
```

> `--no-verify-jwt` because the function validates the Supabase session itself via `withAuthMiddleware`.

---

## Step 3 — Smoke test the edge function directly

```bash
# Get a valid Supabase session token first (from browser devtools or test user)
curl -X GET https://<your-project>.supabase.co/functions/v1/obf-accounts/healthz \
  -H "Authorization: Bearer <supabase-session-token>"
# Expected: { "status": "ok", "upstreamStatus": 200 }
```

---

## Step 4 — Enable the feature flag locally

In your local `.env`:
```
VITE_OBF_LIVE=true
```

Restart the dev server: `npm run dev`

---

## Step 5 — Verify in the dashboard

1. Log in with a valid Supabase user
2. Navigate to `/dashboard`
3. Observe the **OBF Accounts** panel below the internal wallet cards
4. Open browser devtools → Network tab → confirm calls hit `obf-accounts` edge function, not any external URL
5. Confirm no bank credentials, gateway URL, or token appear in network payloads

---

## Step 6 — Test error state

1. Temporarily point `ONASIS_GATEWAY_URL` to an unreachable URL
2. Reload dashboard
3. Confirm: OBF panel shows inline error alert, existing internal wallets still render, no console crash

---

## Acceptance Checklist

- [ ] ≥1 real Providus account renders in OBF panel with `VITE_OBF_LIVE=true`
- [ ] ≥1 transaction renders when an account is selected
- [ ] Gateway down → OBF panel shows error state, dashboard doesn't crash
- [ ] `VITE_OBF_LIVE=false` (default) → zero network calls to `obf-accounts`
- [ ] No secrets or gateway URL appear in browser bundle (`npm run build && grep -r "ONASIS" dist/` → no results)
- [ ] Existing internal wallets + transactions unaffected in both flag states

---

## Token Rotation

When rotating the gateway service token:
1. `supabase secrets set ONASIS_GATEWAY_TOKEN=new-token`
2. Redeploy edge function: `supabase functions deploy obf-accounts`
3. Invalidate old token in onasis-gateway

---

## Follow-up Issues

| Issue | Scope |
|---|---|
| OBF-002 | Route `openai-chat` + `gemini-ai` edge functions through onasis-gateway AI router |
| OBF-003 | Consent grant/revoke UI in VortexCore against gateway consent schema |
| OBF-004 | PISP beneficiary + single-payment UI (greenfield) |
| OBF-005 | FAPI 2.0 / OIDC end-user auth handoff |

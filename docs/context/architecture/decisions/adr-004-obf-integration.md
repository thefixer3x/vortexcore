# ADR-004: OBF Providus Integration

**Date:** 2026-04-26
**Status:** Accepted

## Context

VortexCore needed to display real Providus bank accounts and transactions alongside internal wallet data, without merging the two data models.

## Decision

**Feature flag gates rendering AND fetching:**
- `VITE_OBF_LIVE=false` (default): zero network calls, existing internal wallets only
- `VITE_OBF_LIVE=true`: OBF panel renders, `obf-accounts` edge function called

**No data model merging:**
- Internal wallets: `AccountCard` + `TransactionList` panels
- OBF accounts: separate `OBFAccountPanel` component, separate data source

**Credential isolation:**
- Gateway URL + token stored in Supabase Vault (edge function secrets)
- Never exposed to browser bundle
- Edge function validates with zod, returns 502 on schema violation

### Architecture

```
Browser                    Edge Function              Gateway
   │                            │                       │
   │  VITE_OBF_LIVE=true        │                       │
   │  ──────────────►            │                       │
   │  fetchAccounts()            │                       │
   │                            │  ONASIS_GATEWAY_URL    │
   │                            │  ONASIS_GATEWAY_TOKEN  │
   │                            │  ──────────────────►  │
   │                            │                       │
   │                            │  ◄──────────────────  │
   │                            │  (validated with zod) │
   │  ◄─────────────────────────│                       │
   │  { accounts: [...] }       │                       │
```

### Error Handling
- Gateway down → OBF panel shows inline error (no dashboard crash)
- Schema violation → 502 `schema_violation` from edge function
- OBF panel has own skeleton loader, independent of internal wallet loading

## Consequences

**Positive:**
- Providus sandbox stays clean during development (no calls when flag off)
- Clear separation allows independent evolution of OBF vs internal wallets
- Credential isolation meets security requirements

**Negative:**
- User sees two separate account sections (may improve in future OBF-003 consent merge)
- Additional edge function to maintain (obf-accounts)

## Files

- `supabase/functions/obf-accounts/index.ts` — edge function
- `src/services/obf/accounts.ts` — client service
- `src/hooks/use-obf-accounts.ts` — React hook
- `src/components/obf/*` — UI components
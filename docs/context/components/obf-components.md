# OBF Components Context

**Purpose:** Render Providus bank accounts via onasis-gateway integration

## Components

### OBFAccountPanel
**File:** `src/components/obf/OBFAccountPanel.tsx`

Container component that:
- Renders only when `VITE_OBF_LIVE=true` (feature flag)
- Shows loading skeleton during fetch
- Shows error state with retry on failure
- Renders list of OBFAccountCard components

### OBFAccountCard
**File:** `src/components/obf/OBFAccountCard.tsx`

Individual account display:
- Account name, masked number, type badge
- Balance with currency
- "Last updated" timestamp

### OBFTransactionList
**File:** `src/components/obf/OBFTransactionList.tsx`

Transaction history for selected account:
- Shows posted/pending/failed status badges
- Credit/debit direction with color coding
- Counterparty and description
- Click to expand for full details

## Data Hooks

### useOBFAccounts()
**File:** `src/hooks/use-obf-accounts.ts`

```typescript
useQuery({
  queryKey: ["obf", "accounts"],
  queryFn: fetchAccounts,      // from @/services/obf/accounts
  enabled: OBF_LIVE,          // false by default
  staleTime: 60_000,          // 1 min cache
  retry: 2,
})
```

### useOBFTransactions(accountId, opts)
```typescript
useQuery({
  queryKey: ["obf", "transactions", accountId, opts],
  queryFn: () => fetchTransactions(accountId, opts),
  enabled: OBF_LIVE && !!accountId,
  staleTime: 30_000,
  retry: 1,
})
```

## Service Layer

**File:** `src/services/obf/accounts.ts`

- `fetchAccounts()` → GET `obf-accounts` edge function
- `fetchTransactions(accountId, opts)` → GET `obf-accounts` with `x-obf-path` header
- Both throw on error (React Query handles via error state)

## Edge Function

**File:** `supabase/functions/obf-accounts/index.ts`

- Proxies to `onasis-gateway`
- Validates response with zod
- Returns 502 on schema violation
- Credentials in Supabase Vault (never browser-exposed)
# Dashboard Page Context

**File:** `src/pages/Dashboard.tsx`
**Purpose:** Main dashboard showing wallets, transactions, and AI insights

## Purpose

Primary user landing page after login. Shows:
- Internal wallets (from `vortex_wallets` table)
- Transactions (from `vortex_transactions` table)
- AI-generated financial insights
- Quick action buttons (deposit, withdraw, transfer, pay)
- OBF Providus accounts (when `VITE_OBF_LIVE=true`)

## Key Files

- `src/pages/Dashboard.tsx` — page component
- `src/hooks/use-dashboard-data.ts` — data fetching hook
- `src/components/dashboard/` — sub-components (ModernDashboardHeader, ModernAccountCard, etc.)
- `src/contexts/CurrencyContext.tsx` — currency display context

## Architecture

```
Dashboard
├── ModernDashboardHeader      # Top bar with profile + currency
├── accountCards (mapped from wallets)
│   └── ModernAccountCard      # Wallet display with gradient colors
├── OBFAccountPanel (conditional)
│   └── OBFAccountCard         # Providus account display
├── ModernTransactionList      # Transaction history with type icons
├── AIInsightsDashboard       # AI-generated insights widget
└── QuickActionsGrid           # FAB + action dialog trigger
```

## Data Flow

```
useDashboardData() → fetches:
  - vortex_wallets (by user_id)
  - vortex_transactions (by user_id, latest 50)
  - profiles (full_name, company_name)

OBF accounts (separate):
  useOBFAccounts() → obf-accounts edge function → onasis-gateway
```

## Key Patterns

- `ACCOUNT_COLORS` array cycles through gradient backgrounds
- Transaction metadata used for rich display (counterparty, category, description)
- `DASHBOARD_ACTIONS` config maps transaction types to display labels
- OBF_LIVE read once at render time from `import.meta.env.VITE_OBF_LIVE`

## State Management

- React Query via `useDashboardData` hook (caches wallets/transactions)
- Local state for action dialog visibility
- Currency context for display formatting

## Edge Cases

- No wallets: shows "Add Account" card
- OBF gateway failure: OBF panel shows error inline, dashboard continues working
- Loading: skeleton components via `DashboardSkeleton`
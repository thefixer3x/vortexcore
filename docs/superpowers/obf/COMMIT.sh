#!/bin/bash
# OBF-001-V: Stage and commit all new files
# Run from the root of your vortexcore repo after copying files into place.

set -e

git add \
  supabase/functions/obf-accounts/index.ts \
  src/services/obf/accounts.ts \
  src/hooks/use-obf-accounts.ts \
  src/components/obf/OBFAccountCard.tsx \
  src/components/obf/OBFTransactionList.tsx \
  src/components/obf/OBFAccountPanel.tsx \
  src/components/obf/index.ts \
  src/pages/Dashboard.tsx \
  .env.example

git commit -m "feat(obf-001): add Providus OBF accounts panel via onasis-gateway

- New obf-accounts Supabase Edge Function (Deno) proxies to onasis-gateway
  using project-standard withAuthMiddleware; zod validates response shapes
- New client service (src/services/obf/accounts.ts) + React Query hook
  (src/hooks/use-obf-accounts.ts) for OBF data fetching
- New OBFAccountPanel, OBFAccountCard, OBFTransactionList components
  render only when VITE_OBF_LIVE=true
- Feature flag gates rendering AND fetching — zero network calls when false
- Existing internal wallets/transactions display completely unchanged
- Gateway URL and token live in Supabase Vault only, never in browser bundle
- Runbook in RUNBOOK.md

Resolves OBF-001-V"

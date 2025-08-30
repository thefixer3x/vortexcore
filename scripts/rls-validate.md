# RLS Validation Guide

This guide demonstrates how to validate deny‑by‑default isolation for key tables using two different Supabase user JWTs.

Prerequisites
- SUPABASE_URL for your project
- Two user tokens: USER_A_JWT and USER_B_JWT (e.g., test users)

1) Snapshot policies and RLS status

Run in psql (or Supabase SQL editor):

- scripts/rls-validate.sql

2) API checks (replace variables before running)

```
export SUPABASE_URL=https://<PROJECT_REF>.supabase.co
export VITE_SUPABASE_ANON_KEY=<YOUR_ANON_KEY>
export USER_A_JWT=<JWT_FOR_USER_A>
export USER_B_JWT=<JWT_FOR_USER_B>

# Helper
check_table() {
  local table="$1"; shift
  echo "== Checking ${table} as USER A (should only see own rows) =="
  curl -s -H "apikey: ${VITE_SUPABASE_ANON_KEY}" \
       -H "Authorization: Bearer ${USER_A_JWT}" \
       "${SUPABASE_URL}/rest/v1/${table}?select=*" | jq 'length'

  echo "== Checking ${table} as USER B (should not see USER A rows) =="
  curl -s -H "apikey: ${VITE_SUPABASE_ANON_KEY}" \
       -H "Authorization: Bearer ${USER_B_JWT}" \
       "${SUPABASE_URL}/rest/v1/${table}?select=*" | jq 'length'
}

for t in wallets conversations child_profiles transactions ai_chat_sessions vortex_settings stripe_customers; do
  check_table "$t"
done
```

Expected Results
- Each user should only see their own rows for the tables listed.
- Cross‑user access should return zero rows.

If any table returns cross‑user data, review policies in scripts/rls-validate.sql output and tighten GRANTs or add/adjust policies.

```
-- Example policy pattern
-- CREATE POLICY "Users can view own wallet" ON public.wallets FOR SELECT
--   USING (auth.uid() = user_id);
```

3) Optional: Performance checks
- Inspect indexes in scripts/rls-validate.sql output and add missing indexes to support common filters (e.g., user_id columns).

```
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON public.wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
```

Notes
- Do not grant table privileges to `anon`. RLS remains enforced, but least privilege reduces risk.
- Prefer minimal GRANTs to `authenticated`, aligned with the RLS policies.


#!/bin/bash
# Migration Verification Script
# Run this after applying migrations to verify success.
#
# Checks HTTP status codes only -- never greps response bodies for a
# column/table name, because PostgREST's own "does not exist" error
# messages echo that name back, which previously produced false "exists"
# positives on missing columns.

SUPABASE_URL="${SUPABASE_URL:-https://mxtsdgkwzjzlttpotole.supabase.co}"
API_KEY="${SUPABASE_SERVICE_ROLE_KEY:-${SUPABASE_SERVICE_KEY}}"

if [ -z "$API_KEY" ]; then
  echo "❌ SUPABASE_SERVICE_ROLE_KEY is not set. Source .env first."
  exit 1
fi

echo "🔍 POST-MIGRATION VERIFICATION"
echo "==============================="
echo ""

check_column() {
  local table="$1" column="$2"
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" \
    -X GET "${SUPABASE_URL}/rest/v1/${table}?select=${column}&limit=1" \
    -H "apikey: ${API_KEY}" -H "Authorization: Bearer ${API_KEY}")
  if [ "$code" = "200" ]; then
    echo "   ✅ ${table}.${column}"
  else
    echo "   ❌ ${table}.${column} (HTTP $code)"
  fi
}

check_table_readable() {
  local table="$1"
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" \
    -X GET "${SUPABASE_URL}/rest/v1/${table}?select=*&limit=1" \
    -H "apikey: ${API_KEY}" -H "Authorization: Bearer ${API_KEY}")
  if [ "$code" = "200" ]; then
    echo "   ✅ ${table} readable"
  else
    echo "   ❌ ${table} (HTTP $code)"
  fi
}

echo "1. profiles columns (known gaps -- tracked in issue #88):"
check_column "profiles" "default_currency"
check_column "profiles" "language"

echo ""
echo "2. app_vortexcore facade views (fixed 2026-08-16, issue #89 emergency substep):"
check_table_readable "vortex_wallets"
check_table_readable "vortex_transactions"
check_table_readable "vortex_settings"

echo ""
echo "3. legacy public base tables (unmigrated -- tracked in t_eed189f3):"
check_table_readable "wallets"
check_table_readable "transactions"
check_table_readable "stripe_customers"
check_table_readable "stripe_subscriptions"

echo ""
echo "4. RLS cross-user isolation: NOT covered by this script."
echo "   Requires two distinct authenticated user JWTs -- see acceptance"
echo "   criteria on issue #89 / #97 for the real test."

echo ""
echo "✅ Verification complete (status-code based, no body-text matching)."

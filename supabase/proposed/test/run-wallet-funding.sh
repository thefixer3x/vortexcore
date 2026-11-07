#!/usr/bin/env bash
# Tests 2026-11-07-wallet-funding.sql and its rollback against throwaway local
# databases built from the live definitions (wallet-fixture.sql).
# Usage: PGHOST=... PGPORT=... PGUSER=postgres supabase/proposed/test/run-wallet-funding.sh
# Never point this at a real project: it creates and drops scratch databases.
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
proposed="$here/.."
db="wallet_funding_$$"; fresh="wallet_funding_fresh_$$"
trap 'dropdb --if-exists "$db"; dropdb --if-exists "$fresh"' EXIT
q() { psql -X -q -v ON_ERROR_STOP=1 "$@"; }

createdb "$db"
q -d "$db" -f "$here/wallet-fixture.sql" >/dev/null
q -d "$db" -f "$proposed/2026-11-07-wallet-funding.sql"
q -d "$db" -tA -f "$here/wallet-checks.sql" | grep -vE '^(set_config|\{|$)' | grep -vE '^\{"role'

# Rollback: on a database where nobody has a second-currency wallet yet, the
# rollback must restore the original constraints and drop the new objects.
snapshot() {
  q -d "$1" -tA -c "
    select conname||' '||pg_get_constraintdef(oid) from pg_constraint
      where conrelid = 'app_vortexcore.vortex_wallets'::regclass order by 1;
    select count(*) from pg_class where relname = 'vortex_payment_methods';
    select count(*) from pg_proc where proname = 'vortex_credit_wallet_topup';"
}
createdb "$fresh"
q -d "$fresh" -f "$here/wallet-fixture.sql" >/dev/null
before="$(snapshot "$fresh")"
q -d "$fresh" -f "$proposed/2026-11-07-wallet-funding.sql"
q -d "$fresh" -f "$proposed/2026-11-07-wallet-funding.rollback.sql"
after="$(snapshot "$fresh")"
if [ "$before" = "$after" ]; then echo "ROLLBACK RESTORES ORIGINAL STATE"; else
  echo "ROLLBACK DIFFERS:"; diff <(echo "$before") <(echo "$after") || true; exit 1; fi

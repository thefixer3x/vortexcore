#!/usr/bin/env bash
# Tests 2026-11-07-control-room-lockdown.sql against a throwaway local database
# built from the live definitions (fixture.sql).
# Usage: PGHOST=... PGPORT=... PGUSER=postgres supabase/proposed/test/run.sh
# Never point this at a real project: it creates and drops scratch databases.
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
proposed="$here/.."
fail=0
dbs=()
cleanup() { for d in "${dbs[@]}"; do dropdb --if-exists "$d"; done; }
trap cleanup EXIT

newdb() { local d="cr_lockdown_${1}_$$"; createdb "$d"; dbs+=("$d"); psql -X -q -v ON_ERROR_STOP=1 -d "$d" -f "$here/fixture.sql" >/dev/null; echo "$d"; }
probe() { psql -X -q -tA -v ON_ERROR_STOP=1 -v role="$2" -d "$1" -f "$here/probes.sql" 2>/dev/null | grep '|'; }

# expect <db> <role> <label> <want: allowed|denied>
expect_all() {
  local db="$1" role="$2" want="$3" label="$4" line got
  while IFS= read -r line; do
    got="${line#*|}"; got="${got%%(*}"
    if [ "$got" != "$want" ]; then echo "  FAIL [$label] $role: ${line%%|*} -> ${line#*|} (want $want)"; fail=1; fi
  done < <(probe "$db" "$role")
}

echo "1. Live state today (the hole)"
# Through the view, only INSERT gets through: UPDATE/DELETE must read rows,
# and with security_invoker that read hits control_room, which the client
# roles cannot use. public.apps has no INSTEAD OF trigger, so it is blocked
# at the base table. Every RPC is callable.
live="$(newdb live)"
live_want() { case "$1" in "view insert render_services"|rpc*) echo allowed;; *) echo denied;; esac; }
for role in anon authenticated; do
  while IFS= read -r line; do
    name="${line%%|*}"; got="${line#*|}"; got="${got%%(*}"; want="$(live_want "$name")"
    if [ "$got" != "$want" ]; then echo "  FAIL [live] $role: $name -> ${line#*|} (want $want)"; fail=1; fi
  done < <(probe "$live" "$role")
done
[ $fail = 0 ] && echo "  confirmed: anon and authenticated can insert render_services rows and call every control-room RPC (delete, read all apps)"

echo "2. PR #128 section 3 as written (revokes from anon/authenticated only)"
pr="$(newdb pr)"
psql -X -q -v ON_ERROR_STOP=1 -d "$pr" <<'SQL'
revoke insert, update, delete on table public.render_services, public.apps from anon, authenticated;
revoke execute on function public.create_control_room_app(text,text,text,text,text,text,text,text,text,jsonb),
  public.update_control_room_app(text,jsonb), public.delete_control_room_app(text,boolean),
  public.get_control_room_app(text), public.get_control_room_apps(text,text) from anon, authenticated;
SQL
pr_rpc_open="$(probe "$pr" anon | grep '^rpc delete_control_room_app|allowed' || true)"
if [ -n "$pr_rpc_open" ]; then echo "  confirmed: anon can still call delete_control_room_app (EXECUTE via PUBLIC)"; else echo "  unexpected: PR version closed the RPC path"; fi

echo "3. Proposed lockdown"
fixed="$(newdb fixed)"
psql -X -q -v ON_ERROR_STOP=1 -d "$fixed" -f "$proposed/2026-11-07-control-room-lockdown.sql"
before_fail=$fail
expect_all "$fixed" anon denied "fixed"
expect_all "$fixed" authenticated denied "fixed"
expect_all "$fixed" service_role allowed "fixed"
[ $fail = $before_fail ] && echo "  anon and authenticated denied on every probe; service_role still allowed"

echo "4. Rollback restores the exact previous grants"
snapshot() {
  psql -X -q -tA -d "$1" -c "
    select p.proname||'|'||(select string_agg(a::text, ',' order by a::text) from unnest(p.proacl) a)
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and (p.proname like '%control_room_app%' or p.proname like 'render_services_%' or p.proname like 'projects_%')
      order by 1;
    select c.relname||'|'||(select string_agg(a::text, ',' order by a::text) from unnest(c.relacl) a)
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relname in ('apps','render_services','projects','vortex_cockpit_projects')
      order by 1;"
}
fresh="$(newdb fresh)"
psql -X -q -v ON_ERROR_STOP=1 -d "$fixed" -f "$proposed/2026-11-07-control-room-lockdown.rollback.sql"
if [ "$(snapshot "$fresh")" = "$(snapshot "$fixed")" ]; then echo "  ROLLBACK RESTORES ORIGINAL STATE"; else
  echo "  ROLLBACK DIFFERS:"; diff <(snapshot "$fresh") <(snapshot "$fixed") || true; fail=1; fi

if [ $fail = 0 ]; then echo "ALL CHECKS PASSED"; else echo "CHECKS FAILED"; exit 1; fi

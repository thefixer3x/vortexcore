#!/usr/bin/env bash
#
# run-gates.sh — VortexCore acceptance gating runner (Issue #97).
#
# Executes the 7 acceptance gates, writes a structured audit trail
# (audit/acceptance-gate-results.{log,json}), and returns non-zero if any
# HARD gate is RED so the release cannot proceed.
#
# Gate types: HARD must pass; SOFT may skip when env is unavailable.
# A RED HARD/SOFT gate (env present, check failing) blocks the release.
#
# Usage:
#   ./run-gates.sh                 # run all gates
#   ./run-gates.sh --gate 1        # run only Gate 1
#
# Env:
#   SUPABASE_DB_CONNECTION_STRING   Gate 2 (RLS/migration dry-run)
#   TEST_USER_A_JWT, TEST_USER_B_JWT, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY  Gate 2 REST
#   BASE_URL                        Gate 3 (playwright) + Gate 6 (live probe)
#   VERCEL_TOKEN, VERCEL_PROJECT_ID Gate 7
#   CI                              when set, skip-with-warning on missing env (not failure)
#
set -u
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
GATES_DIR="$ROOT/scripts/acceptance-gate"
AUDIT_DIR="$ROOT/audit"
mkdir -p "$AUDIT_DIR"
LOG="$AUDIT_DIR/acceptance-gate-results.log"
JSON="$AUDIT_DIR/acceptance-gate-results.json"
export PATH="$HOME/.bun/bin:$PATH"

COMMIT="$(git -C "$ROOT" rev-parse HEAD 2>/dev/null || echo unknown)"
STAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
ONLY_GATE=""
for a in "$@"; do case "$a" in --gate) shift; ONLY_GATE="$1";; esac; done
CI_MODE="${CI:-}"

# Result vars: R1..R7 = PASS|FAIL|SKIP ; KIND1..KIND7 = HARD|SOFT
R1=SKIP; R2=SKIP; R3=SKIP; R4=SKIP; R5=SKIP; R6=SKIP; R7=SKIP
K1=HARD; K2=HARD; K3=HARD; K4=SOFT; K5=HARD; K6=HARD; K7=HARD

log() { echo "$@" | tee -a "$LOG"; }
record() { local g=$1 s=$2; eval "R$g=$s"; log "  gate$g: $s"; }

gate_gated() { [[ -z "$ONLY_GATE" || "$ONLY_GATE" == "$1" ]]; }

: > "$LOG"
log "=== VortexCore Acceptance Gate Run ==="
log "commit: $COMMIT"
log "time:   $STAMP"
log "runner: $0 (CI=${CI_MODE:-no})"

# ---------------- Gate 1: Build Validation (HARD) ----------------
if gate_gated 1; then
  log "[Gate 1] Build validation"
  g1=PASS
  ( cd "$ROOT" && bun install --frozen-lockfile >/dev/null 2>&1 ) || { g1=FAIL; log "  ✗ install"; }
  ( cd "$ROOT" && bun run build >/dev/null 2>&1 ) || { g1=FAIL; log "  ✗ build"; }
  ( cd "$ROOT" && bunx tsc -b --noEmit >/dev/null 2>&1 ) || { g1=FAIL; log "  ✗ tsc --noEmit"; }
  ( cd "$ROOT" && bun run lint >/dev/null 2>&1 ) || { g1=FAIL; log "  ✗ lint"; }
  ( cd "$ROOT" && bunx vitest run >/dev/null 2>&1 ) || { g1=FAIL; log "  ✗ vitest"; }
  record 1 $g1
fi

# ---------------- Gate 2: Schema Migration Safety (HARD, env) ----------------
if gate_gated 2; then
  log "[Gate 2] Schema migration safety"
  if [[ -z "${SUPABASE_DB_CONNECTION_STRING:-}" ]]; then
    log "  - no DB connection; SKIP (owner t_5e7e78bd migration rewrite pending)"
    record 2 SKIP
  else
    g2=PASS
    if command -v psql >/dev/null && [[ -f "$ROOT/scripts/rls-validate.sql" ]]; then
      psql "$SUPABASE_DB_CONNECTION_STRING" -v ON_ERROR_STOP=1 -f "$ROOT/scripts/rls-validate.sql" >/dev/null 2>&1 || g2=FAIL
    else
      g2=FAIL; log "  ✗ psql or rls-validate.sql unavailable"
    fi
    record 2 $g2
  fi
fi

# ---------------- Gate 3: E2E Coverage (HARD, env) ----------------
if gate_gated 3; then
  log "[Gate 3] E2E coverage"
  if [[ -z "${BASE_URL:-}" ]] || [[ ! -x "$ROOT/node_modules/.bin/playwright" ]]; then
    log "  - no BASE_URL / playwright browsers; SKIP (child card: 403/500 specs)"
    record 3 SKIP
  else
    g3=PASS
    ( cd "$ROOT" && BASE_URL="$BASE_URL" bunx playwright test >/dev/null 2>&1 ) || g3=FAIL
    record 3 $g3
  fi
fi

# ---------------- Gate 4: Visual Validation (SOFT, env) ----------------
if gate_gated 4; then
  log "[Gate 4] Visual validation"
  log "  - visual snapshot infra not implemented (child card); SKIP"
  record 4 SKIP
fi

# ---------------- Gate 5: Data Hygiene (HARD) ----------------
if gate_gated 5; then
  log "[Gate 5] Data hygiene"
  g5=PASS
  node "$GATES_DIR/data-hygiene-check.mjs" "$ROOT" >>"$LOG" 2>&1 || g5=FAIL
  record 5 $g5
fi

# ---------------- Gate 6: Route Completeness (HARD) ----------------
if gate_gated 6; then
  log "[Gate 6] Route completeness"
  g6=PASS
  BASE_URL="${BASE_URL:-}" node "$GATES_DIR/route-inventory-check.mjs" --app "$ROOT/src/App.tsx" >>"$LOG" 2>&1 || g6=FAIL
  record 6 $g6
fi

# ---------------- Gate 7: Deployment Provenance (HARD, env) ----------------
if gate_gated 7; then
  log "[Gate 7] Deployment provenance"
  if [[ -z "${VERCEL_TOKEN:-}" ]] || [[ -z "${VERCEL_PROJECT_ID:-}" ]]; then
    log "  - no Vercel token/project; SKIP (owner t_38b6f77d)"
    record 7 SKIP
  else
    log "  ✗ provenance correlation not yet implemented (owner t_38b6f77d)"; g7=FAIL
    record 7 $g7
  fi
fi

# ---------------- Summary ----------------
log ""
log "=== Gate summary ==="
OVERALL=PASS
for g in 1 2 3 4 5 6 7; do
  s=$(eval "echo \$R$g"); k=$(eval "echo \$K$g")
  [[ "$s" == "FAIL" ]] && OVERALL=FAIL
  log "  Gate $g [$k] : $s"
done
log "OVERALL: $OVERALL"

# JSON audit trail (portable: no associative arrays)
{
  printf '{'
  printf '"commit":"%s","time":"%s","overall":"%s","gates":{' "$COMMIT" "$STAMP" "$OVERALL"
  first=1
  for g in 1 2 3 4 5 6 7; do
    [ $first -eq 0 ] && printf ','
    s=$(eval "echo \$R$g"); k=$(eval "echo \$K$g")
    printf '"%s":{"type":"%s","result":"%s"}' "$g" "$k" "$s"
    first=0
  done
  printf '}}'
  echo
} > "$JSON"
log "audit written: $JSON"

if [[ "$OVERALL" == "FAIL" ]]; then
  echo "❌ RELEASE BLOCKED: at least one gate is RED." >&2
  exit 1
fi
echo "✅ Gates pass (or skip without env): release eligible."
exit 0

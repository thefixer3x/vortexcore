#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   PROJECT_REF=mxtsdg... REPO=thefixer3x/vortexcore ./scripts/verify-secrets.sh

echo "== Verifying Supabase secrets and functions =="
if ! command -v supabase >/dev/null 2>&1; then
  echo "supabase CLI not found. Install: https://supabase.com/docs/guides/cli" >&2
  exit 1
fi

: "${PROJECT_REF:?Set PROJECT_REF to your Supabase project ref}"

supabase link --project-ref "$PROJECT_REF" >/dev/null
echo "-- Supabase secrets --"
supabase secrets list || true
echo
echo "-- Supabase functions --"
supabase functions list || true

echo
echo "== Verifying Vercel envs (frontend) =="
if command -v vercel >/dev/null 2>&1; then
  vercel env ls || echo "Vercel CLI is authenticated but env listing failed; ensure you're in the linked project directory."
else
  echo "Vercel CLI not found. Install: https://vercel.com/docs/cli" >&2
fi

echo
echo "== Verifying GitHub secrets/variables (requires gh CLI) =="
if command -v gh >/dev/null 2>&1; then
  if [ -n "${REPO:-}" ]; then
    echo "-- GitHub Actions Secrets --"
    gh secret list --repo "$REPO" || true
    echo "-- GitHub Actions Variables --"
    gh variable list --repo "$REPO" || true
  else
    echo "Set REPO=owner/name to list secrets and variables. Skipping."
  fi
else
  echo "gh CLI not found. Install: https://cli.github.com/" >&2
fi

echo
echo "== Recommended Frontend envs on Vercel =="
cat <<EOF
Required for frontend:
  VITE_SUPABASE_URL
  VITE_SUPABASE_ANON_KEY

Optional (build-time):
  VITE_API_URL (if used by your app)

Edge functions secrets should be stored in Supabase (not Vercel):
  OPENAI_API_KEY, GEMINI_API_KEY, PERPLEXITY_API_KEY
  STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET
  SUPABASE_SERVICE_ROLE_KEY (server-side only)
  ALLOWED_ORIGINS (comma-separated) for middleware origin reflection
EOF

echo
echo "== Dry-run build & tests =="
if command -v bun >/dev/null 2>&1; then
  bun install
  bun test || true
else
  echo "Bun is not installed. Install: https://bun.sh" >&2
fi

if command -v vercel >/dev/null 2>&1; then
  vercel build || true
  vercel env ls || true
  echo "You can run: vercel dev (to test locally)"
fi

echo "Done."


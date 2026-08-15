#!/usr/bin/env bash
# load-gcloud-secrets.sh — Download all VortexCore secrets from Google Cloud
# Secrets Manager and write them to .env, .env.local, or stdout.
#
# Usage:
#   ./scripts/load-gcloud-secrets.sh              # Print .env to stdout
#   ./scripts/load-gcloud-secrets.sh --local       # Write to .env.local
#   ./scripts/load-gcloud-secrets.sh --overwrite    # Overwrite existing .env
#   ./scripts/load-gcloud-secrets.sh --secret <name>  # Print single secret value
#
# Project: lanonasis-knowledge-poc
# Requires: gcloud authenticated with secretmanager.secretAccessor role

set -euo pipefail

PROJECT="lanonasis-knowledge-poc"
OUTPUT_FILE=".env"
MODE="stdout"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --local)
      OUTPUT_FILE=".env.local"
      MODE="file"
      shift
      ;;
    --overwrite)
      OUTPUT_FILE=".env"
      MODE="overwrite"
      shift
      ;;
    --secret)
      SECRET_NAME="$2"
      gcloud secrets versions access latest \
        --secret="$SECRET_NAME" \
        --project="$PROJECT"
      exit 0
      ;;
    --help|-h)
      echo "Usage: $0 [--local|--overwrite|--secret <name>]"
      exit 0
      ;;
    *)
      echo "Unknown argument: $1"
      exit 1
      ;;
  esac
done

# Check for existing .env before overwriting
if [[ "$MODE" == "overwrite" && -f "$OUTPUT_FILE" ]]; then
  echo "⚠️  $OUTPUT_FILE exists. Use --local for a separate file, or --overwrite to replace."
  echo "If you're rotating secrets, this will overwrite the current file."
  read -p "Continue? [y/N] " confirm
  if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
  fi
fi

# Map of GCP secret names → .env key names
declare -A SECRET_MAP=(
  ["vortexcore_postgres_password"]="POSTGRES_PASSWORD"
  ["vortexcore_readonly_password"]="READONLY_PASSWORD"
  ["vortexcore_redis_password"]="REDIS_PASSWORD"
  ["vortexcore_kong_pg_password"]="KONG_PG_PASSWORD"
  ["vortexcore_gf_security_admin_password"]="GF_SECURITY_ADMIN_PASSWORD"
  ["vortexcore_supabase_url"]="VITE_SUPABASE_URL"
  ["vortexcore_supabase_anon_key"]="VITE_SUPABASE_ANON_KEY"
  ["vortexcore_supabase_service_role_key"]="SUPABASE_SERVICE_ROLE_KEY"
  ["vortexcore_openai_api_key"]="OPENAI_API_KEY"
  ["vortexcore_gemini_api_key"]="GEMINI_API_KEY"
  ["vortexcore_perplexity_api_key"]="PERPLEXITY_API_KEY"
  ["vortexcore_stripe_publishable_key"]="STRIPE_PUBLISHABLE_KEY"
  ["vortexcore_stripe_secret_key"]="STRIPE_SECRET_KEY"
  ["vortexcore_stripe_webhook_secret"]="STRIPE_WEBHOOK_SECRET"
  ["vortexcore_stripe_connect"]="STRIPE_CONNECT"
  ["vortexcore_sayswitch_secret_key"]="SAYSWITCH_SECRET_KEY"
  ["vortexcore_sayswitch_publishable_key"]="SAYSWITCH_PUBLISHABLE_KEY"
  ["vortexcore_edoc_sk"]="EDOC_SK"
  ["vortexcore_edoc_pk"]="EDOC_PK"
  ["vortexcore_edoc_client_id"]="EDOC_CLIENT_ID"
  ["vortexcore_prembly_secret_key"]="PREMBLY_SECRET_KEY"
  ["vortexcore_prembly_public_key"]="PREMBLY_PUBLIC_KEY"
  ["vortexcore_auth_database_url"]="DATABASE_URL"
  ["vortexcore_auth_redis_url"]="REDIS_URL"
  ["vortexcore_auth_jwt_secret"]="JWT_SECRET"
  ["vortexcore_auth_jwt_refresh_secret"]="JWT_REFRESH_SECRET"
  ["vortexcore_auth_smtp_pass"]="SMTP_PASS"
)

# Print header
echo "# VortexCore Environment Configuration"
echo "# Auto-generated from Google Cloud Secrets Manager"
echo "# Project: $PROJECT"
echo "# Generated: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo "# Secret count: ${#SECRET_MAP[@]}"
echo ""

# Fetch and print each secret
for secret_name in "${!SECRET_MAP[@]}"; do
  env_key="${SECRET_MAP[$secret_name]}"
  value=$(gcloud secrets versions access latest \
    --secret="$secret_name" \
    --project="$PROJECT" \
    2>/dev/null) || {
    echo "WARNING: Could not read secret '$secret_name'" >&2
    continue
  }
  echo "${env_key}=${value}"
done
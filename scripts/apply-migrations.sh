#!/bin/bash
# Migration Application Script
# Applies both currency and wallets/transactions migrations to Supabase

set -e

PROJECT_REF="mxtsdgkwzjzlttpotole"
MIGRATION_DIR="supabase/migrations"

echo "🚀 SUPABASE MIGRATION APPLICATION"
echo "=================================="
echo ""
echo "Project: $PROJECT_REF"
echo "Migrations to apply:"
echo "  1. 20251122_add_currency_language_to_profiles.sql"
echo "  2. 20251122_create_wallets_transactions_tables.sql"
echo ""

# Check if we have database connection string
if [ -z "$SUPABASE_DB_URL" ] && [ -z "$DATABASE_URL" ]; then
  echo "⚠️  No database connection string found in environment."
  echo ""
  echo "📋 OPTION 1: Apply via Supabase Dashboard (EASIEST)"
  echo "==========================================="
  echo ""
  echo "1. Go to: https://supabase.com/dashboard/project/$PROJECT_REF/sql"
  echo "2. Copy and paste the SQL from each migration file:"
  echo ""
  echo "   First migration:"
  cat "$MIGRATION_DIR/20251122_add_currency_language_to_profiles.sql"
  echo ""
  echo "   Click 'Run' and wait for success message"
  echo ""
  echo "   Second migration:"
  cat "$MIGRATION_DIR/20251122_create_wallets_transactions_tables.sql"
  echo ""
  echo "   Click 'Run' and wait for success message"
  echo ""
  echo "3. Verify by running:"
  echo "   SELECT table_name FROM information_schema.tables"
  echo "   WHERE table_schema = 'public' AND table_name IN ('wallets', 'transactions');"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "📋 OPTION 2: Apply via psql (if you have DB password)"
  echo "====================================================="
  echo ""
  echo "If you have the database password, run:"
  echo ""
  echo "  psql \"postgresql://postgres.${PROJECT_REF}:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres\" \\"
  echo "    -f $MIGRATION_DIR/20251122_add_currency_language_to_profiles.sql"
  echo ""
  echo "  psql \"postgresql://postgres.${PROJECT_REF}:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres\" \\"
  echo "    -f $MIGRATION_DIR/20251122_create_wallets_transactions_tables.sql"
  echo ""
  echo "You can find your database password in your Supabase project settings:"
  echo "https://supabase.com/dashboard/project/$PROJECT_REF/settings/database"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "📋 OPTION 3: Set environment variable and re-run"
  echo "================================================="
  echo ""
  echo "Export your database connection string and re-run this script:"
  echo ""
  echo '  export SUPABASE_DB_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres"'
  echo "  ./scripts/apply-migrations.sh"
  echo ""
  exit 0
else
  # We have a connection string, apply migrations
  DB_URL="${SUPABASE_DB_URL:-$DATABASE_URL}"

  echo "✅ Found database connection string"
  echo ""
  echo "📝 Applying migration 1/2: Currency and language preferences..."

  psql "$DB_URL" -f "$MIGRATION_DIR/20251122_add_currency_language_to_profiles.sql"

  if [ $? -eq 0 ]; then
    echo "✅ Migration 1/2 applied successfully!"
  else
    echo "❌ Migration 1/2 failed!"
    exit 1
  fi

  echo ""
  echo "📝 Applying migration 2/2: Wallets and transactions tables..."

  psql "$DB_URL" -f "$MIGRATION_DIR/20251122_create_wallets_transactions_tables.sql"

  if [ $? -eq 0 ]; then
    echo "✅ Migration 2/2 applied successfully!"
  else
    echo "❌ Migration 2/2 failed!"
    exit 1
  fi

  echo ""
  echo "🎉 ALL MIGRATIONS APPLIED SUCCESSFULLY!"
  echo ""
  echo "📊 Verifying..."

  psql "$DB_URL" -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('wallets', 'transactions') ORDER BY table_name;"

  echo ""
  echo "✅ Verification complete! Run ./scripts/verify-migration.sh for detailed checks."
fi

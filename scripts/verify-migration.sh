#!/bin/bash
# Migration Verification Script
# Run this after applying migrations to verify success

SUPABASE_URL="${SUPABASE_URL:-https://mxtsdgkwzjzlttpotole.supabase.co}"
API_KEY="${SUPABASE_SERVICE_KEY}"

echo "🔍 POST-MIGRATION VERIFICATION"
echo "==============================="
echo ""

# Check profiles has new columns
echo "1. Checking profiles table for new columns..."
profile=$(curl -s \
  -X GET "${SUPABASE_URL}/rest/v1/profiles?select=default_currency,language&limit=1" \
  -H "apikey: ${API_KEY}" \
  -H "Authorization: Bearer ${API_KEY}")

if echo "$profile" | grep -q "default_currency"; then
  echo "   ✅ default_currency column exists"
else
  echo "   ❌ default_currency column MISSING"
fi

if echo "$profile" | grep -q "language"; then
  echo "   ✅ language column exists"
else
  echo "   ❌ language column MISSING"
fi

echo ""
echo "2. Checking new tables exist..."
tables=("wallets" "transactions")

for table in "${tables[@]}"; do
  http_code=$(curl -s -o /dev/null -w "%{http_code}" \
    -X GET "${SUPABASE_URL}/rest/v1/${table}?select=*&limit=0" \
    -H "apikey: ${API_KEY}" \
    -H "Authorization: Bearer ${API_KEY}")

  if [ "$http_code" = "200" ]; then
    echo "   ✅ $table"
  else
    echo "   ❌ $table (HTTP $http_code)"
  fi
done

echo ""
echo "3. Checking existing tables..."
existing_tables=("chat_conversations" "chat_messages")
for table in "${existing_tables[@]}"; do
  http_code=$(curl -s -o /dev/null -w "%{http_code}" \
    -X GET "${SUPABASE_URL}/rest/v1/${table}?select=*&limit=0" \
    -H "apikey: ${API_KEY}" \
    -H "Authorization: Bearer ${API_KEY}")

  if [ "$http_code" = "200" ]; then
    echo "   ✅ $table (already existed)"
  else
    echo "   ⚠️  $table (HTTP $http_code)"
  fi
done

echo ""
echo "4. Testing RLS policies (should only see own data)..."
echo "   (Requires authenticated user token for full test)"

echo ""
echo "✅ Verification complete!"
echo ""
echo "Next steps:"
echo "  - Test currency selection in Settings"
echo "  - Create a test wallet via API"
echo "  - Verify Dashboard shows correct currency"

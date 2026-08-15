#!/bin/bash

# =====================================================
# Supabase-Specific Impact Analysis
# =====================================================

echo "=================================================="
echo "🔍 SUPABASE IMPACT ANALYSIS"
echo "=================================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${GREEN}[✓]${NC} $1"; }
print_error() { echo -e "${RED}[✗]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[!]${NC} $1"; }
print_info() { echo -e "${BLUE}[i]${NC} $1"; }

# Create detailed Supabase report
SUPABASE_REPORT="supabase_impact_$(date +%Y%m%d_%H%M%S).md"

cat > "$SUPABASE_REPORT" << 'EOF'
# 🔍 Supabase Impact Analysis

## Project: mxtsdgkwzjzlttpotole

EOF

print_info "Checking Supabase project status..."

# 1. Check project connectivity
echo "## 1. Project Connectivity" >> "$SUPABASE_REPORT"
supabase status >> "$SUPABASE_REPORT" 2>&1

# 2. Check auth configuration
print_info "Analyzing auth configuration..."
echo "## 2. Authentication Analysis" >> "$SUPABASE_REPORT"

# Check auth users
echo "### Current Users" >> "$SUPABASE_REPORT"
supabase db remote query "
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) as confirmed_users,
  COUNT(CASE WHEN email_confirmed_at IS NULL THEN 1 END) as unconfirmed_users,
  MAX(created_at) as latest_user_created
FROM auth.users;
" >> "$SUPABASE_REPORT" 2>&1

# Check for recent auth activity
echo "### Recent Auth Activity" >> "$SUPABASE_REPORT"
supabase db remote query "
SELECT 
  email,
  created_at,
  email_confirmed_at,
  last_sign_in_at
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;
" >> "$SUPABASE_REPORT" 2>&1

# 3. Check database schema
print_info "Checking database schema..."
echo "## 3. Database Schema Analysis" >> "$SUPABASE_REPORT"

# Check tables we may have affected
echo "### Tables in Public Schema" >> "$SUPABASE_REPORT"
supabase db remote query "
SELECT 
  tablename,
  tableowner,
  hasindexes,
  hasrules,
  hastriggers
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
" >> "$SUPABASE_REPORT" 2>&1

# Check profiles table
echo "### Profiles Table Status" >> "$SUPABASE_REPORT"
supabase db remote query "
SELECT 
  COUNT(*) as profile_count,
  COUNT(CASE WHEN full_name IS NOT NULL THEN 1 END) as profiles_with_names,
  MAX(created_at) as latest_profile
FROM public.profiles;
" >> "$SUPABASE_REPORT" 2>&1

# Check wallets table
echo "### Wallets Table Status" >> "$SUPABASE_REPORT"
supabase db remote query "
SELECT 
  COUNT(*) as wallet_count,
  SUM(balance) as total_balance,
  COUNT(DISTINCT currency) as currencies_used,
  MAX(created_at) as latest_wallet
FROM public.wallets;
" >> "$SUPABASE_REPORT" 2>&1

# 4. Check triggers and functions
print_info "Checking triggers and functions..."
echo "## 4. Triggers and Functions" >> "$SUPABASE_REPORT"

# Check triggers
echo "### Database Triggers" >> "$SUPABASE_REPORT"
supabase db remote query "
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY trigger_name;
" >> "$SUPABASE_REPORT" 2>&1

# Check functions we may have created
echo "### Custom Functions" >> "$SUPABASE_REPORT"
supabase db remote query "
SELECT 
  proname as function_name,
  prosrc as function_source
FROM pg_proc p 
JOIN pg_namespace n ON p.pronamespace = n.oid 
WHERE n.nspname = 'public' 
AND proname LIKE '%handle%'
ORDER BY proname;
" >> "$SUPABASE_REPORT" 2>&1

# 5. Check RLS policies
print_info "Checking Row Level Security policies..."
echo "## 5. Row Level Security Policies" >> "$SUPABASE_REPORT"

supabase db remote query "
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
" >> "$SUPABASE_REPORT" 2>&1

# 6. Check Edge Functions
print_info "Checking Edge Functions..."
echo "## 6. Edge Functions Status" >> "$SUPABASE_REPORT"

supabase functions list >> "$SUPABASE_REPORT" 2>&1

# Check function logs for errors
echo "### Recent Function Logs" >> "$SUPABASE_REPORT"
if supabase functions list | grep -q "ai-router"; then
    echo "#### AI Router Function Logs:" >> "$SUPABASE_REPORT"
    supabase functions logs ai-router --limit 10 >> "$SUPABASE_REPORT" 2>&1
fi

# 7. Check secrets
print_info "Checking secrets configuration..."
echo "## 7. Secrets Configuration" >> "$SUPABASE_REPORT"

supabase secrets list >> "$SUPABASE_REPORT" 2>&1

# 8. Check for any errors in recent activity
print_info "Checking for recent errors..."
echo "## 8. Error Analysis" >> "$SUPABASE_REPORT"

# This would require access to Supabase logs, which may not be available via CLI
echo "### Note: Check Supabase Dashboard for detailed logs" >> "$SUPABASE_REPORT"
echo "https://supabase.com/dashboard/project/mxtsdgkwzjzlttpotole/logs/explorer" >> "$SUPABASE_REPORT"

# 9. Recommendations
echo "## 9. Recommendations" >> "$SUPABASE_REPORT"

cat >> "$SUPABASE_REPORT" << 'RECOMMENDATIONS'

### 🚨 Critical Checks Needed:

1. **Auth Configuration**: 
   - Verify redirect URLs in Supabase Dashboard
   - Check OAuth provider settings
   - Ensure Site URL is correct

2. **Database Integrity**:
   - Verify user profiles are being created
   - Check wallet creation triggers
   - Ensure RLS policies are working

3. **Edge Functions**:
   - Test ai-router function
   - Check function logs for errors
   - Verify API keys are set correctly

4. **Cross-Project Impact**:
   - Test if other projects can still authenticate
   - Verify central auth system is working
   - Check vanity domain functionality

### 🔧 Immediate Actions:

1. **Test Authentication Flow**:
   ```bash
   # Test local auth
   bun run dev
   # Go to http://localhost:5173/test-auth
   ```

2. **Check Production Auth**:
   ```bash
   # Test production domain
   # Go to https://me.vortexcore.app/test-auth
   ```

3. **Verify Database**:
   ```sql
   -- Check if triggers are working
   SELECT * FROM public.profiles ORDER BY created_at DESC LIMIT 5;
   SELECT * FROM public.wallets ORDER BY created_at DESC LIMIT 5;
   ```

4. **Test Edge Functions**:
   ```bash
   curl -X POST https://mxtsdgkwzjzlttpotole.supabase.co/functions/v1/ai-router \
     -H "Content-Type: application/json" \
     -d '{"message": "test"}'
   ```

RECOMMENDATIONS

print_status "Supabase analysis complete! Report: $SUPABASE_REPORT"

# Create a quick test for the most critical functions
cat > test_critical_supabase.sh << 'CRITICAL_TEST'
#!/bin/bash

echo "🧪 Critical Supabase Function Tests"
echo "=================================="

# Test 1: Database connectivity
echo "1. Testing database connectivity..."
supabase db remote query "SELECT 'Database OK' as status;" || echo "❌ Database connection failed"

# Test 2: Auth system
echo "2. Testing auth system..."
supabase db remote query "SELECT COUNT(*) as user_count FROM auth.users;" || echo "❌ Auth system access failed"

# Test 3: Profiles table
echo "3. Testing profiles table..."
supabase db remote query "SELECT COUNT(*) as profile_count FROM public.profiles;" || echo "❌ Profiles table access failed"

# Test 4: Wallets table
echo "4. Testing wallets table..."
supabase db remote query "SELECT COUNT(*) as wallet_count FROM public.wallets;" || echo "❌ Wallets table access failed"

# Test 5: Edge functions
echo "5. Testing Edge functions..."
supabase functions list || echo "❌ Edge functions access failed"

echo ""
echo "✅ Critical tests complete!"
echo "📊 Full report available in: $SUPABASE_REPORT"
CRITICAL_TEST

chmod +x test_critical_supabase.sh

print_info "Created critical test script: ./test_critical_supabase.sh"
echo ""
print_warning "NEXT STEPS:"
echo "1. Run: ./test_critical_supabase.sh"
echo "2. Review: $SUPABASE_REPORT"
echo "3. Test auth at: http://localhost:5173/test-auth"
echo "4. Check Supabase Dashboard for any alerts"

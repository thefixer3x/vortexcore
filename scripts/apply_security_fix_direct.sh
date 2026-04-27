#!/bin/bash

echo "=================================================="
echo "🚨 APPLYING CRITICAL SECURITY FIXES DIRECTLY"
echo "=================================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_error() { echo -e "${RED}[ERROR]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_info() { echo -e "${BLUE}[INFO]${NC} $1"; }

# Check if Supabase CLI is linked
print_info "Checking Supabase connection..."
supabase status > /dev/null 2>&1
if [ $? -ne 0 ]; then
  print_warning "Supabase not linked. Linking now..."
  supabase link --project-ref mxtsdgkwzjzlttpotole
fi

# Find the SQL file
SQL_FILE=$(ls -t security_fix_*.sql 2>/dev/null | head -1)

if [ -z "$SQL_FILE" ]; then
  print_error "No security fix SQL file found!"
  print_info "Generating it now..."
  
  # Generate SQL directly
  SQL_FILE="security_fix_direct.sql"
  cat > "$SQL_FILE" << 'EOF'
-- =====================================================
-- CRITICAL SECURITY FIX - Enable RLS on Exposed Tables
-- =====================================================

-- Enable RLS on exposed tables (if not already enabled)
DO $$
BEGIN
  -- Enable RLS on critical tables
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'users' AND rowsecurity = true
  ) THEN
    ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'topics' AND rowsecurity = true
  ) THEN
    ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'simple_users' AND rowsecurity = true
  ) THEN
    ALTER TABLE public.simple_users ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'oauth_sessions' AND rowsecurity = true
  ) THEN
    ALTER TABLE public.oauth_sessions ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'vendor_key_audit_log' AND rowsecurity = true
  ) THEN
    ALTER TABLE public.vendor_key_audit_log ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create basic RLS policies (if they don't exist)

-- Users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'Users can view own profile'
  ) THEN
    CREATE POLICY "Users can view own profile" ON public.users
      FOR SELECT USING (auth.uid() = id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile" ON public.users
      FOR UPDATE USING (auth.uid() = id);
  END IF;
END $$;

-- Topics table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'topics' AND policyname = 'Anyone can view topics'
  ) THEN
    CREATE POLICY "Anyone can view topics" ON public.topics
      FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'topics' AND policyname = 'Authenticated users can create topics'
  ) THEN
    CREATE POLICY "Authenticated users can create topics" ON public.topics
      FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

-- Verify RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity,
  CASE 
    WHEN rowsecurity THEN '✅ Secured'
    ELSE '❌ EXPOSED!'
  END as status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'topics', 'simple_users', 'oauth_sessions', 'vendor_key_audit_log')
ORDER BY tablename;
EOF
  
  print_success "Generated security fix SQL: $SQL_FILE"
fi

print_info "Using SQL file: $SQL_FILE"

# Method 1: Try with direct query
print_info "Method 1: Applying security fixes via direct query..."
supabase db remote query < "$SQL_FILE" 2>/tmp/supabase_error.log

if [ $? -eq 0 ]; then
  print_success "Security fixes applied successfully!"
else
  print_warning "Direct query failed, trying alternative method..."
  
  # Method 2: Try with psql directly if available
  if [ ! -z "$POSTGRES_URL" ] || [ ! -z "$DATABASE_URL" ]; then
    print_info "Method 2: Using direct PostgreSQL connection..."
    
    DB_URL="${POSTGRES_URL:-$DATABASE_URL}"
    if [ ! -z "$DB_URL" ]; then
      psql "$DB_URL" < "$SQL_FILE" 2>/tmp/psql_error.log
      
      if [ $? -eq 0 ]; then
        print_success "Security fixes applied via psql!"
      else
        print_error "psql method also failed"
      fi
    fi
  fi
  
  # Method 3: Manual instructions
  print_warning "Automated application failed. Apply manually:"
  echo ""
  echo "📋 MANUAL STEPS:"
  echo "1. Go to Supabase Dashboard:"
  echo "   https://supabase.com/dashboard/project/mxtsdgkwzjzlttpotole/sql"
  echo ""
  echo "2. Copy and paste the SQL from: $SQL_FILE"
  echo ""
  echo "3. Click 'Run' to execute"
  echo ""
  echo "Or try this command with your password:"
  echo "supabase db remote query --db-url 'postgresql://postgres:[YOUR-PASSWORD]@db.mxtsdgkwzjzlttpotole.supabase.co:5432/postgres' < $SQL_FILE"
fi

# Verification
echo ""
print_info "Verification Steps:"
echo "1. Check Supabase Dashboard > Database > Linter"
echo "   https://supabase.com/dashboard/project/mxtsdgkwzjzlttpotole/database/linter"
echo ""
echo "2. Verify RLS is enabled:"
echo "   Go to Table Editor and check the shield icon on tables"
echo ""
echo "3. The following tables should have RLS enabled:"
echo "   ✅ public.users"
echo "   ✅ public.topics"
echo "   ✅ public.simple_users"
echo "   ✅ public.oauth_sessions"
echo "   ✅ public.vendor_key_audit_log"
echo ""

# Check errors
if [ -f /tmp/supabase_error.log ]; then
  ERROR_CONTENT=$(cat /tmp/supabase_error.log)
  if [ ! -z "$ERROR_CONTENT" ]; then
    print_error "Error details:"
    echo "$ERROR_CONTENT"
    echo ""
    print_info "This usually means you need to:"
    echo "1. Run: supabase login"
    echo "2. Run: supabase link --project-ref mxtsdgkwzjzlttpotole"
    echo "3. Try again: ./apply_security_fix_direct.sh"
  fi
fi

print_warning "REMEMBER: Also enable these in Supabase Dashboard:"
echo "🔐 Authentication > Policies > Enable 'Check passwords against HaveIBeenPwned'"
echo "🔐 Authentication > Providers > Enable MFA (TOTP, SMS)"
echo "🔐 Settings > Infrastructure > Upgrade PostgreSQL version"

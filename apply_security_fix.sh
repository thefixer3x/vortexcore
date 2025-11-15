#!/bin/bash

echo "🚨 APPLYING CRITICAL SECURITY FIXES"
echo "==================================="

# Find the latest security fix SQL file
SQL_FIX_FILE=$(ls -t security_fix_*.sql | head -1)

if [ -z "$SQL_FIX_FILE" ]; then
  echo "❌ No security fix SQL file found!"
  echo "Run ./fix-critical-security.sh first to generate the SQL file"
  exit 1
fi

echo "Using SQL file: $SQL_FIX_FILE"

# Apply the security fix
echo "1. Applying RLS and function fixes..."
supabase db remote query < "$SQL_FIX_FILE"

if [ $? -eq 0 ]; then
  echo "✅ Security fixes applied successfully!"
else
  echo "❌ Error applying security fixes. Please check the SQL and try again."
  exit 1
fi

echo ""
echo "2. Verifying RLS is enabled..."
supabase db remote query "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('users', 'topics', 'simple_users', 'oauth_sessions', 'vendor_key_audit_log');"

echo ""
echo "3. Auth security recommendations:"
echo "   - Enable leaked password protection in Supabase Dashboard"
echo "   - Enable MFA options (TOTP, SMS)"
echo "   - Update PostgreSQL version for security patches"

echo ""
echo "✅ Critical security issues addressed!"
echo "📋 Check Supabase Dashboard > Database > Linter to verify"
'APPLY_SCRIPT

chmod +x apply_security_fix.sh

# Create auth configuration update
cat > update_auth_security.md << 'AUTH_MD'
# 🔐 Auth Security Configuration

## Manual Steps Required in Supabase Dashboard:

### 1. Enable Leaked Password Protection
- Go to: Authentication > Policies
- Enable "Check passwords against HaveIBeenPwned"
- This prevents use of compromised passwords

### 2. Enable Multi-Factor Authentication
- Go to: Authentication > Providers
- Enable at least 2 MFA methods:
  - TOTP (Time-based One-Time Passwords)
  - SMS verification

### 3. Update PostgreSQL Version
- Current: supabase-postgres-15.8.1.085 (has vulnerabilities)
- Go to: Settings > Infrastructure
- Upgrade to latest Postgres 15.x version

### 4. Review These Tables for Additional Policies:
- credit.applications (RLS enabled but no policies)
- credit.bids (RLS enabled but no policies)
- credit.credit_scores (RLS enabled but no policies)
- credit.providers (RLS enabled but no policies)
- credit.transactions (RLS enabled but no policies)
- public.memory_entries (RLS enabled but no policies)
- public.organizations (RLS enabled but no policies)
- public.vendor_api_keys (RLS enabled but no policies)
AUTH_MD

print_error "IMMEDIATE ACTION REQUIRED!"
echo ""
echo "🚨 SECURITY STATUS:"
echo "   5 CRITICAL ERRORS - Tables exposed without RLS"
echo "   8 WARNINGS - Functions with mutable search paths"
echo "   3 AUTH WARNINGS - Password & MFA protection needed"
echo ""
echo "🔧 TO FIX NOW:"
echo "   1. Run: ./apply_security_fix.sh"
echo "   2. Review: $SQL_FIX_FILE"
echo "   3. Check: update_auth_security.md for manual steps"
echo ""
print_warning "Fix these BEFORE dealing with environment variables!"

# Create a comprehensive report
SECURITY_REPORT="security_analysis_$(date +%Y%m%d_%H%M%S).md"

cat > "$SECURITY_REPORT" << 'REPORT'
# 🚨 Critical Security Analysis Report

## Executive Summary
Your Supabase project has **5 CRITICAL security vulnerabilities** that expose data to unauthorized access.

## Critical Issues (MUST FIX NOW)

### 1. Tables Without RLS (Row Level Security)
These tables are PUBLIC but have NO access control:
- `public.users` - User data exposed!
- `public.topics` - All topics visible!
- `public.simple_users` - User info exposed!
- `public.oauth_sessions` - OAuth tokens exposed!
- `public.vendor_key_audit_log` - Audit logs exposed!

**Risk Level: CRITICAL** 
**Impact: Data breach, unauthorized access, compliance violations**

### 2. Functions with Mutable Search Paths
8 functions have security vulnerabilities:
- Can be exploited for privilege escalation
- SQL injection risks
- Bypass security controls

### 3. Auth Security Gaps
- No leaked password protection
- Insufficient MFA options
- Outdated PostgreSQL with known vulnerabilities

## Immediate Actions Required

1. **Run Security Fix** (2 minutes)
   ```bash
   ./apply_security_fix.sh
   ```

2. **Manual Dashboard Updates** (5 minutes)
   - Enable leaked password protection
   - Enable MFA options
   - Schedule PostgreSQL upgrade

3. **Review Additional Tables** (10 minutes)
   - 8 tables have RLS enabled but no policies
   - Need to add appropriate policies based on business logic

## Business Impact if Not Fixed

- **Data Breach Risk**: All user data is currently accessible
- **Compliance Issues**: GDPR, CCPA violations possible
- **Financial Impact**: Potential lawsuits and fines
- **Reputation Damage**: Loss of user trust

## Timeline
- **NOW**: Apply critical RLS fixes
- **Today**: Enable auth security features
- **This Week**: Add policies to remaining tables
- **This Month**: Upgrade PostgreSQL

REPORT

print_success "Security analysis complete!"
echo "📊 Reports generated:"
echo "   - $SECURITY_REPORT (full analysis)"
echo "   - $SQL_FIX_FILE (SQL commands)"
echo "   - update_auth_security.md (manual steps)"
echo "   - apply_security_fix.sh (execution script)"

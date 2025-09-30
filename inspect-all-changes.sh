#!/bin/bash

# =====================================================
# Comprehensive Impact Analysis of Our Changes
# =====================================================

echo "=================================================="
echo "🔍 COMPREHENSIVE CHANGE IMPACT ANALYSIS"
echo "=================================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

print_status() { echo -e "${GREEN}[✓]${NC} $1"; }
print_error() { echo -e "${RED}[✗]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[!]${NC} $1"; }
print_info() { echo -e "${BLUE}[i]${NC} $1"; }
print_section() { echo -e "${PURPLE}[§]${NC} $1"; }

# Create analysis report
REPORT_FILE="change_impact_analysis_$(date +%Y%m%d_%H%M%S).md"

cat > "$REPORT_FILE" << 'EOF'
# 🔍 Change Impact Analysis Report

## Summary
This report analyzes all potential impacts of our VortexCore deployment changes.

EOF

print_section "1. SUPABASE PROJECT ANALYSIS"
echo "## 1. Supabase Project Analysis" >> "$REPORT_FILE"

# Check Supabase project status
print_info "Checking Supabase project configuration..."
if command -v supabase &> /dev/null; then
    echo "### Project Status" >> "$REPORT_FILE"
    supabase status >> "$REPORT_FILE" 2>&1
    
    # Check if we can query the database
    print_info "Testing database connectivity..."
    echo "### Database Connectivity Test" >> "$REPORT_FILE"
    supabase db remote query "SELECT 'Database connection working' as status;" >> "$REPORT_FILE" 2>&1
    
    # Check Edge Functions
    print_info "Checking Edge Functions..."
    echo "### Edge Functions Status" >> "$REPORT_FILE"
    supabase functions list >> "$REPORT_FILE" 2>&1
    
    # Check secrets (without revealing values)
    print_info "Checking secrets configuration..."
    echo "### Secrets Configuration" >> "$REPORT_FILE"
    supabase secrets list >> "$REPORT_FILE" 2>&1
    
else
    print_error "Supabase CLI not available"
    echo "❌ Supabase CLI not available" >> "$REPORT_FILE"
fi

print_section "2. AUTHENTICATION CONFIGURATION ANALYSIS"
echo "## 2. Authentication Configuration Analysis" >> "$REPORT_FILE"

# Check auth-related files we modified
print_info "Analyzing auth configuration files..."
echo "### Modified Auth Files" >> "$REPORT_FILE"

AUTH_FILES=(
    "src/utils/auth-config.ts"
    "src/hooks/use-auth-fix.ts"
    "src/pages/TestAuth.tsx"
    "supabase/config.toml"
)

for file in "${AUTH_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "#### $file" >> "$REPORT_FILE"
        echo "✅ File exists" >> "$REPORT_FILE"
        echo "\`\`\`typescript" >> "$REPORT_FILE"
        head -20 "$file" >> "$REPORT_FILE"
        echo "\`\`\`" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
    else
        echo "❌ $file - File not found" >> "$REPORT_FILE"
    fi
done

print_section "3. ENVIRONMENT VARIABLES ANALYSIS"
echo "## 3. Environment Variables Analysis" >> "$REPORT_FILE"

print_info "Checking environment variables..."
echo "### Local Environment (.env)" >> "$REPORT_FILE"

if [ -f ".env" ]; then
    echo "#### Current .env contents (sanitized):" >> "$REPORT_FILE"
    # Show env vars but hide sensitive values
    cat .env | sed 's/=.*/=***HIDDEN***/' >> "$REPORT_FILE"
    
    # Check for our additions
    echo "#### Variables we may have added:" >> "$REPORT_FILE"
    grep -E "(VITE_PRODUCTION_URL|VITE_CUSTOM_DOMAIN|VITE_CENTRAL_AUTH)" .env >> "$REPORT_FILE" 2>/dev/null || echo "No custom variables found" >> "$REPORT_FILE"
else
    echo "❌ .env file not found" >> "$REPORT_FILE"
fi

# Check for .env backups
echo "#### Environment Backups:" >> "$REPORT_FILE"
ls -la .env.backup* 2>/dev/null >> "$REPORT_FILE" || echo "No .env backups found" >> "$REPORT_FILE"

print_section "4. DEPLOYMENT CONFIGURATION ANALYSIS"
echo "## 4. Deployment Configuration Analysis" >> "$REPORT_FILE"

# Check Vercel configuration
print_info "Checking Vercel configuration..."
echo "### Vercel Configuration" >> "$REPORT_FILE"

if command -v vercel &> /dev/null; then
    echo "#### Project Status:" >> "$REPORT_FILE"
    vercel ls >> "$REPORT_FILE" 2>&1
    
    echo "#### Domain Status:" >> "$REPORT_FILE"
    vercel domains ls >> "$REPORT_FILE" 2>&1
    
    # Check if vercel.json exists
    if [ -f "vercel.json" ]; then
        echo "#### vercel.json:" >> "$REPORT_FILE"
        echo "\`\`\`json" >> "$REPORT_FILE"
        cat vercel.json >> "$REPORT_FILE"
        echo "\`\`\`" >> "$REPORT_FILE"
    fi
else
    echo "❌ Vercel CLI not available" >> "$REPORT_FILE"
fi

# Check Netlify configuration
print_info "Checking Netlify configuration..."
echo "### Netlify Configuration" >> "$REPORT_FILE"

if command -v netlify &> /dev/null; then
    echo "#### Site Status:" >> "$REPORT_FILE"
    netlify status >> "$REPORT_FILE" 2>&1
    
    echo "#### Functions:" >> "$REPORT_FILE"
    netlify functions:list >> "$REPORT_FILE" 2>&1
    
    # Check netlify.toml
    if [ -f "netlify.toml" ]; then
        echo "#### netlify.toml:" >> "$REPORT_FILE"
        echo "\`\`\`toml" >> "$REPORT_FILE"
        cat netlify.toml >> "$REPORT_FILE"
        echo "\`\`\`" >> "$REPORT_FILE"
    fi
else
    echo "❌ Netlify CLI not available" >> "$REPORT_FILE"
fi

print_section "5. DATABASE SCHEMA ANALYSIS"
echo "## 5. Database Schema Analysis" >> "$REPORT_FILE"

print_info "Checking database schema changes..."
echo "### Database Tables and Functions" >> "$REPORT_FILE"

# Check if we can access the database
if command -v supabase &> /dev/null; then
    echo "#### Tables in public schema:" >> "$REPORT_FILE"
    supabase db remote query "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;" >> "$REPORT_FILE" 2>&1
    
    echo "#### Functions in public schema:" >> "$REPORT_FILE"
    supabase db remote query "SELECT proname FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' ORDER BY proname;" >> "$REPORT_FILE" 2>&1
    
    echo "#### Auth users count:" >> "$REPORT_FILE"
    supabase db remote query "SELECT COUNT(*) as user_count FROM auth.users;" >> "$REPORT_FILE" 2>&1
    
    echo "#### Profiles table status:" >> "$REPORT_FILE"
    supabase db remote query "SELECT COUNT(*) as profile_count FROM public.profiles;" >> "$REPORT_FILE" 2>&1
    
    echo "#### Wallets table status:" >> "$REPORT_FILE"
    supabase db remote query "SELECT COUNT(*) as wallet_count FROM public.wallets;" >> "$REPORT_FILE" 2>&1
fi

print_section "6. SERVERLESS FUNCTIONS ANALYSIS"
echo "## 6. Serverless Functions Analysis" >> "$REPORT_FILE"

print_info "Checking serverless functions..."
echo "### Netlify Functions" >> "$REPORT_FILE"

if [ -d "netlify/functions" ]; then
    echo "#### Netlify Functions Directory:" >> "$REPORT_FILE"
    ls -la netlify/functions/ >> "$REPORT_FILE"
    
    for func in netlify/functions/*; do
        if [ -f "$func" ]; then
            echo "#### $(basename $func):" >> "$REPORT_FILE"
            echo "\`\`\`typescript" >> "$REPORT_FILE"
            head -10 "$func" >> "$REPORT_FILE"
            echo "\`\`\`" >> "$REPORT_FILE"
        fi
    done
else
    echo "❌ No Netlify functions directory found" >> "$REPORT_FILE"
fi

echo "### Vercel Functions" >> "$REPORT_FILE"
if [ -d "api" ]; then
    echo "#### Vercel API Directory:" >> "$REPORT_FILE"
    ls -la api/ >> "$REPORT_FILE"
    
    for func in api/*; do
        if [ -f "$func" ]; then
            echo "#### $(basename $func):" >> "$REPORT_FILE"
            echo "\`\`\`typescript" >> "$REPORT_FILE"
            head -10 "$func" >> "$REPORT_FILE"
            echo "\`\`\`" >> "$REPORT_FILE"
        fi
    done
else
    echo "❌ No Vercel API directory found" >> "$REPORT_FILE"
fi

echo "### Supabase Edge Functions" >> "$REPORT_FILE"
if [ -d "supabase/functions" ]; then
    echo "#### Supabase Functions Directory:" >> "$REPORT_FILE"
    ls -la supabase/functions/ >> "$REPORT_FILE"
    
    for func_dir in supabase/functions/*/; do
        if [ -d "$func_dir" ]; then
            func_name=$(basename "$func_dir")
            echo "#### $func_name:" >> "$REPORT_FILE"
            if [ -f "$func_dir/index.ts" ]; then
                echo "\`\`\`typescript" >> "$REPORT_FILE"
                head -15 "$func_dir/index.ts" >> "$REPORT_FILE"
                echo "\`\`\`" >> "$REPORT_FILE"
            fi
        fi
    done
else
    echo "❌ No Supabase functions directory found" >> "$REPORT_FILE"
fi

print_section "7. POTENTIAL IMPACT AREAS"
echo "## 7. Potential Impact Areas" >> "$REPORT_FILE"

print_info "Analyzing potential impact areas..."

cat >> "$REPORT_FILE" << 'IMPACT_EOF'

### 🚨 High Risk Areas We May Have Affected:

#### Authentication Flow:
- ✅ **Supabase Auth URLs**: We definitely changed these
- ✅ **OAuth Redirects**: May have been overwritten
- ⚠️ **Magic Link Redirects**: We modified these
- ⚠️ **Password Reset Flow**: We updated redirect URLs

#### Database:
- ⚠️ **User Profiles**: We added/modified triggers
- ⚠️ **Wallets Table**: We created/modified this
- ⚠️ **RLS Policies**: We may have changed these
- ❓ **Existing Functions**: May have been affected by migrations

#### Environment Variables:
- ⚠️ **Local .env**: We added production URLs
- ❓ **Vercel Environment**: May need updating
- ❓ **Netlify Environment**: May need updating
- ❓ **Supabase Secrets**: We set OpenAI/Perplexity keys

#### Serverless Functions:
- ✅ **New Netlify Functions**: We created health and ai-router-proxy
- ✅ **New Vercel Functions**: We created health endpoint
- ❓ **Existing Edge Functions**: May have been redeployed

#### Domain Configuration:
- ❓ **Custom Domain**: me.vortexcore.app serving issues
- ❓ **DNS Settings**: May need verification
- ❓ **SSL Certificates**: May need renewal

### 🔧 Recommended Immediate Checks:

1. **Test Login Flow**: Try logging in with existing credentials
2. **Check OAuth Providers**: Test Twitter/Google login
3. **Verify Custom Domain**: Ensure me.vortexcore.app works
4. **Test API Endpoints**: Check if existing APIs still work
5. **Verify Database Access**: Ensure other projects can access DB
6. **Check Cross-Project Auth**: Test if other projects still authenticate

IMPACT_EOF

print_section "8. ROLLBACK PREPARATION"
echo "## 8. Rollback Preparation" >> "$REPORT_FILE"

print_info "Preparing rollback information..."

cat >> "$REPORT_FILE" << 'ROLLBACK_EOF'

### 🔄 Rollback Strategy:

#### If Authentication Breaks:
```bash
# Restore Supabase auth settings manually in dashboard
# Site URL: https://api.lanonasis.com
# Redirect URLs: https://api.lanonasis.com/auth/callback?return_to=vortexcore
```

#### If Database Issues:
```bash
# Check for backup SQL files
ls -la backup_before_vortexcore_migration_*.sql
# Restore from backup if needed
```

#### If Environment Variables Issues:
```bash
# Restore from backup
cp .env.backup.[timestamp] .env
```

#### If Functions Break:
```bash
# Remove our functions
rm -rf netlify/functions/
rm -rf api/
# Redeploy original functions
supabase functions deploy [original-function-name]
```

ROLLBACK_EOF

print_section "9. TESTING CHECKLIST"
echo "## 9. Testing Checklist" >> "$REPORT_FILE"

cat >> "$REPORT_FILE" << 'TESTING_EOF'

### ✅ Critical Tests to Run:

#### Authentication Tests:
- [ ] Login with existing user credentials
- [ ] OAuth login (Twitter, Google, etc.)
- [ ] Magic link authentication
- [ ] Password reset flow
- [ ] Cross-project authentication

#### Database Tests:
- [ ] User profile creation
- [ ] Wallet functionality
- [ ] Existing data integrity
- [ ] Database triggers working

#### API Tests:
- [ ] Health endpoints (/health, /api/health)
- [ ] AI router functionality
- [ ] Existing API endpoints
- [ ] Cross-origin requests

#### Domain Tests:
- [ ] me.vortexcore.app serving correctly
- [ ] SSL certificate valid
- [ ] DNS resolution working
- [ ] Redirects functioning

#### Integration Tests:
- [ ] Other projects can authenticate
- [ ] Central auth system working
- [ ] Project routing via return_to parameter
- [ ] Vanity domain (lanonasis.supabase.co) working

TESTING_EOF

# Final summary
print_section "ANALYSIS COMPLETE"
echo ""
echo "📊 Analysis complete! Report saved to: $REPORT_FILE"
echo ""
print_warning "CRITICAL NEXT STEPS:"
echo "1. Review the generated report: $REPORT_FILE"
echo "2. Test authentication flow immediately"
echo "3. Verify custom domain serving"
echo "4. Check if other projects still work"
echo "5. Run the testing checklist"
echo ""
print_info "Use this command to test auth immediately:"
echo "bun run dev && open http://localhost:5173/test-auth"
echo ""

# Also create a quick test script
cat > quick_test_auth.sh << 'TEST_EOF'
#!/bin/bash
echo "🧪 Quick Authentication Test"
echo "=========================="

# Test local development
echo "1. Starting development server..."
bun run dev &
DEV_PID=$!

sleep 5

echo "2. Testing endpoints..."
curl -s http://localhost:5173/health || echo "❌ Health endpoint failed"
curl -s http://localhost:5173/api/health || echo "❌ API health endpoint failed"

echo "3. Open test page:"
echo "   http://localhost:5173/test-auth"

echo ""
echo "Press Ctrl+C to stop dev server"
wait $DEV_PID
TEST_EOF

chmod +x quick_test_auth.sh

print_status "Quick test script created: ./quick_test_auth.sh"

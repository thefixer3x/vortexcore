#!/bin/bash

# =====================================================
# Clean Vercel Environment Variables Safely
# =====================================================

echo "=================================================="
echo "🧹 CLEANING VERCEL ENVIRONMENT VARIABLES"
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

# Create backup and analysis report
CLEANUP_REPORT="vercel_env_cleanup_$(date +%Y%m%d_%H%M%S).md"

cat > "$CLEANUP_REPORT" << 'EOF'
# 🧹 Vercel Environment Variables Cleanup Report

## Current Environment Variables Analysis

EOF

print_section "1. ANALYZING CURRENT ENVIRONMENT VARIABLES"

# Get current environment variables
print_info "Fetching current Vercel environment variables..."
vercel env list >> "$CLEANUP_REPORT"

echo "" >> "$CLEANUP_REPORT"
echo "## Analysis of Conflicting Variables" >> "$CLEANUP_REPORT"
echo "" >> "$CLEANUP_REPORT"

# Analyze the conflicts
cat >> "$CLEANUP_REPORT" << 'ANALYSIS'

### 🚨 Identified Issues:

1. **Multiple Supabase URL Variables**:
   - `VITE_SUPABASE_URL` (VortexCore - correct)
   - `SUPABASE_URL` (Legacy/other project)
   - Potential `seftechub.supabase.co` references

2. **Multiple Anon Key Variables**:
   - `VITE_SUPABASE_ANON_KEY` (VortexCore - correct)
   - `SUPABASE_ANON_KEY` (Legacy/other project)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Next.js format)

3. **Database Variables**:
   - Multiple `POSTGRES_*` variables (may be from other projects)

### ✅ Correct Variables for VortexCore:
- `VITE_SUPABASE_URL=https://mxtsdgkwzjzlttpotole.supabase.co`
- `VITE_SUPABASE_ANON_KEY=REDACTED

ANALYSIS

print_section "2. SAFE CLEANUP STRATEGY"

print_warning "IMPORTANT: We'll only clean VortexCore-specific variables"
print_info "We'll leave other project variables untouched"

# Define correct VortexCore variables
CORRECT_SUPABASE_URL="https://mxtsdgkwzjzlttpotole.supabase.co"
CORRECT_ANON_KEY="REDACTED"

echo "## Cleanup Actions" >> "$CLEANUP_REPORT"
echo "" >> "$CLEANUP_REPORT"

print_info "Creating cleanup commands..."

# Create cleanup commands
cat > cleanup_commands.sh << 'CLEANUP_COMMANDS'
#!/bin/bash

echo "🧹 Executing Vercel Environment Cleanup"
echo "======================================"

# Set correct VortexCore variables
echo "1. Setting correct VITE_SUPABASE_URL..."
vercel env add VITE_SUPABASE_URL production << EOF
https://mxtsdgkwzjzlttpotole.supabase.co
EOF

echo "2. Setting correct VITE_SUPABASE_ANON_KEY..."
vercel env add VITE_SUPABASE_ANON_KEY production << EOF
REDACTED
EOF

# Note: We're NOT removing other variables as they may belong to other projects
echo "✅ VortexCore environment variables updated"
echo ""
echo "⚠️  Other project variables left untouched for safety"
echo ""
echo "📋 Manual cleanup needed for:"
echo "   - Review POSTGRES_* variables if not needed"
echo "   - Check SUPABASE_URL vs VITE_SUPABASE_URL conflicts"
echo "   - Verify NEXT_PUBLIC_* variables are needed"

CLEANUP_COMMANDS

chmod +x cleanup_commands.sh

print_section "3. VERIFICATION STRATEGY"

cat >> "$CLEANUP_REPORT" << 'VERIFICATION'

## Verification Steps

### Before Cleanup:
1. ✅ Backup current environment (this report)
2. ✅ Identify VortexCore-specific variables
3. ✅ Create safe cleanup commands

### After Cleanup:
1. Test VortexCore deployment
2. Verify auth functionality
3. Check other projects still work
4. Monitor for any issues

### Rollback Plan:
If issues occur, restore variables using Vercel dashboard:
- Go to https://vercel.com/thefixers-team/vortexcore/settings/environment-variables
- Add back any removed variables manually

VERIFICATION

print_section "4. RECOMMENDED CLEANUP ACTIONS"

echo "" >> "$CLEANUP_REPORT"
echo "## Recommended Actions" >> "$CLEANUP_REPORT"
echo "" >> "$CLEANUP_REPORT"

cat >> "$CLEANUP_REPORT" << 'RECOMMENDATIONS'

### 🎯 Safe Cleanup Steps:

1. **Update VortexCore Variables Only**:
   ```bash
   # Run the generated cleanup script
   ./cleanup_commands.sh
   ```

2. **Manual Review in Vercel Dashboard**:
   - Go to: https://vercel.com/thefixers-team/vortexcore/settings/environment-variables
   - Look for variables with wrong Supabase URLs
   - Remove only variables that clearly belong to VortexCore

3. **Variables to Keep (Other Projects)**:
   - Any `POSTGRES_*` variables (may be used by other projects)
   - `SUPABASE_SERVICE_ROLE_KEY` (if used by other projects)
   - `SUPABASE_JWT_SECRET` (if used by other projects)

4. **Variables to Update/Clean**:
   - Ensure `VITE_SUPABASE_URL` points to mxtsdgkwzjzlttpotole.supabase.co
   - Ensure `VITE_SUPABASE_ANON_KEY` matches the correct project
   - Remove any variables pointing to `seftechub.supabase.co` (if VortexCore only)

### 🚨 Variables That Are Definitely Wrong:
- Any Supabase URL pointing to `seftechub.supabase.co` (for VortexCore)
- Anon keys that don't match `mxtsdgkwzjzlttpotole` project
- Duplicate variables with different values

RECOMMENDATIONS

print_section "5. EXECUTION PLAN"

echo ""
print_warning "EXECUTION PLAN:"
echo "1. Review this report: $CLEANUP_REPORT"
echo "2. Run cleanup script: ./cleanup_commands.sh"
echo "3. Manually review Vercel dashboard"
echo "4. Test deployment: vercel --prod"
echo "5. Verify auth works: test at production URL"
echo ""

print_info "Generated files:"
echo "📊 Analysis report: $CLEANUP_REPORT"
echo "🧹 Cleanup script: ./cleanup_commands.sh"
echo ""

print_section "6. TESTING AFTER CLEANUP"

cat >> "$CLEANUP_REPORT" << 'TESTING'

## Testing Checklist After Cleanup

### VortexCore Tests:
- [ ] Deployment succeeds: `vercel --prod`
- [ ] Auth page loads: `https://production-url/test-auth`
- [ ] Magic link works
- [ ] Dashboard accessible after login
- [ ] API endpoints respond: `/health`, `/api/health`

### Other Projects Tests:
- [ ] Check if other Vercel projects still deploy
- [ ] Verify other projects' auth still works
- [ ] Test any shared Supabase functionality

### Environment Verification:
```bash
# Check final environment state
vercel env list

# Should show clean VortexCore variables
```

TESTING

print_status "Environment cleanup analysis complete!"
print_warning "Review the report before executing cleanup"

echo ""
echo "🎯 NEXT STEPS:"
echo "1. Review: $CLEANUP_REPORT"
echo "2. Execute: ./cleanup_commands.sh (if approved)"
echo "3. Manual cleanup in Vercel dashboard"
echo "4. Test deployment"
echo ""

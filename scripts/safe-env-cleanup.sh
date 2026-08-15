#!/bin/bash

# =====================================================
# Safe Vercel Environment Cleanup - VortexCore Only
# =====================================================

echo "=================================================="
echo "🎯 SAFE VERCEL ENVIRONMENT CLEANUP"
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

print_warning "SAFE MODE: Only updating VortexCore-specific variables"
print_info "Other project variables will be left untouched"

# Step 1: Backup current state
print_info "Creating backup of current environment..."
vercel env list > "vercel_env_backup_$(date +%Y%m%d_%H%M%S).txt"

# Step 2: Set correct VortexCore variables
print_info "Setting correct VortexCore environment variables..."

# Correct values for VortexCore
VORTEX_SUPABASE_URL="https://mxtsdgkwzjzlttpotole.supabase.co"
VORTEX_ANON_KEY="REDACTED"

echo ""
print_info "Step 1: Updating VITE_SUPABASE_URL for all environments..."

# Remove existing VITE_SUPABASE_URL if it exists
vercel env rm VITE_SUPABASE_URL production --yes 2>/dev/null || true
vercel env rm VITE_SUPABASE_URL preview --yes 2>/dev/null || true
vercel env rm VITE_SUPABASE_URL development --yes 2>/dev/null || true

# Add correct VITE_SUPABASE_URL
echo "$VORTEX_SUPABASE_URL" | vercel env add VITE_SUPABASE_URL production
echo "$VORTEX_SUPABASE_URL" | vercel env add VITE_SUPABASE_URL preview
echo "$VORTEX_SUPABASE_URL" | vercel env add VITE_SUPABASE_URL development

print_status "VITE_SUPABASE_URL updated for all environments"

echo ""
print_info "Step 2: Updating VITE_SUPABASE_ANON_KEY for all environments..."

# Remove existing VITE_SUPABASE_ANON_KEY if it exists
vercel env rm VITE_SUPABASE_ANON_KEY production --yes 2>/dev/null || true
vercel env rm VITE_SUPABASE_ANON_KEY preview --yes 2>/dev/null || true
vercel env rm VITE_SUPABASE_ANON_KEY development --yes 2>/dev/null || true

# Add correct VITE_SUPABASE_ANON_KEY
echo "$VORTEX_ANON_KEY" | vercel env add VITE_SUPABASE_ANON_KEY production
echo "$VORTEX_ANON_KEY" | vercel env add VITE_SUPABASE_ANON_KEY preview
echo "$VORTEX_ANON_KEY" | vercel env add VITE_SUPABASE_ANON_KEY development

print_status "VITE_SUPABASE_ANON_KEY updated for all environments"

# Step 3: Optional cleanup of clearly wrong variables
echo ""
print_warning "OPTIONAL: Remove variables with wrong Supabase URLs"
print_info "The following commands will remove variables pointing to wrong projects:"

echo ""
echo "# Remove variables pointing to seftechub (if they exist)"
echo "vercel env rm SUPABASE_URL production --yes 2>/dev/null || true"
echo "vercel env rm NEXT_PUBLIC_SUPABASE_URL production --yes 2>/dev/null || true"
echo ""
echo "# Remove old anon keys that don't match VortexCore"
echo "vercel env rm SUPABASE_ANON_KEY production --yes 2>/dev/null || true"
echo "vercel env rm NEXT_PUBLIC_SUPABASE_ANON_KEY production --yes 2>/dev/null || true"

echo ""
read -p "Do you want to remove potentially conflicting variables? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Removing potentially conflicting variables..."
    
    # Remove variables that might conflict (only if they exist)
    vercel env rm SUPABASE_URL production --yes 2>/dev/null || true
    vercel env rm SUPABASE_URL preview --yes 2>/dev/null || true
    vercel env rm SUPABASE_URL development --yes 2>/dev/null || true
    
    vercel env rm NEXT_PUBLIC_SUPABASE_URL production --yes 2>/dev/null || true
    vercel env rm NEXT_PUBLIC_SUPABASE_URL preview --yes 2>/dev/null || true
    vercel env rm NEXT_PUBLIC_SUPABASE_URL development --yes 2>/dev/null || true
    
    vercel env rm SUPABASE_ANON_KEY production --yes 2>/dev/null || true
    vercel env rm SUPABASE_ANON_KEY preview --yes 2>/dev/null || true
    vercel env rm SUPABASE_ANON_KEY development --yes 2>/dev/null || true
    
    vercel env rm NEXT_PUBLIC_SUPABASE_ANON_KEY production --yes 2>/dev/null || true
    vercel env rm NEXT_PUBLIC_SUPABASE_ANON_KEY preview --yes 2>/dev/null || true
    vercel env rm NEXT_PUBLIC_SUPABASE_ANON_KEY development --yes 2>/dev/null || true
    
    print_status "Conflicting variables removed"
else
    print_info "Skipping optional cleanup - you can remove them manually later"
fi

# Step 4: Verify final state
echo ""
print_info "Final environment state:"
vercel env list

echo ""
print_status "Environment cleanup complete!"

echo ""
echo "=================================================="
echo "🧪 TESTING STEPS"
echo "=================================================="
echo ""
echo "1. Deploy to test changes:"
echo "   vercel --prod"
echo ""
echo "2. Test authentication:"
echo "   Visit your production URL/test-auth"
echo ""
echo "3. Verify correct Supabase connection:"
echo "   Check browser console for any Supabase errors"
echo ""
echo "4. If issues occur, restore from backup:"
echo "   Check vercel_env_backup_*.txt files"
echo ""

# Create a quick test script
cat > test_after_cleanup.sh << 'TEST_SCRIPT'
#!/bin/bash

echo "🧪 Testing VortexCore after environment cleanup"
echo "=============================================="

echo "1. Deploying to production..."
vercel --prod

echo ""
echo "2. Testing health endpoints..."
PROD_URL=$(vercel ls | grep "https://" | head -1 | awk '{print $1}')
echo "Production URL: $PROD_URL"

if [ ! -z "$PROD_URL" ]; then
    echo "Testing health endpoint..."
    curl -s "$PROD_URL/health" || echo "❌ Health endpoint failed"
    
    echo ""
    echo "Testing API health endpoint..."
    curl -s "$PROD_URL/api/health" || echo "❌ API health endpoint failed"
    
    echo ""
    echo "✅ Test complete!"
    echo "🌐 Visit: $PROD_URL/test-auth to test authentication"
else
    echo "❌ Could not determine production URL"
fi
TEST_SCRIPT

chmod +x test_after_cleanup.sh

print_info "Created test script: ./test_after_cleanup.sh"
print_warning "Run this after cleanup to verify everything works"

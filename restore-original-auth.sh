#!/bin/bash

# =====================================================
# Restore Original Multi-Project Auth Configuration
# =====================================================

echo "=================================================="
echo "Restoring Original Auth Configuration"
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

print_warning "CRITICAL: Restoring your original multi-project auth setup"
print_info "This will restore your centralized auth system while keeping VortexCore fixes"

# Step 1: Update auth-config.ts to respect your original setup
print_info "Step 1: Updating auth configuration for multi-project setup..."

cat > src/utils/auth-config.ts << 'EOF'
// Multi-project auth configuration
// Respects the original lanonasis.com ecosystem

export const getRedirectUrl = (path: string = '/dashboard') => {
  const currentOrigin = window.location.origin;
  
  // Production domains
  const PRODUCTION_DOMAINS = [
    'me.vortexcore.app',
    'api.lanonasis.com',
    'lanonasis.supabase.co'
  ];
  
  // Check if we're on a production domain
  const isProduction = PRODUCTION_DOMAINS.some(domain => 
    currentOrigin.includes(domain)
  );
  
  if (isProduction) {
    // Use current origin for production
    return `${currentOrigin}${path}`;
  }
  
  // For local development, use the custom domain
  if (currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1')) {
    return `https://me.vortexcore.app${path}`;
  }
  
  // For Vercel/Netlify previews, use them directly
  return `${currentOrigin}${path}`;
};

export const getAuthCallbackUrl = () => {
  // For OAuth, always use the central auth system
  return 'https://api.lanonasis.com/auth/callback?return_to=vortexcore';
};

export const getCentralAuthUrl = () => {
  return 'https://api.lanonasis.com';
};

// For debugging
export const getDeploymentInfo = () => {
  return {
    currentOrigin: window.location.origin,
    customDomain: 'https://me.vortexcore.app',
    centralAuth: 'https://api.lanonasis.com',
    isLocal: window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1'),
    shouldUseCentralAuth: true
  };
};
EOF

print_status "Updated auth configuration for multi-project setup"

# Step 2: Create Supabase auth restoration SQL
print_info "Step 2: Preparing Supabase auth restoration..."

cat > restore-supabase-auth.sql << 'EOF'
-- Restore original Supabase auth configuration
-- This restores the multi-project setup

-- Check current auth configuration
SELECT 'Checking current auth setup...' as status;

-- The following URLs should be manually added in Supabase Dashboard:
-- Authentication > URL Configuration

/*
ORIGINAL REDIRECT URLs (to be restored manually):
- https://api.lanonasis.com/auth/callback
- https://api.lanonasis.com/auth/callback?return_to=vortexcore
- https://me.vortexcore.app/dashboard
- https://me.vortexcore.app/auth/callback
- https://lanonasis.supabase.co/auth/callback
- http://localhost:5173/dashboard (for development)
- http://localhost:5173/auth/callback (for development)

SITE URL should be: https://api.lanonasis.com

OAUTH PROVIDERS:
- Twitter: redirect_to should point to https://api.lanonasis.com/auth/callback?return_to=vortexcore
*/

SELECT 'Auth restoration SQL prepared' as result;
EOF

# Step 3: Fix Vercel custom domain configuration
print_info "Step 3: Checking Vercel domain configuration..."

# Check if domain is properly configured
print_status "Vercel domain status for me.vortexcore.app:"
vercel domains ls 2>/dev/null || print_warning "Could not check Vercel domains"

# Step 4: Create environment variables for multi-project setup
print_info "Step 4: Setting up environment variables..."

# Update .env with proper URLs
if [ -f ".env" ]; then
    # Backup current .env
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    
    # Update environment variables
    if ! grep -q "VITE_CUSTOM_DOMAIN" .env; then
        echo "" >> .env
        echo "# Multi-project configuration" >> .env
        echo "VITE_CUSTOM_DOMAIN=https://me.vortexcore.app" >> .env
        echo "VITE_CENTRAL_AUTH_URL=https://api.lanonasis.com" >> .env
        echo "VITE_VANITY_DOMAIN=https://lanonasis.supabase.co" >> .env
    fi
    
    print_status "Updated environment variables"
fi

# Step 5: Instructions for manual restoration
echo ""
echo "=================================================="
echo "MANUAL RESTORATION REQUIRED:"
echo "=================================================="
echo ""
echo "🔧 1. SUPABASE AUTH CONFIGURATION:"
echo "   Go to: https://supabase.com/dashboard/project/mxtsdgkwzjzlttpotole/auth/url-configuration"
echo ""
echo "   SITE URL: https://api.lanonasis.com"
echo ""
echo "   REDIRECT URLs (replace current ones):"
echo "   ✅ https://api.lanonasis.com/auth/callback"
echo "   ✅ https://api.lanonasis.com/auth/callback?return_to=vortexcore"
echo "   ✅ https://me.vortexcore.app/dashboard"
echo "   ✅ https://me.vortexcore.app/auth/callback"
echo "   ✅ https://lanonasis.supabase.co/auth/callback"
echo "   ✅ http://localhost:5173/dashboard"
echo "   ✅ http://localhost:5173/auth/callback"
echo ""
echo "🔧 2. OAUTH PROVIDERS:"
echo "   ✅ All OAuth providers should ALREADY point to: api.lanonasis.com"
echo "   ✅ This is correct - OAuth clients don't support multiple wildcards"
echo "   ✅ Central system routes to projects via return_to parameter"
echo "   Twitter: https://api.lanonasis.com/auth/callback?return_to=vortexcore"
echo ""
echo "🔧 3. VERCEL CUSTOM DOMAIN:"
echo "   Go to: https://vercel.com/thefixers-team/vortexcore/settings/domains"
echo "   Ensure me.vortexcore.app is properly configured and serving"
echo ""
echo "🔧 4. DNS VERIFICATION:"
echo "   Check that me.vortexcore.app CNAME points to cname.vercel-dns.com"
echo ""

# Step 6: Build and test
print_info "Step 6: Building with restored configuration..."
bun run build

if [ $? -eq 0 ]; then
    print_status "Build successful with restored auth configuration"
else
    print_error "Build failed - please check for errors"
fi

echo ""
echo "=================================================="
echo "PREVENTION STRATEGY FOR FUTURE:"
echo "=================================================="
echo ""
echo "📝 1. CREATE SEPARATE AUTH CONFIGS:"
echo "   - Keep VortexCore auth separate from central system"
echo "   - Use environment variables to switch between modes"
echo ""
echo "📝 2. BACKUP CONFIGURATIONS:"
echo "   - Always backup Supabase auth settings before changes"
echo "   - Document all redirect URLs in version control"
echo ""
echo "📝 3. USE FEATURE FLAGS:"
echo "   - Implement feature flags for auth methods"
echo "   - Test new auth flows without affecting production"
echo ""
echo "📝 4. STAGED ROLLOUTS:"
echo "   - Test auth changes on development domains first"
echo "   - Gradually migrate to new auth systems"
echo ""

print_status "Auth restoration preparation complete!"
print_warning "Please complete the manual steps above to fully restore your setup"

# Cleanup
rm -f restore-supabase-auth.sql

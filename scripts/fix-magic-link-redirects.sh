#!/bin/bash

# =====================================================
# Fix Magic Link Redirect Issues
# =====================================================

echo "=================================================="
echo "Fixing Magic Link Redirect Issues"
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

# Step 1: Get deployment URLs
print_info "Step 1: Detecting deployment URLs..."

VERCEL_URL=""
NETLIFY_URL=""

# Try to get Vercel URL
if command -v vercel &> /dev/null; then
    VERCEL_OUTPUT=$(vercel ls 2>/dev/null)
    if [ $? -eq 0 ]; then
        VERCEL_URL=$(echo "$VERCEL_OUTPUT" | grep -E "https://.*\.vercel\.app" | head -1 | awk '{print $1}' | sed 's/https:\/\///')
        if [ ! -z "$VERCEL_URL" ]; then
            print_status "Found Vercel URL: https://$VERCEL_URL"
        fi
    fi
fi

# Try to get Netlify URL
if command -v netlify &> /dev/null; then
    NETLIFY_OUTPUT=$(netlify status 2>/dev/null)
    if [ $? -eq 0 ]; then
        NETLIFY_URL=$(echo "$NETLIFY_OUTPUT" | grep "Site url:" | awk '{print $3}' | sed 's/https:\/\///')
        if [ ! -z "$NETLIFY_URL" ]; then
            print_status "Found Netlify URL: https://$NETLIFY_URL"
        fi
    fi
fi

# Step 2: Update auth-config.ts with actual URLs
print_info "Step 2: Updating auth configuration..."

# Determine the best production URL
PRODUCTION_URL=""
if [ ! -z "$VERCEL_URL" ]; then
    PRODUCTION_URL="https://$VERCEL_URL"
elif [ ! -z "$NETLIFY_URL" ]; then
    PRODUCTION_URL="https://$NETLIFY_URL"
else
    print_warning "No deployment URLs found. Using fallback."
    PRODUCTION_URL="https://vortexcore-testing.vercel.app"
fi

print_status "Using production URL: $PRODUCTION_URL"

# Update the auth config file
cat > src/utils/auth-config.ts << EOF
// Auth configuration utilities
export const getRedirectUrl = (path: string = '/dashboard') => {
  const currentOrigin = window.location.origin;
  
  // If running locally, use production URL for magic links
  if (currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1')) {
    // Use detected production URL
    return '$PRODUCTION_URL' + path;
  }
  
  // Use current origin for production deployments
  return currentOrigin + path;
};

export const getAuthCallbackUrl = () => {
  return getRedirectUrl('/auth/callback');
};

// For debugging
export const getDeploymentInfo = () => {
  return {
    currentOrigin: window.location.origin,
    productionUrl: '$PRODUCTION_URL',
    isLocal: window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
  };
};
EOF

print_status "Updated auth configuration"

# Step 3: Add environment variables for deployment URLs
print_info "Step 3: Adding environment variables..."

# Add to .env if not already present
if [ -f ".env" ]; then
    if ! grep -q "VITE_PRODUCTION_URL" .env; then
        echo "" >> .env
        echo "# Production URLs for magic link redirects" >> .env
        echo "VITE_PRODUCTION_URL=$PRODUCTION_URL" >> .env
        if [ ! -z "$VERCEL_URL" ]; then
            echo "VITE_VERCEL_URL=$VERCEL_URL" >> .env
        fi
        if [ ! -z "$NETLIFY_URL" ]; then
            echo "VITE_NETLIFY_URL=$NETLIFY_URL" >> .env
        fi
        print_status "Added production URLs to .env"
    else
        print_status ".env already contains production URLs"
    fi
fi

# Step 4: Update Supabase Auth settings
print_info "Step 4: Configuring Supabase Auth settings..."

# Create SQL to update auth settings
cat > update-auth-settings.sql << EOF
-- Add production URL to allowed redirect URLs in auth settings
-- This should also be done manually in Supabase Dashboard:
-- Authentication > URL Configuration > Redirect URLs

-- For now, let's just verify our setup
SELECT 'Auth configuration check' as info;

-- Check if we have any users
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) as confirmed_users
FROM auth.users;

-- Show auth config (if accessible)
-- Note: auth.config is not directly accessible, so we'll skip this
SELECT 'Please manually add redirect URLs in Supabase Dashboard' as manual_action;
EOF

# Apply auth settings
supabase db remote query update-auth-settings.sql || print_warning "Could not update auth settings automatically"

# Step 5: Test the configuration
print_info "Step 5: Building and testing..."

# Build the project to ensure everything compiles
print_status "Building project..."
bun run build

if [ $? -eq 0 ]; then
    print_status "Build successful!"
else
    print_error "Build failed. Please check for errors."
    exit 1
fi

# Step 6: Instructions for manual Supabase configuration
echo ""
echo "=================================================="
echo "Manual Supabase Configuration Required:"
echo "=================================================="
echo ""
echo "1. Go to Supabase Dashboard:"
echo "   https://supabase.com/dashboard/project/mxtsdgkwzjzlttpotole/auth/url-configuration"
echo ""
echo "2. Add these Redirect URLs:"
if [ ! -z "$VERCEL_URL" ]; then
    echo "   - https://$VERCEL_URL/dashboard"
    echo "   - https://$VERCEL_URL/auth/callback"
fi
if [ ! -z "$NETLIFY_URL" ]; then
    echo "   - https://$NETLIFY_URL/dashboard"
    echo "   - https://$NETLIFY_URL/auth/callback"
fi
echo "   - http://localhost:5173/dashboard"
echo "   - http://localhost:5173/auth/callback"
echo ""
echo "3. Set Site URL to: $PRODUCTION_URL"
echo ""
echo "4. For testing, set 'Enable Email Confirmations' = OFF"
echo "   (Authentication > Email > Enable Email Confirmations)"
echo ""

# Step 7: Deploy updates
print_info "Step 7: Deploying updates..."

# Deploy to Vercel if available
if [ ! -z "$VERCEL_URL" ]; then
    print_status "Deploying to Vercel..."
    vercel --prod || print_warning "Vercel deployment may have failed"
fi

# Deploy to Netlify if available
if [ ! -z "$NETLIFY_URL" ]; then
    print_status "Deploying to Netlify..."
    netlify deploy --prod --dir=dist || print_warning "Netlify deployment may have failed"
fi

echo ""
echo "=================================================="
echo "Testing Instructions:"
echo "=================================================="
echo ""
echo "1. Test locally first:"
echo "   bun run dev"
echo "   Go to: http://localhost:5173/test-auth"
echo "   Try magic link - should redirect to: $PRODUCTION_URL/dashboard"
echo ""
echo "2. Test on production:"
echo "   Go to: $PRODUCTION_URL/test-auth"
echo "   Try magic link - should work correctly"
echo ""
echo "3. Check email for magic link and click it"
echo "   Should redirect properly without localhost errors"
echo ""

print_status "Magic link redirect fix complete!"
print_warning "Don't forget to manually configure Supabase redirect URLs!"

# Cleanup
rm -f update-auth-settings.sql

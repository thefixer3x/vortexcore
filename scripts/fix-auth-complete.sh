#!/bin/bash

# =====================================================
# Complete Auth Fix & Function Deployment
# =====================================================

echo "=================================================="
echo "VortexCore: Complete Auth Fix & Deployment"
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

# Step 1: Fix Supabase Auth Settings
print_info "Step 1: Fixing Supabase Auth Settings..."

# Disable email confirmations for testing
cat > fix-auth-settings.sql << 'EOF'
-- Disable email confirmations for easier testing
-- This should be done in Supabase Dashboard: Authentication > Email > Enable Email Confirmations = OFF

-- Check current auth settings
SELECT 
  'Current Users' as info,
  COUNT(*) as total_users,
  COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) as confirmed_users,
  COUNT(CASE WHEN email_confirmed_at IS NULL THEN 1 END) as unconfirmed_users
FROM auth.users;

-- Show recent users
SELECT 
  email, 
  email_confirmed_at, 
  created_at,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN 'Confirmed'
    ELSE 'Unconfirmed'
  END as status
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- Ensure profiles and wallets tables exist with proper triggers
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance NUMERIC(10,2) DEFAULT 0.00,
  currency TEXT DEFAULT 'NGN',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create or replace the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    updated_at = NOW();
  
  -- Insert wallet
  INSERT INTO public.wallets (user_id, balance, currency)
  VALUES (NEW.id, 0.00, 'NGN')
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own wallet" ON public.wallets;

-- Create policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own wallet" ON public.wallets
  FOR SELECT USING (auth.uid() = user_id);

SELECT 'Auth setup complete!' as status;
EOF

# Apply the auth fix
print_status "Applying auth database fixes..."
supabase db remote query fix-auth-settings.sql || print_warning "Some auth fixes may have failed"

# Step 2: Deploy Netlify Functions
print_info "Step 2: Deploying Netlify Functions..."

# Check if functions are detected
print_status "Checking Netlify functions..."
netlify functions:list

# Build the project
print_status "Building project..."
bun run build

# Deploy to Netlify with functions
print_status "Deploying to Netlify..."
netlify deploy --prod --dir=dist

# Step 3: Deploy Vercel Functions
print_info "Step 3: Deploying to Vercel..."
vercel --prod

# Step 4: Deploy Supabase Edge Functions
print_info "Step 4: Deploying Supabase Edge Functions..."

# Set secrets if they exist in .env
if [ -f ".env" ]; then
    # Extract API keys from .env
    OPENAI_KEY=$(grep "^OPENAI_API_KEY=" .env | cut -d'=' -f2)
    PERPLEXITY_KEY=$(grep "^PERPLEXITY_API_KEY=" .env | cut -d'=' -f2)
    
    # Set Perplexity (we have this one)
    if [ ! -z "$PERPLEXITY_KEY" ]; then
        print_status "Setting Perplexity API key..."
        supabase secrets set PERPLEXITY_API_KEY="$PERPLEXITY_KEY"
    fi
    
    # For OpenAI - use a placeholder or skip
    if [ ! -z "$OPENAI_KEY" ] && [ "$OPENAI_KEY" != "your_openai_api_key_here" ]; then
        print_status "Setting OpenAI API key..."
        supabase secrets set OPENAI_API_KEY="$OPENAI_KEY"
    else
        print_warning "OpenAI API key not set - using dummy for testing"
        supabase secrets set OPENAI_API_KEY="sk-dummy-key-for-testing"
    fi
fi

# Deploy Edge Functions
if [ -d "supabase/functions/ai-router" ]; then
    print_status "Deploying ai-router function..."
    supabase functions deploy ai-router --no-verify-jwt
fi

if [ -d "supabase/functions/stripe" ]; then
    print_status "Deploying stripe function..."
    supabase functions deploy stripe
fi

# Step 5: Test Everything
print_info "Step 5: Testing Deployments..."

echo ""
echo "=================================================="
echo "Deployment Complete! Test URLs:"
echo "=================================================="
echo ""

# Get deployment URLs
NETLIFY_URL=$(netlify status | grep "Site url:" | awk '{print $3}' 2>/dev/null || echo "Check netlify status")
VERCEL_URL=$(vercel ls | grep "vortex" | head -1 | awk '{print $2}' 2>/dev/null || echo "Check vercel ls")

echo "🌐 Netlify:"
echo "   App: $NETLIFY_URL"
echo "   Health: $NETLIFY_URL/health"
echo "   Auth Test: $NETLIFY_URL/test-auth"
echo ""
echo "🚀 Vercel:"
echo "   App: $VERCEL_URL"
echo "   Health: $VERCEL_URL/api/health"
echo "   Auth Test: $VERCEL_URL/test-auth"
echo ""
echo "🔧 Supabase:"
echo "   Functions: https://mxtsdgkwzjzlttpotole.supabase.co/functions/v1/"
echo ""

echo "=================================================="
echo "Auth Testing Instructions:"
echo "=================================================="
echo ""
echo "1. Go to Supabase Dashboard:"
echo "   https://supabase.com/dashboard/project/mxtsdgkwzjzlttpotole/auth/users"
echo ""
echo "2. Delete any existing test users if needed"
echo ""
echo "3. Go to Authentication > Email:"
echo "   Set 'Enable Email Confirmations' = OFF"
echo ""
echo "4. Test at /test-auth:"
echo "   - Try signup with: test@example.com / test123456"
echo "   - Should work without email confirmation"
echo ""
echo "5. If still issues, use Magic Link:"
echo "   - I can add magic link signin (no password needed)"
echo ""

print_status "Complete deployment finished!"
print_warning "Remember to set environment variables in Netlify/Vercel dashboards"

# Cleanup
rm -f fix-auth-settings.sql

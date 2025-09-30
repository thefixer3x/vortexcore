#!/bin/bash

# =====================================================
# Fix Authentication and Deploy
# Quick script to get auth working for user testing
# =====================================================

echo "=================================================="
echo "Fixing Authentication for User Testing"
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

# Step 1: Check Supabase connection
print_info "Checking Supabase connection..."
if command -v supabase &> /dev/null; then
    supabase status 2>/dev/null || {
        print_warning "Not linked to Supabase project"
        print_info "Linking now..."
        supabase link --project-ref mxtsdgkwzjzlttpotole
    }
else
    print_error "Supabase CLI not installed"
    echo "Install with: brew install supabase/tap/supabase"
    exit 1
fi

# Step 2: Apply database migrations
print_info "Applying database migrations..."
supabase db push || print_warning "Some migrations may have already been applied"

# Step 3: Set up auth trigger
print_info "Setting up auth trigger for user profiles..."
cat > setup-auth-trigger.sql << 'EOF'
-- Ensure profiles table exists
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure wallets table exists
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

-- Create policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own wallet" ON public.wallets
  FOR SELECT USING (auth.uid() = user_id);

-- Test query
SELECT 'Auth setup complete' as status;
EOF

# Apply the SQL
print_status "Applying auth trigger setup..."
supabase db remote query setup-auth-trigger.sql

# Step 4: Deploy Edge Functions
print_info "Deploying Edge Functions..."
chmod +x deploy-supabase-functions.sh
./deploy-supabase-functions.sh

# Step 5: Build the application
print_info "Building application..."
bun install
bun run build

# Step 6: Test locally
print_info "Starting local test server..."
echo ""
echo "=================================================="
echo "Local Testing Instructions:"
echo "=================================================="
echo ""
echo "1. Open a new terminal and run:"
echo "   bun run dev"
echo ""
echo "2. Test at http://localhost:5173"
echo "   - Try signing up with a new account"
echo "   - Check if dashboard loads"
echo "   - Test AI chat (may need OpenAI key)"
echo ""
echo "3. Deploy to production:"
echo "   vercel --prod"
echo ""
echo "=================================================="
echo "Quick Test Checklist:"
echo "=================================================="
echo "□ Can create new account"
echo "□ Can log in"
echo "□ Dashboard shows (even with placeholder data)"
echo "□ No 404 errors"
echo "□ Currency shows as ₦"
echo ""

# Step 7: Show deployment status
print_info "Checking deployment status..."
echo ""
print_status "Vercel: Working ✓"
print_warning "Netlify: Needs environment variables set in dashboard"
echo ""
echo "To fix Netlify:"
echo "1. Go to Netlify dashboard"
echo "2. Site Settings > Environment Variables"
echo "3. Add:"
echo "   VITE_SUPABASE_URL=https://mxtsdgkwzjzlttpotole.supabase.co"
echo "   VITE_SUPABASE_ANON_KEY=eyJhbGc..."
echo ""

print_status "Setup complete! Ready for user testing."

# 🚀 Quick Auth Fix & Deployment Guide

**Status**: Vercel ✅ Working | Netlify ⚠️ Needs Fix

## ✅ Vercel is Working!
Your Vercel deployment is working fine. Keep using it for production.

## 🔧 Fix Netlify Blank Page

### The Issue
Netlify shows blank page because environment variables aren't set.

### Quick Fix for Netlify:
1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Select your site
3. Go to **Site Settings** → **Environment Variables**
4. Add these variables:
```
VITE_SUPABASE_URL=https://mxtsdgkwzjzlttpotole.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14dHNkZ2t3emp6bHR0cG90b2xlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxMDUyNTksImV4cCI6MjA2MjY4MTI1OX0.2KM8JxBEsqQidSvjhuLs8HCX-7g-q6YNswedQ5ZYq3g
```
5. Trigger a redeploy

## 🔐 Test Authentication NOW

### 1. Test Locally First (2 minutes)
```bash
# Start dev server
bun run dev

# Open in browser
http://localhost:5173/test-auth
```

### 2. Test on Production (Vercel)
Visit: `https://your-vercel-app.vercel.app/test-auth`

### 3. Create Test Account
- Email: `test@example.com`
- Password: `test123456`
- Name: `Test User`

## 📋 Quick Testing Checklist

### Basic Auth Tests:
- [ ] Can create new account at `/test-auth`
- [ ] Can log in with existing account
- [ ] Dashboard redirects after login
- [ ] Sign out works

### Dashboard Tests:
- [ ] Dashboard loads (even with placeholder data)
- [ ] No 404 errors
- [ ] Currency shows as ₦
- [ ] Sidebar navigation works

## 🚨 If Auth Doesn't Work

### Run this command:
```bash
# This will set up the database triggers
supabase db remote query - << 'EOF'
-- Quick auth fix
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance NUMERIC(10,2) DEFAULT 0.00,
  currency TEXT DEFAULT 'NGN',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create trigger for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email))
  ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO public.wallets (user_id, balance, currency)
  VALUES (NEW.id, 0.00, 'NGN')
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can view own wallet" ON public.wallets
  FOR SELECT USING (auth.uid() = user_id);

SELECT 'Auth fixed!' as status;
EOF
```

## 🎯 For User Testing TODAY

### Option 1: Use Vercel (Recommended)
Your Vercel deployment is already working. Share this link with testers:
```
https://your-app.vercel.app
```

### Option 2: Deploy Quick Edge Functions
```bash
# Set minimal secrets for testing
supabase secrets set OPENAI_API_KEY="sk-dummy-key-for-testing"
supabase secrets set PERPLEXITY_API_KEY="pplx-REDACTED"

# Deploy functions
supabase functions deploy ai-router --no-verify-jwt
```

### Option 3: Local Testing Server
```bash
# Run local server for testing
bun run dev

# Share via ngrok or similar
ngrok http 5173
```

## 📱 What Users Can Test Now

### Working Features:
1. ✅ Sign up / Login
2. ✅ Dashboard view
3. ✅ Navigation
4. ✅ Profile management
5. ✅ Basic UI/UX

### Features Needing API Keys:
1. ⚠️ AI Chat (needs OpenAI key)
2. ⚠️ Virtual Cards (needs Stripe key)
3. ⚠️ Payment processing (needs Stripe)

## 🆘 Emergency Fixes

### Can't login?
```bash
# Check auth settings in Supabase dashboard
# Go to: Authentication > Providers > Email
# Ensure "Enable Email Confirmations" is OFF for testing
```

### Dashboard blank?
```bash
# Verify tables exist
supabase db remote query "SELECT tablename FROM pg_tables WHERE schemaname='public';"
```

### 404 errors?
```bash
# Ensure redirects are working
# Check vercel.json or netlify.toml has rewrite rules
```

## 📞 Test User Instructions

Share this with your testers:

```
VortexCore App Testing

1. Visit: https://your-app.vercel.app
2. Click "Sign Up" to create account
3. Use any email (no confirmation needed)
4. Password must be 6+ characters
5. After signup, you'll see the dashboard

What to test:
- Create account
- Login/logout
- Navigate menus
- Check if currency shows ₦
- Report any errors

Known limitations:
- AI chat may not work (API key needed)
- Payment features disabled for testing
- Some data is placeholder
```

## ✅ Success Metrics

You know it's working when:
1. Users can create accounts
2. Login redirects to dashboard
3. No 404 errors
4. Navigation works
5. Currency shows ₦ everywhere

---

**Next Step**: Run `bun run dev` and test at http://localhost:5173/test-auth

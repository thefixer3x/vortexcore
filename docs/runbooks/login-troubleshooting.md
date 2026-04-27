# 🔐 Login Issues Troubleshooting Guide

## 🚨 **You Mentioned Login Troubles**

Since you're having trouble logging in, this could be directly related to our changes. Let's diagnose systematically.

## 🔍 **Potential Causes of Login Issues**

### **1. Supabase Auth URL Changes**
**What we changed**: Modified redirect URLs in auth configuration
**Impact**: Login redirects may be broken
**Symptoms**: 
- Login attempts redirect to wrong URLs
- "Invalid redirect URL" errors
- Authentication loops

### **2. Database Trigger Issues**  
**What we changed**: Modified user profile/wallet creation triggers
**Impact**: New user creation may fail
**Symptoms**:
- Signup works but profile not created
- Database constraint errors
- Silent failures after signup

### **3. Environment Variable Conflicts**
**What we changed**: Added production URLs to environment
**Impact**: Wrong API endpoints being used
**Symptoms**:
- API calls to wrong endpoints
- CORS errors
- Authentication token mismatches

### **4. OAuth Provider Disruption**
**What we changed**: May have affected OAuth redirect configuration
**Impact**: Social login broken
**Symptoms**:
- Twitter/Google login fails
- OAuth "invalid request" errors
- Redirect loops

## 🧪 **Immediate Diagnostic Tests**

### **Test 1: Basic Auth Connectivity**
```bash
# Test if Supabase auth is responding
curl -X POST https://mxtsdgkwzjzlttpotole.supabase.co/auth/v1/token \
  -H "Content-Type: application/json" \
  -H "apikey: YOUR_ANON_KEY" \
  -d '{"grant_type": "password", "email": "test@example.com", "password": "test123"}'
```

### **Test 2: Database User Check**
```bash
# Check if your user exists
supabase db remote query "SELECT email, created_at, email_confirmed_at FROM auth.users WHERE email = 'your-email@domain.com';"
```

### **Test 3: Profile/Wallet Creation**
```bash
# Check if profiles are being created
supabase db remote query "SELECT COUNT(*) FROM public.profiles;"
supabase db remote query "SELECT COUNT(*) FROM public.wallets;"
```

### **Test 4: Trigger Functionality**
```bash
# Check if triggers exist
supabase db remote query "SELECT trigger_name, event_object_table FROM information_schema.triggers WHERE trigger_name LIKE '%user%';"
```

## 🔧 **Quick Fixes for Login Issues**

### **Fix 1: Reset Supabase Auth URLs**
1. Go to [Supabase Auth Settings](https://supabase.com/dashboard/project/mxtsdgkwzjzlttpotole/auth/url-configuration)
2. **Site URL**: `https://api.lanonasis.com`
3. **Redirect URLs**: 
   ```
   https://api.lanonasis.com/auth/callback
   https://api.lanonasis.com/auth/callback?return_to=vortexcore
   https://me.vortexcore.app/dashboard
   https://me.vortexcore.app/auth/callback
   ```

### **Fix 2: Test with Magic Link**
```bash
# Start local dev
bun run dev

# Go to http://localhost:5173/test-auth
# Try magic link instead of password
```

### **Fix 3: Check Environment Variables**
```bash
# Verify correct Supabase URLs
cat .env | grep SUPABASE

# Should show:
# VITE_SUPABASE_URL=https://mxtsdgkwzjzlttpotole.supabase.co
# VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **Fix 4: Reset Database Triggers**
```sql
-- Run this if user creation is failing
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
```

## 🚨 **Emergency Login Recovery**

### **If You Can't Login At All:**

1. **Reset Your Password**:
   ```bash
   # Use Supabase dashboard to reset password
   # Or use the reset function in TestAuth page
   ```

2. **Create New Test User**:
   ```bash
   # Go to /test-auth
   # Use different email for testing
   # Email: newtest@example.com
   # Password: newtest123
   ```

3. **Check Supabase Dashboard**:
   - Go to Authentication > Users
   - See if your user exists and is confirmed
   - Manually confirm user if needed

4. **Bypass Auth Temporarily**:
   ```typescript
   // In TestAuth.tsx, add this for emergency testing
   const bypassAuth = () => {
     setUser({ id: 'test', email: 'test@example.com' });
   };
   ```

## 📊 **Systematic Diagnosis Process**

### **Step 1: Run Diagnostic Scripts**
```bash
# Run comprehensive analysis
./inspect-all-changes.sh

# Run Supabase-specific checks
./supabase-impact-check.sh

# Run critical tests
./test_critical_supabase.sh
```

### **Step 2: Check Each Component**
1. **Frontend**: Test auth components locally
2. **Backend**: Verify Supabase connectivity
3. **Database**: Check user/profile creation
4. **Functions**: Test Edge Functions
5. **Domains**: Verify custom domain serving

### **Step 3: Isolate the Issue**
- Test with fresh browser/incognito
- Try different email addresses
- Test on different devices/networks
- Compare local vs production behavior

## 🎯 **Most Likely Culprits**

Based on our changes, the login issue is most likely:

1. **Supabase redirect URLs** (90% probability)
2. **Database trigger failure** (70% probability)  
3. **Environment variable mismatch** (50% probability)
4. **Custom domain not serving** (30% probability)

## 📞 **Quick Resolution Steps**

**Run these in order:**

1. **Immediate Test**:
   ```bash
   ./test_critical_supabase.sh
   ```

2. **Fix Auth URLs**:
   - Update Supabase dashboard settings
   - Use the URLs I provided above

3. **Test Magic Link**:
   ```bash
   bun run dev
   # Go to localhost:5173/test-auth
   # Try magic link with your email
   ```

4. **Check Reports**:
   ```bash
   # Review the generated analysis
   ls -la *_analysis_*.md
   ls -la supabase_impact_*.md
   ```

The diagnostic scripts will generate detailed reports showing exactly what we changed and what might be affected. This will help us pinpoint the exact cause of your login issues.

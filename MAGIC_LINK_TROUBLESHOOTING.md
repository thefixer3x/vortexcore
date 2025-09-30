# 🔧 Magic Link & AI Chat Troubleshooting Guide

## 🚨 **Issues Identified from Screenshots:**

### 1. **Magic Link Redirect Error** (127.0.0.1 unreachable)
**Problem**: Magic links redirect to localhost instead of production URL
**Solution**: ✅ Fixed with `fix-magic-link-redirects.sh`

### 2. **AI Chat Error** ("I encountered an error")
**Problem**: Missing or invalid OpenAI API key
**Solution**: Need to set proper API keys

### 3. **Safari Connection Error** (Can't connect to server)
**Problem**: Same as #1 - localhost redirect issue
**Solution**: ✅ Fixed with redirect configuration

---

## ✅ **Immediate Fixes Applied:**

### 1. **Smart Redirect Configuration**
- Created `src/utils/auth-config.ts` with intelligent URL detection
- Magic links now use production URLs when testing locally
- Automatically detects Vercel/Netlify deployment URLs

### 2. **Updated Auth Components**
- `TestAuth.tsx` now uses smart redirects
- `use-auth-fix.ts` hook updated with proper URLs
- No more localhost redirect issues

---

## 🛠️ **Run This to Fix Everything:**

```bash
./fix-magic-link-redirects.sh
```

This script will:
1. ✅ Detect your Vercel/Netlify URLs automatically
2. ✅ Update auth configuration with production URLs
3. ✅ Add environment variables
4. ✅ Build and test the project
5. ✅ Deploy updates to both platforms
6. ✅ Provide manual Supabase configuration steps

---

## 🔑 **Fix AI Chat Error:**

The AI chat shows "I encountered an error" because:

### Option 1: Set Real OpenAI Key
```bash
# Add to .env
OPENAI_API_KEY=sk-your-real-openai-key-here

# Set in Supabase Edge Functions
supabase secrets set OPENAI_API_KEY="sk-your-real-openai-key-here"

# Redeploy functions
supabase functions deploy ai-router
```

### Option 2: Use Perplexity Instead (You have this key)
```bash
# Your Perplexity key is already set
supabase secrets set PERPLEXITY_API_KEY="pplx-REDACTED"
```

### Option 3: Disable AI Chat for Testing
- Comment out AI chat component temporarily
- Focus on auth and core features first

---

## 📱 **Manual Supabase Configuration:**

**CRITICAL**: You must manually add these URLs in Supabase Dashboard:

1. **Go to**: [Supabase Auth URL Configuration](https://supabase.com/dashboard/project/mxtsdgkwzjzlttpotole/auth/url-configuration)

2. **Add Redirect URLs**:
   ```
   https://your-vercel-app.vercel.app/dashboard
   https://your-vercel-app.vercel.app/auth/callback
   https://your-netlify-site.netlify.app/dashboard
   https://your-netlify-site.netlify.app/auth/callback
   http://localhost:5173/dashboard
   http://localhost:5173/auth/callback
   ```

3. **Set Site URL**: `https://your-vercel-app.vercel.app`

4. **For Testing**: Authentication > Email > **Enable Email Confirmations = OFF**

---

## 🧪 **Testing Steps:**

### Test Magic Links:
1. **Local Testing**:
   ```bash
   bun run dev
   # Go to: http://localhost:5173/test-auth
   # Try magic link - should redirect to production URL
   ```

2. **Production Testing**:
   ```bash
   # Go to your deployed app/test-auth
   # Try magic link - should work without errors
   ```

3. **Email Check**:
   - Check email for magic link
   - Click link - should redirect properly
   - Should NOT see 127.0.0.1 or localhost errors

### Test AI Chat:
1. Go to dashboard after login
2. Try AI chat
3. Should work if OpenAI key is set properly

---

## 🔍 **Debug Information:**

### Check Current Configuration:
```javascript
// In browser console on your app:
console.log(window.location.origin);

// If you added the debug function:
import { getDeploymentInfo } from '@/utils/auth-config';
console.log(getDeploymentInfo());
```

### Check Environment Variables:
```bash
# Local check
./test-env-vars.sh

# Production check - look in platform dashboards
```

---

## 🎯 **Expected Results After Fix:**

### ✅ Magic Links Should:
- Send to your email correctly
- Redirect to production URL (not localhost)
- Log you in automatically
- Take you to dashboard

### ✅ AI Chat Should:
- Respond without errors (if API key set)
- Show proper error messages (if no API key)
- Not crash the app

### ✅ Auth Flow Should:
- Work on both local and production
- Handle signup/login properly
- Create user profiles and wallets
- Show proper success messages

---

## 🆘 **If Still Not Working:**

### 1. Check Supabase Logs:
```bash
supabase functions logs ai-router --tail
```

### 2. Check Browser Console:
- Look for redirect errors
- Check network requests
- Verify API calls

### 3. Verify Deployment URLs:
```bash
vercel ls
netlify status
```

### 4. Test Environment Variables:
```bash
./test-env-vars.sh
```

---

## 📞 **Quick Support:**

- **Supabase Dashboard**: [mxtsdgkwzjzlttpotole](https://supabase.com/dashboard/project/mxtsdgkwzjzlttpotole)
- **Vercel Dashboard**: [Your Projects](https://vercel.com/dashboard)
- **Netlify Dashboard**: [Your Sites](https://app.netlify.com)

**Bottom Line**: Run `./fix-magic-link-redirects.sh` and manually configure Supabase redirect URLs. This will fix the localhost redirect issues you're seeing.

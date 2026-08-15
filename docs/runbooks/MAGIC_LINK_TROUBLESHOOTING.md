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

## ✅ **Fix Overview**

The script will:
1. Detect your Vercel/Netlify URLs automatically
2. Update auth configuration with production URLs
3. Add environment variables
4. Build and test the project
5. Deploy updates to both platforms
6. Provide manual Supabase configuration steps

These changes are applied when the operator runs the fix script.

---

## 🛠️ **What the Fix Script Does:**

The script `fix-magic-link-redirects.sh` (located in `scripts/` directory) performs the following actions when executed:

1. **Detects deployment environment** — identifies Vercel/Netlify URLs automatically
2. **Creates auth-config.ts** — `src/utils/auth-config.ts` with intelligent URL detection for production and local development
3. **Updates TestAuth.tsx** — modifies `TestAuth.tsx` to use smart redirects based on detected environment
4. **Updates use-auth-fix.ts** — modifies the `use-auth-fix.ts` hook to set proper redirect URLs
5. **Updates environment variables** — adds VITE_PRODUCTION_URL, VITE_VERCEL_URL, VITE_NETLIFY_URL to `.env`
6. **Builds and tests** — runs `bun run build` to verify no errors
7. **Deploys to both platforms** — pushes to Vercel and Netlify

**Prerequisites:**
- Bun runtime installed
- Supabase CLI installed
- Vercel CLI (`vercel`) installed
- Netlify CLI (`netlify`) installed

**Run location:** Execute from the project root directory (`/`).

**Permission requirement:** The script needs execute permission (`chmod +x scripts/fix-magic-link-redirects.sh`) before running.

**If script is missing or fails:**
1. Check permissions with `ls -la scripts/fix-magic-link-redirects.sh`
2. Verify all CLIs are installed (`bun --version`, `vercel --version`, `netlify --version`)
3. Run with verbose flags: `DEBUG=1 ./scripts/fix-magic-link-redirects.sh`
4. Review logs at `.spin/logs` or the terminal output for errors and retry

---

## 🔑 **Fix AI Chat Error:**

The AI chat shows "I encountered an error" because:

### Option 1: Set Real OpenAI Key
```bash
# Add to .env
OPENAI_API_KEY=<YOUR_OPENAI_API_KEY>

# Set in Supabase Edge Functions
supabase secrets set OPENAI_API_KEY="<YOUR_OPENAI_API_KEY>"

# Redeploy functions
supabase functions deploy ai-router
```

### Option 2: Use Perplexity Instead (You have this key)
```bash
# Your Perplexity key is already set
supabase secrets set PERPLEXITY_API_KEY="<YOUR_PERPLEXITY_API_KEY>"
```

### Option 3: Disable AI Chat for Testing
- Comment out AI chat component temporarily
- Focus on auth and core features first

---

## 📱 **Manual Supabase Configuration:**

**CRITICAL**: You must manually add these URLs in Supabase Dashboard. Replace `YOUR_PROJECT_ID`, `your-vercel-app`, and `your-netlify-site` with your actual Supabase project ID and deployment URLs.

1. **Go to**: [Supabase Auth URL Configuration](https://supabase.com/dashboard/project/YOUR_PROJECT_ID/auth/url-configuration)

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

- **Supabase Dashboard**: [YOUR_PROJECT_ID](https://supabase.com/dashboard/project/YOUR_PROJECT_ID)
- **Vercel Dashboard**: [Your Projects](https://vercel.com/dashboard)
- **Netlify Dashboard**: [Your Sites](https://app.netlify.com)

**Bottom Line**: Run `./scripts/fix-magic-link-redirects.sh` and manually configure Supabase redirect URLs. This will fix the localhost redirect issues you're seeing.

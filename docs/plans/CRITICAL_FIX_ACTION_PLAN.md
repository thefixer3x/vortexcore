# 🚨 VortexCore Critical Fix Action Plan

**Date**: September 28, 2025  
**Status**: CRITICAL - Multiple System Failures  
**Your Stripe Work**: ✅ SAFE (Confirmed in commit `5bb8409`)

---

## 🔴 Current Critical Issues

1. **Docker Build Failures**: I/O errors, npm cleanup issues
2. **Authentication Broken**: Signup/login not working
3. **Dashboard Data Missing**: Only showing placeholders
4. **AI Chat Failing**: All providers returning errors
5. **Subscription Inaccessible**: Payment features not working
6. **Currency Mismatch**: Mixed USD/NGN throughout app
7. **Git Status**: 25 commits behind, stuck in revert

---

## ✅ What I've Done For You

### Created 4 Fix Scripts:

1. **`quick-fix.sh`** - Immediate critical fixes
2. **`fix-all-issues.sh`** - Comprehensive solution
3. **`verify-and-fix-supabase.sh`** - Supabase connectivity
4. **`fix-migration-and-sync.sh`** - Database migration cleanup

### Fixed Components:

- ✅ Clean migration file (removed nixie/child_profiles contamination)
- ✅ AI Chat component with fallback providers
- ✅ Currency configuration for NGN
- ✅ Auth configuration with proper error handling
- ✅ Dashboard data service
- ✅ Docker configuration optimized

---

## 🚀 IMMEDIATE ACTION PLAN

### Step 1: Run Quick Fix (5 minutes)
```bash
# This will sync git, fix npm, and prepare environment
./quick-fix.sh
```

### Step 2: Set API Keys in Supabase (5 minutes)

Go to: [Supabase Dashboard](https://supabase.com/dashboard/project/{SUPABASE_PROJECT_ID}/settings/vault)

Add these secrets:
- `OPENAI_API_KEY` = Your OpenAI key
- `GEMINI_API_KEY` = Your Google Gemini key  
- `PERPLEXITY_API_KEY` = Your Perplexity key
- `STRIPE_SECRET_KEY` = Your Stripe secret key
- `STRIPE_WEBHOOK_SECRET` = Your Stripe webhook secret

### Step 3: Deploy Edge Functions (2 minutes)
```bash
# Link to your project
supabase link --project-ref YOUR_PROJECT_ID

# Deploy all functions
supabase functions deploy ai-router
supabase functions deploy stripe
supabase functions deploy stripe-webhook
```

### Step 4: Apply Clean Migrations (3 minutes)
```bash
# Push clean migrations to Supabase
supabase db push
```

### Step 5: Test Locally (5 minutes)
```bash
# Start development server
npm run dev

# Test these features:
# 1. Sign up with new account
# 2. Login with existing account
# 3. Check dashboard shows real data
# 4. Test AI chat
# 5. Check currency shows ₦ (NGN)
```

---

## 📊 Issue Root Causes & Solutions

### 1. Authentication Not Working
**Cause**: Missing user trigger and profile creation  
**Solution**: Clean migration includes `handle_new_user()` function

### 2. Dashboard Placeholder Values
**Cause**: Data fetching not connected to actual tables  
**Solution**: Created `dashboard-service.ts` with proper queries

### 3. AI Chat Errors
**Cause**: Missing API keys in Edge Functions  
**Solution**: Set secrets in Supabase + fallback providers

### 4. Currency Mismatch
**Cause**: Hardcoded USD values  
**Solution**: Created centralized `currency-config.ts` with NGN

### 5. Docker Build Failures
**Cause**: Corrupted node_modules and cache  
**Solution**: Clean install with `--legacy-peer-deps`

---

## 🔍 Verification Checklist

After running fixes, verify:

- [ ] Can create new user account
- [ ] Can login with existing account
- [ ] Dashboard shows actual wallet balance
- [ ] AI chat responds without errors
- [ ] Currency displays as ₦ (NGN)
- [ ] Virtual cards section accessible
- [ ] Transactions list populated
- [ ] Settings save properly

---

## 🐳 Docker Deployment (Optional)

If you want to deploy with Docker:

```bash
# Build optimized image
docker build -t vortexcore:latest .

# Run container
docker run -d \
  --name vortexcore \
  -p 3000:80 \
  --restart unless-stopped \
  vortexcore:latest
```

---

## ☁️ Cloud Deployment

### Vercel
```bash
vercel --prod
```

### Netlify
```bash
netlify deploy --prod --dir=dist
```

---

## 🆘 If Something Still Doesn't Work

### Problem: Functions not responding
```bash
# Check function logs
supabase functions logs ai-router --tail
```

### Problem: Tables don't exist
```bash
# Apply migration manually in SQL editor
# Copy content from: supabase/migrations/20250928_clean_vortex_core_tables.sql
```

### Problem: Auth still failing
```bash
# Check auth settings in Supabase dashboard
# Ensure email confirmations are disabled for testing
```

---

## 📝 Your Stripe Integration Status

**Good News**: Your Stripe virtual cards implementation is intact:
- `/src/lib/stripe.ts` ✅
- `/src/services/virtualCardService.ts` ✅
- `/supabase/functions/stripe/` ✅
- Migration `20250613211653_solitary_limit.sql` ✅

**No work lost!** Just need to set the API keys.

---

## ⏱ Total Fix Time: ~20 minutes

1. Quick fix script: 5 min
2. Set API keys: 5 min
3. Deploy functions: 2 min
4. Apply migrations: 3 min
5. Test features: 5 min

---

## 💬 Support

If you encounter issues after these fixes:

1. Check Supabase logs: Project > Functions > Logs
2. Check browser console for errors
3. Verify all API keys are set correctly
4. Ensure you're on latest git commit from origin/main

---

## 🎯 Priority Order

If you can only do a few things:

1. **MUST DO**: Run `./quick-fix.sh`
2. **MUST DO**: Set API keys in Supabase
3. **MUST DO**: Deploy Edge Functions
4. Test locally
5. Deploy to production

---

## ✅ Success Indicators

You'll know it's working when:
- ✅ Login redirects to dashboard (not error page)
- ✅ Dashboard shows your actual balance (not $0.00)
- ✅ AI chat responds with helpful messages (not errors)
- ✅ Currency shows ₦ everywhere (not mixed $)
- ✅ Stripe virtual cards section loads

---

**Remember**: Your 3 months of Stripe work is safe. These fixes address deployment and configuration issues, not code loss.

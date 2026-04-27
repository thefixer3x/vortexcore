# 🎯 Centralized OAuth Architecture - Correct Understanding

## ✅ **Your Smart Architecture**

You have a **centralized OAuth system** because OAuth providers don't support multiple wildcards:

```
┌─────────────────┐    ┌──────────────────────┐    ┌─────────────────┐
│   OAuth Provider │───▶│  api.lanonasis.com   │───▶│  me.vortexcore.app │
│  (Twitter/Google)│    │  (Central Hub)       │    │  (VortexCore)      │
└─────────────────┘    └──────────────────────┘    └─────────────────┘
                              │
                              ▼
                       Routes via return_to
                       parameter to correct
                       project
```

## 🔧 **What We Need to Restore**

### **1. Supabase Redirect URLs**
The only thing that needs fixing is the Supabase redirect URLs. Set these in:
[Supabase Auth Config](https://supabase.com/dashboard/project/mxtsdgkwzjzlttpotole/auth/url-configuration)

**Site URL:**
```
https://api.lanonasis.com
```

**Redirect URLs:**
```
https://api.lanonasis.com/auth/callback
https://api.lanonasis.com/auth/callback?return_to=vortexcore
https://me.vortexcore.app/dashboard
https://me.vortexcore.app/auth/callback
https://lanonasis.supabase.co/auth/callback

**Development URLs (non-production only):**
http://localhost:5173/dashboard
http://localhost:5173/auth/callback
```
> Note: Development URLs should only be used in non-production environments.

### **2. OAuth Providers (Should Already Be Correct)**
Your OAuth providers should already point to:
```
https://api.lanonasis.com/auth/callback?return_to=vortexcore
```

**This is correct and shouldn't be changed.**

### **3. Custom Domain Issue**
The `me.vortexcore.app` not serving on Vercel needs to be fixed separately.

## 🚀 **Quick Fix Commands**

### **Check Vercel Domain Status:**
```bash
vercel domains ls
vercel domains inspect me.vortexcore.app
```

### **If Domain Not Working:**
```bash
# Remove and re-add domain
vercel domains rm me.vortexcore.app
vercel domains add me.vortexcore.app

# Check DNS
dig me.vortexcore.app CNAME
```

### **Deploy with Correct Configuration:**
```bash
# Build with restored auth config
bun run build

# Deploy to Vercel
vercel --prod

# Should now serve at me.vortexcore.app
```

## 📋 **What NOT to Change**

### **✅ Keep These As-Is:**
- OAuth provider configurations (Twitter, Google, etc.)
- Central auth system at `api.lanonasis.com`
- Project routing via `return_to` parameter
- Vanity domain `lanonasis.supabase.co`

### **🔧 Only Fix These:**
- Supabase redirect URLs (remove localhost/Vercel URLs we added)
- Custom domain serving on Vercel
- Magic link redirects for VortexCore testing

## 🎯 **The Real Issue**

The main problems are:
1. **Supabase redirect URLs** got polluted with our localhost/Vercel URLs
2. **Custom domain** `me.vortexcore.app` not serving properly
3. **Magic links** trying to redirect to wrong URLs during development

Your OAuth architecture is actually perfect and shouldn't be changed.

## ✅ **Simple Fix Steps**

1. **Restore Supabase URLs** (manual - 2 minutes)
2. **Fix Vercel domain** (command line - 1 minute)  
3. **Test auth flow** (should work immediately)

The restoration script will handle the code changes. You just need to update the Supabase dashboard settings.

### **Restoration script**

**Location:** `scripts/restore-oauth.sh` (relative to repository root)

**How to run:**
```bash
chmod +x scripts/restore-oauth.sh
./scripts/restore-oauth.sh --env prod
```

**Required parameters:**
- `--env prod` or `--env dev` — specifies which environment configuration to apply

**What the script modifies:**
1. Updates Supabase redirect URIs to match the production/dev URLs listed above
2. Restores original OAuth client secrets from backup (referenced via `scripts/restore-oauth.sh` environment)
3. Runs database migrations to reset auth configuration to the centralized setup
4. Clears any cached auth state to force re-authentication with corrected URLs

---

**Bottom Line**: Your centralized OAuth system is excellent architecture. We just need to clean up the Supabase redirect URLs and fix the Vercel domain serving.

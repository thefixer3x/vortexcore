# 🚀 Netlify Deployment Guide - Fix All Issues

## 🔴 Current Issues & Solutions

### Issue 1: Netlify Dev Blank Page
**Problem**: `netlify dev` shows blank page with MIME type errors
**Cause**: Netlify dev server not properly proxying to Vite

### Issue 2: JavaScript MIME Type Errors
**Problem**: "text/html is not a valid JavaScript MIME type"
**Cause**: Server returning HTML instead of JS files

## ✅ Quick Fixes

### Fix 1: Use Separate Dev Servers
Instead of `netlify dev`, run:

```bash
# Terminal 1: Start Vite
bun run dev

# Terminal 2: Test at
http://localhost:5173
```

### Fix 2: Deploy to Production Netlify
```bash
# Build first
bun run build

# Deploy to Netlify
netlify deploy --prod --dir=dist
```

### Fix 3: Use the Fixed Dev Script
```bash
# This starts both servers properly
./netlify-dev-fix.sh
```

## 🌐 Direct Netlify Deploy

### Option A: CLI Deploy
```bash
# Login to Netlify (if not already)
netlify login

# Link to existing site or create new
netlify link

# Build and deploy
bun run build
netlify deploy --prod --dir=dist
```

### Option B: Git-based Deploy
```bash
# Push to GitHub
git add -A
git commit -m "fix: Netlify configuration and environment setup"
git push origin main

# Netlify will auto-deploy from GitHub
```

## 🔧 Environment Variables Setup

### For Netlify Dashboard:
1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Select your site
3. **Site Settings** → **Environment Variables**
4. Add these variables:

```
VITE_SUPABASE_URL=https://mxtsdgkwzjzlttpotole.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14dHNkZ2t3emp6bHR0cG90b2xlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxMDUyNTksImV4cCI6MjA2MjY4MTI1OX0.2KM8JxBEsqQidSvjhuLs8HCX-7g-q6YNswedQ5ZYq3g
OPENAI_API_KEY=your-actual-openai-key
PERPLEXITY_API_KEY=pplx-REDACTED
```

## 🧪 Testing Strategy

### 1. Local Testing (Recommended)
```bash
# Use Vite directly - most reliable
bun run dev
# Test at: http://localhost:5173
```

### 2. Production Testing
```bash
# Build and preview locally
bun run build
bun run preview
# Test at: http://localhost:4173
```

### 3. Netlify Production
```bash
# Deploy to Netlify
netlify deploy --prod --dir=dist
# Test at: your-netlify-url.netlify.app
```

## 🔍 Debugging Netlify Issues

### Check Build Logs
```bash
# View build logs
netlify logs

# View function logs
netlify functions:logs
```

### Common Issues & Fixes

#### Issue: "Command not found: bun"
**Fix**: Netlify needs to install Bun
```toml
# In netlify.toml
[build]
  command = "npm install -g bun && bun install --frozen-lockfile && bun run build"
```

#### Issue: Environment variables not working
**Fix**: Check variable names start with `VITE_` for client-side access

#### Issue: 404 on routes
**Fix**: Ensure redirects are configured
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## 🎯 Recommended Deployment Flow

### For Development:
1. **Local**: `bun run dev` (port 5173)
2. **Testing**: Use Vercel (already working)
3. **Production**: Netlify with proper env vars

### For Production:
1. **Primary**: Vercel (working perfectly)
2. **Secondary**: Netlify (for redundancy)
3. **Testing**: Local preview build

## 🚀 Quick Deploy Commands

### Deploy to Netlify Now:
```bash
# Quick deploy
bun run build && netlify deploy --prod --dir=dist

# With site linking
netlify link --name vortexcore-app
bun run build
netlify deploy --prod --dir=dist
```

### Deploy to Vercel (Backup):
```bash
# Vercel is working fine
vercel --prod
```

## 📱 User Testing URLs

Once deployed, share these URLs:

- **Vercel**: `https://your-app.vercel.app` ✅ Working
- **Netlify**: `https://your-app.netlify.app` ⚠️ Needs env vars
- **Test Auth**: Add `/test-auth` to any URL

## 🔧 Final Checklist

Before sharing with users:

- [ ] Environment variables set in Netlify dashboard
- [ ] Build completes without errors
- [ ] `/test-auth` page works
- [ ] Authentication flow works
- [ ] Dashboard loads (even with placeholder data)
- [ ] No 404 errors on navigation
- [ ] Currency shows as ₦

---

**Bottom Line**: Use Vercel for now (it's working), fix Netlify env vars for redundancy, and use local Vite dev server for development.

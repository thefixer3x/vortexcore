# 🏗️ Multi-Project Auth Strategy & Prevention Guide

## 🚨 **What Happened & How to Prevent It**

### **The Issue:**
Our recent auth fixes accidentally overwrote your existing multi-project auth ecosystem, breaking:
- Central auth system at `api.lanonasis.com`
- OAuth redirects for Twitter and other providers
- Custom domain serving at `me.vortexcore.app`
- Cross-project authentication flow

### **Root Cause:**
We applied VortexCore-specific auth fixes globally without considering your existing centralized auth architecture.

---

## ✅ **Immediate Restoration Steps**

### 1. **Run Restoration Script:**

The restoration script `restore-original-auth.sh` must be located in the same directory as this document (or created if missing). It reverts auth config files, restores original OAuth keys, resets environment variables, and replaces modified config files with backups.

**To create the script** (if it doesn't exist), save the following as `restore-original-auth.sh` in the `scripts/` directory and make it executable with `chmod +x scripts/restore-original-auth.sh`:

```bash
#!/bin/bash
# restore-original-auth.sh - Restores the repo to the original single-project auth configuration
# Usage: ./restore-original-auth.sh [--skip-backup]
# Prerequisites: backup files must exist (e.g., .env.backup.YYYYMMDDHHMMSS)
# End state: Reapplies original config files/credentials and restores single-project auth
```

**To run the script:**
```bash
chmod +x scripts/restore-original-auth.sh  # ensure execute permission
./restore-original-auth.sh
```

### 2. **Manual Supabase Configuration:**

#### **Site URL:**
```
https://api.lanonasis.com
```

#### **Redirect URLs (Replace ALL current ones):**
```
https://api.lanonasis.com/auth/callback
https://api.lanonasis.com/auth/callback?return_to=vortexcore
https://me.vortexcore.app/dashboard
https://me.vortexcore.app/auth/callback
https://lanonasis.supabase.co/auth/callback
http://localhost:5173/dashboard
http://localhost:5173/auth/callback
```

#### **OAuth Providers:**
- **Twitter**: `https://api.lanonasis.com/auth/callback?return_to=vortexcore`
- **Other providers**: Follow the same callback URL structure: `https://api.lanonasis.com/auth/callback?return_to=<project_name>` where `<project_name>` is the URL-encoded project slug (e.g., `vortexcore`). Register the exact callback URL in each OAuth provider's settings.

### 3. **Fix Vercel Custom Domain:**

#### **Check Domain Status:**
```bash
vercel domains ls
vercel domains inspect me.vortexcore.app
```

#### **If Domain Not Configured:**
```bash
# Replace team_thefixers with your actual Vercel team slug
# Find your team slug via: vercel teams ls
vercel domains add me.vortexcore.app --scope=YOUR_TEAM_SLUG
```

#### **DNS Configuration:**
Ensure `me.vortexcore.app` has CNAME pointing to:
```
cname.vercel-dns.com
```

---

## 🛡️ **Prevention Strategy for Future**

### **1. Environment-Based Auth Configuration**

Create separate auth configs for different environments:

```typescript
// src/utils/auth-environments.ts
const AUTH_CONFIGS = {
  development: {
    siteUrl: 'http://localhost:5173',
    redirectUrls: ['http://localhost:5173/dashboard'],
    useLocalAuth: true
  },
  vortexcore_standalone: {
    siteUrl: 'https://me.vortexcore.app',
    redirectUrls: ['https://me.vortexcore.app/dashboard'],
    useLocalAuth: true
  },
  vortexcore_integrated: {
    siteUrl: 'https://api.lanonasis.com',
    redirectUrls: ['https://api.lanonasis.com/auth/callback?return_to=vortexcore'],
    useLocalAuth: false,
    centralAuthUrl: 'https://api.lanonasis.com'
  }
};

export const getAuthConfig = () => {
  const env = process.env.VITE_AUTH_MODE || 'vortexcore_integrated';
  return AUTH_CONFIGS[env];
};
```

### **2. Feature Flags for Auth Methods**

```typescript
// src/utils/feature-flags.ts
export const FEATURE_FLAGS = {
  USE_MAGIC_LINKS: process.env.VITE_ENABLE_MAGIC_LINKS === 'true',
  USE_CENTRAL_AUTH: process.env.VITE_USE_CENTRAL_AUTH !== 'false',
  ENABLE_OAUTH: process.env.VITE_ENABLE_OAUTH === 'true'
};
```

### **3. Configuration Backup System**

Two scripts manage auth configuration backups. They should be placed in the `scripts/` directory.

**`backup-auth-config.sh`** - Backs up auth DB dumps, identity-provider configs, env vars, TLS certs, and related YAMLs.
```bash
# Create backup before any auth changes
./scripts/backup-auth-config.sh
```

**`restore-auth-config.sh [backup-date]`** - Restores from a timestamped backup (e.g., `.env.backup.YYYYMMDDHHMMSS`).
```bash
# Restore if needed
./scripts/restore-auth-config.sh 20251122_120000
```

**Usage:** Both scripts require execute permission (`chmod +x scripts/backup-auth-config.sh scripts/restore-auth-config.sh`).

**What gets backed up/restored:**
- Auth database dumps (`auth_backup_*.sql`)
- Supabase identity provider configuration
- Environment variables (VITE_* auth-related vars)
- TLS/SSL certificates (if applicable)
- Related YAML configuration files

### **4. Staged Deployment Strategy**

> **Note:** This is a simplified/pseudocode example. For a complete GitHub Actions workflow, see `.github/workflows/staged-auth-deploy.yml`.

```yaml
# .github/workflows/staged-auth-deploy.yml (reference only)
on:
  push:
    branches: [development, staging, main]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Bun
        run: npm install -g bun
      - name: Install dependencies
        run: bun install
      - name: Build
        run: bun run build

  test:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run tests
        run: bun test

  deploy-development:
    needs: test
    if: github.ref == 'refs/heads/development'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to development
        run: echo "Deploying to development..."

  deploy-staging:
    needs: test
    if: github.ref == 'refs/heads/staging'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to staging
        run: echo "Deploying to staging..."

  deploy-production:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy to production
        run: echo "Deploying to production..."
```

---

## 🏗️ **Recommended Architecture**

### **Option 1: Hybrid Auth System**
- **VortexCore Standalone**: Direct Supabase auth for `me.vortexcore.app`
- **Multi-Project Integration**: Central auth through `api.lanonasis.com`
- **Environment Variable**: Switch between modes

### **Option 2: Central Auth with Project Tokens**
- All auth goes through `api.lanonasis.com`
- Each project gets JWT tokens from central system
- VortexCore validates tokens locally

### **Option 3: Federated Auth**
- Each project has its own auth
- Central system manages cross-project SSO
- OAuth providers configured per project

---

## 📋 **Configuration Checklist**

### **Before Making Auth Changes:**
- [ ] Backup current Supabase auth settings
- [ ] Document all redirect URLs
- [ ] Test on development environment first
- [ ] Verify custom domains are working
- [ ] Check OAuth provider configurations

### **After Making Auth Changes:**
- [ ] Test all auth flows (signup, login, OAuth)
- [ ] Verify custom domain serving
- [ ] Check cross-project redirects
- [ ] Test magic links from email
- [ ] Validate OAuth provider flows

---

## 🔧 **Quick Fixes for Current Issues**

### **1. Custom Domain Not Serving:**
```bash
# Check domain configuration
vercel domains inspect me.vortexcore.app

# If not configured, add it
vercel domains add me.vortexcore.app

# Verify DNS
dig me.vortexcore.app CNAME
```

### **2. OAuth "Invalid Path" Error:**
The error occurs because OAuth providers are trying to redirect to wrong URLs.

**Fix in Supabase Dashboard:**
1. Go to Authentication > Providers > Twitter
2. Update redirect URL to: `https://api.lanonasis.com/auth/callback?return_to=vortexcore`

### **3. Restore Multi-Project Flow:**
```bash
# Run the restoration script
./restore-original-auth.sh

# Then manually update Supabase settings as instructed
```

---

## 📞 **Emergency Rollback Plan**

If something breaks during restoration:

### **1. Immediate Rollback:**
```bash
# List available backups to identify the correct timestamp
ls -la .env.backup.*

# Restore from backup (replace [timestamp] with the chosen filename)
cp .env.backup.[timestamp] .env

# Revert auth configuration files
git checkout HEAD~1 -- src/utils/auth-config.ts src/hooks/use-auth-fix.ts

# Verify rollback succeeded by starting the app and checking key env vars
npm run dev
# or run an env-check script to confirm .env values are restored
```

### **2. Supabase Quick Restore:**
```
Site URL: https://api.lanonasis.com
Redirect URLs: https://api.lanonasis.com/auth/callback?return_to=vortexcore
```

### **3. Domain Quick Fix:**
```bash
# Force domain reconfiguration
vercel domains rm me.vortexcore.app
vercel domains add me.vortexcore.app
```

---

## 🎯 **Long-term Solution**

### **1. Create Auth Service Layer**
Abstract auth logic so changes don't affect multiple projects.

### **2. Use Infrastructure as Code**
Store auth configurations in version control.

### **3. Implement Monitoring**
Set up alerts for auth failures across projects.

### **4. Documentation**
Maintain clear documentation of all auth flows and dependencies.

---

**Bottom Line**: Your multi-project auth system is sophisticated and requires careful handling. The restoration script will fix the immediate issues, but we need to implement proper safeguards to prevent this in the future.

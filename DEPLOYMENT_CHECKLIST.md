# 🚀 VortexCore Deployment Checklist

**Last Updated:** November 22, 2025
**Status:** CRITICAL TASKS AUTOMATED - Manual configuration required

This checklist contains all remaining steps to complete launch readiness. Most critical blockers have been fixed automatically, but some require manual configuration.

---

## ✅ COMPLETED (Automated Fixes)

- [x] Database migration for missing tables created (`20251122_create_missing_core_tables.sql`)
- [x] Error boundary enabled in App.tsx
- [x] Security headers configured in Netlify
- [x] Security headers configured in Vercel
- [x] RLS policies created for all core tables
- [x] Currency system fully implemented
- [x] Subscription section responsive design fixed
- [x] Workflow branch mismatch bug fixed

---

## 🔴 CRITICAL - Must Complete Before Launch

### 1. Run Database Migration (30 minutes)

**Status:** READY TO APPLY
**File:** `/supabase/migrations/20251122_create_missing_core_tables.sql`

**Steps:**
```bash
# Option A: Via Supabase CLI (Recommended)
npx supabase db push

# Option B: Via Supabase Dashboard
1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT/sql
2. Copy contents of 20251122_create_missing_core_tables.sql
3. Paste and click "Run"
4. Verify all 7 tables created: wallets, transactions, conversations,
   ai_chat_sessions, child_profiles, vortex_settings, stripe_customers
```

**Verification:**
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('wallets', 'transactions', 'conversations',
                     'ai_chat_sessions', 'child_profiles',
                     'vortex_settings', 'stripe_customers');
```

Should return 7 rows.

---

### 2. Update GitHub Secrets (15 minutes)

**Status:** PLACEHOLDER VALUES NEED REPLACEMENT

Go to: https://github.com/YOUR_ORG/vortexcore/settings/secrets/actions

**Required Updates:**

| Secret | How to Get It | Current Status |
|--------|---------------|----------------|
| `VERCEL_TOKEN` | Vercel Dashboard → Settings → Tokens → Create | ❌ Placeholder |
| `VERCEL_ORG_ID` | Vercel Dashboard → Settings → General | ❌ Placeholder |
| `VERCEL_PROJECT_ID` | Vercel Project → Settings → General | ❌ Placeholder |
| `TEST_USER_A_JWT` | Create test user in Supabase + get JWT | ❌ Placeholder |
| `TEST_USER_B_JWT` | Create second test user + get JWT | ❌ Placeholder |

**How to get TEST_USER JWT:**
```bash
# 1. Create test users via Supabase Dashboard
# 2. Get JWT token:
curl -X POST 'https://YOUR_PROJECT.supabase.co/auth/v1/token?grant_type=password' \
  -H 'apikey: YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"email":"testuser@example.com","password":"testpassword123"}'

# Extract access_token from response
```

---

### 3. Set Up Error Tracking (1 hour)

**Status:** ERROR BOUNDARY ENABLED - Monitoring service needed

**Option A: Sentry (Recommended)**

1. Create free account: https://sentry.io/signup/
2. Create new project → Select "React"
3. Install Sentry:
   ```bash
   bun add @sentry/react
   ```

4. Initialize in `src/main.tsx` (before ReactDOM.render):
   ```typescript
   import * as Sentry from "@sentry/react";

   if (import.meta.env.PROD) {
     Sentry.init({
       dsn: "YOUR_SENTRY_DSN",
       environment: import.meta.env.MODE,
       tracesSampleRate: 1.0,
       replaysSessionSampleRate: 0.1,
       replaysOnErrorSampleRate: 1.0,
     });
   }
   ```

5. Add to `ErrorBoundary.tsx` (already has placeholder):
   ```typescript
   // In componentDidCatch, Sentry is already configured to report
   // Just set window.Sentry after initialization
   ```

**Option B: LogRocket (Alternative)**

1. Uncomment LogRocket code in `src/main.tsx`
2. Update project ID in LogRocket.init()
3. Deploy

---

### 4. Configure Rate Limiting (2-3 hours)

**Status:** NOT IMPLEMENTED - Required for production

**Option A: Supabase Edge Functions Rate Limiting**

Create `supabase/functions/rate-limiter/index.ts`:
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const rateLimit = new Map<string, number[]>();
const WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS = 100;

serve(async (req) => {
  const userId = req.headers.get('x-user-id') || req.headers.get('x-forwarded-for');

  if (!userId) return new Response('Unauthorized', { status: 401 });

  const now = Date.now();
  const userRequests = rateLimit.get(userId) || [];
  const recentRequests = userRequests.filter(time => now - time < WINDOW_MS);

  if (recentRequests.length >= MAX_REQUESTS) {
    return new Response('Rate limit exceeded', {
      status: 429,
      headers: { 'Retry-After': '60' }
    });
  }

  recentRequests.push(now);
  rateLimit.set(userId, recentRequests);

  return new Response('OK', { status: 200 });
});
```

**Option B: Netlify/Vercel Rate Limiting**

For Netlify, add to `netlify.toml`:
```toml
[[edge_functions]]
  function = "rate-limiter"
  path = "/api/*"
```

---

## 🟠 HIGH PRIORITY - Complete Within Week 1

### 5. Test Coverage Improvement (1-2 weeks)

**Current:** 70%
**Target:** 85%+

**Missing Tests:**
- Payment flow tests (`/src/test/payments/`)
- Transaction creation tests
- Wallet management tests
- AI chat integration tests
- Error recovery tests

**Action:**
```bash
# Run coverage report
bun run test:coverage

# Identify untested files
# Write tests for critical paths first:
# - src/hooks/use-dashboard-data.ts
# - src/contexts/CurrencyContext.tsx
# - Payment/transaction components
```

---

### 6. Production Monitoring Setup (2 hours)

**Status:** Partial - Docker stack configured but not production

**Required:**
1. **Application Performance Monitoring (APM)**
   - Set up Sentry Performance Monitoring
   - OR use Vercel/Netlify Analytics

2. **Uptime Monitoring**
   - Set up https://uptimerobot.com/ (free)
   - Monitor: `/`, `/api/health`, `/dashboard`

3. **Error Alerts**
   - Configure Sentry email alerts for errors
   - Set up Slack/Discord webhooks

**Sentry Alerts:**
- Go to Sentry → Alerts → Create Alert Rule
- Trigger: When error count > 10 in 5 minutes
- Action: Send email + Slack notification

---

### 7. Security Audit & Penetration Testing (1 week)

**Status:** Headers configured - Security scan needed

**Steps:**
1. Run automated security scan:
   ```bash
   # Using OWASP ZAP
   docker run -t owasp/zap2docker-stable zap-baseline.py \
     -t https://your-deployment.netlify.app
   ```

2. Manual security checklist:
   - [ ] All API endpoints require authentication
   - [ ] RLS policies tested for data isolation
   - [ ] CSRF protection enabled (Supabase handles this)
   - [ ] XSS prevention tested
   - [ ] SQL injection tested (Supabase parameterized queries)
   - [ ] Secrets not exposed in client bundle
   - [ ] HTTPS enforced (check HSTS header)

3. Third-party security audit (Optional but recommended)
   - Use https://www.hackerone.com/ for bug bounty
   - OR hire security firm for penetration test

---

## 🟡 MEDIUM PRIORITY - Complete Within Weeks 2-3

### 8. Complete "Coming Soon" Features

**Files to update:**
- `/src/App.tsx` - Remove ComingSoon components
- Implement or remove:
  - User Management (`/users`)
  - Notifications page
  - Security settings page
  - Help & Support page

**Decision:**
- Option A: Implement features (2-3 weeks)
- Option B: Remove from navigation (1 hour)

---

### 9. Performance Optimization

**Current:** 2.1s load time
**Target:** <1.5s

**Actions:**
1. Code splitting:
   ```typescript
   // In App.tsx, use React.lazy for routes
   const Dashboard = React.lazy(() => import('./pages/Dashboard'));
   const Insights = React.lazy(() => import('./pages/Insights'));
   ```

2. Bundle analysis:
   ```bash
   bun run build --analyze
   ```

3. Optimize images:
   - Convert to WebP
   - Add lazy loading
   - Use responsive images

4. CDN configuration:
   - Netlify/Vercel automatically use CDN
   - Verify cache headers are set

---

### 10. Documentation Completion

**Missing:**
- [ ] CONTRIBUTING.md (how to contribute)
- [ ] CODE_OF_CONDUCT.md (community guidelines)
- [ ] API_DOCUMENTATION.md (API endpoints)
- [ ] USER_GUIDE.md (end-user documentation)

**Templates available at:**
- https://www.contributor-covenant.org/ (Code of Conduct)
- https://github.com/github/docs-example (CONTRIBUTING template)

---

## ⚪ LOW PRIORITY - Nice to Have

### 11. Analytics & Business Intelligence

- Google Analytics / Plausible setup
- Conversion funnel tracking
- User behavior analytics
- Revenue tracking

### 12. Backup & Recovery Testing

**Status:** No documented backup strategy

**Required:**
1. Supabase automated backups (check settings)
2. Manual backup procedure documented
3. Recovery process tested
4. Backup retention policy defined

**Action:**
```sql
-- Test backup restore in dev environment
-- Document procedure in BACKUP_RECOVERY.md
```

### 13. Load Testing

**Status:** Not performed

**Tools:**
- k6: https://k6.io/
- Artillery: https://www.artillery.io/
- Apache JMeter

**Test scenarios:**
- 100 concurrent users
- 1000 requests/minute
- Database connection pool limits

---

## 📋 Launch Day Checklist

### Pre-Launch (T-24 hours)
- [ ] All critical tasks completed above
- [ ] Database migrations applied to production
- [ ] Secrets updated in GitHub
- [ ] Error tracking verified working
- [ ] Monitoring dashboards configured
- [ ] Security headers verified in production
- [ ] SSL certificate valid
- [ ] DNS configured correctly
- [ ] Team notified of launch

### Launch (T-0)
- [ ] Deploy to production (Netlify/Vercel)
- [ ] Smoke test critical flows:
  - [ ] User registration
  - [ ] Login/logout
  - [ ] Create wallet
  - [ ] Create transaction
  - [ ] AI chat works
  - [ ] Settings save correctly
- [ ] Monitor error logs for 1 hour
- [ ] Check performance metrics
- [ ] Verify all external services (Stripe, APIs) working

### Post-Launch (T+24 hours)
- [ ] Review error logs
- [ ] Check performance metrics
- [ ] Gather user feedback
- [ ] Address any critical bugs
- [ ] Update status page (if applicable)

---

## 🚨 Emergency Rollback Plan

If critical issues occur:

1. **Immediate rollback:**
   ```bash
   # Netlify
   netlify rollback

   # Vercel
   vercel rollback
   ```

2. **Database rollback:**
   ```sql
   -- Revert last migration if needed
   -- Contact Supabase support for assistance
   ```

3. **Communication:**
   - Update status page
   - Email affected users
   - Post on social media
   - Document incident in INCIDENT_RESPONSE.md

---

## 📞 Support Contacts

| Service | Support Channel | SLA |
|---------|----------------|-----|
| Supabase | support@supabase.io | 24-48h |
| Netlify | https://answers.netlify.com/ | 24h |
| Vercel | vercel.com/support | 24h |
| Stripe | https://support.stripe.com/ | 12-24h |

---

## 📊 Success Metrics

Track these KPIs post-launch:

- **Uptime:** Target 99.9%
- **Error rate:** < 0.1%
- **Page load time:** < 1.5s (p95)
- **API response time:** < 500ms (p95)
- **User satisfaction:** > 4.5/5 stars

---

**Generated:** November 22, 2025
**Next Review:** Weekly until launch, monthly after

# GitHub Project Setup Guide for VortexCore (Updated)

## What Changed Recently

- Added dynamic Edge middleware (CORS + security headers + JWT) and applied to Stripe, OpenAI functions, and ai-router.
- Enforced JWT + RBAC on Stripe Edge Function with ownership checks; added idempotency key handling.
- Tightened database privileges: revoked ALL from `anon` on key RLS tables; granted minimal privileges to `authenticated` (RLS still enforced).
- Fixed SSE headers and preflight handling for ai-router; unified CORS across functions.
- CI: Playwright OS deps installed; launch readiness computes PASS/FAIL from job results and fails on failures.

## Roadmap (Now → Next)

- RBAC: Extend per-action roles on Stripe (admin/compliance for sensitive PAN access; self-service for user-owned resources). Add rate limiting and idempotency usage across mutations.
- CORS: Adopt middleware across all functions for consistent Origin reflection and `Vary: Origin`.
- RLS: Seed test users and add a deny-by-default validation matrix with executable SQL and/or API tests.
- Observability: Expand audit logs for AI and payments without PII.

## Quick Setup Steps

### 1. Create GitHub Project
1. Go to your repository: `https://github.com/thefixer3x/vortex-core-app`
2. Click **Projects** tab
3. Click **New Project**
4. Choose **Team planning** template
5. Name: `VortexCore Launch Readiness`
6. Description: `Consumer launch readiness tracking for VortexCore`

### 2. Configure Project Views

#### Board View Setup
Create 5 columns:
- **📋 Backlog** (Phase planning)
- **🚀 Phase 1: Testing** (In progress testing tasks)
- **🎯 Phase 2: Features** (In progress feature tasks)  
- **🔒 Phase 3: Security** (In progress security tasks)
- **✅ Done** (Completed tasks)

#### Timeline View Setup
Create 5 milestones:
- **Phase 1: Foundation Testing** (Week 1-2)
- **Phase 2: Feature Enhancement** (Week 3-5)
- **Phase 3: Security Hardening** (Week 4-6)
- **Phase 4: User Testing** (Week 6-8)
- **Phase 5: Launch Validation** (Week 8-10)

### 3. Import Issues from Plan

Copy these commands and run them one by one to create issues:

```bash
# Phase 1 Issues
gh issue create --title "[Phase 1] Configure Bun Test Environment" --body "Setup Vitest configuration for component tests" --label "phase-1,testing,critical"

gh issue create --title "[Phase 1] Setup Playwright E2E Testing" --body "Install and configure Playwright with Bun for end-to-end testing" --label "phase-1,testing,critical"

gh issue create --title "[Phase 1] Create Authentication Flow Tests" --body "Test login/logout functionality, registration, password reset" --label "phase-1,testing,critical"

gh issue create --title "[Phase 1] Test OpenAI Chat Component" --body "Test AI chat functionality, error handling, streaming responses" --label "phase-1,testing,high"

gh issue create --title "[Phase 1] Test Dashboard Components" --body "Test data loading, display, responsive design, navigation" --label "phase-1,testing,high"

# Phase 2 Issues
gh issue create --title "[Phase 2] Implement User Onboarding Flow" --body "Create welcome screens, profile setup wizard, feature tutorials" --label "phase-2,feature,high"

gh issue create --title "[Phase 2] Enhance Dashboard Features" --body "Add real-time notifications, customizable widgets, data export" --label "phase-2,feature,high"

gh issue create --title "[Phase 2] Optimize Mobile Experience" --body "Touch-optimized interactions, mobile navigation, PWA capabilities" --label "phase-2,feature,medium"

gh issue create --title "[Phase 2] Implement Two-Factor Authentication" --body "Add 2FA support with TOTP and backup codes" --label "phase-2,security,high"

# Phase 3 Issues  
gh issue create --title "[Phase 3] Implement Security Headers" --body "Add CSP, HSTS, X-Frame-Options, X-Content-Type-Options" --label "phase-3,security,critical"

gh issue create --title "[Phase 3] Setup Input Validation & Sanitization" --body "Client and server-side validation, XSS protection, CSRF protection" --label "phase-3,security,critical"

gh issue create --title "[Phase 3] Conduct Security Testing" --body "SAST, DAST, penetration testing, vulnerability scanning" --label "phase-3,security,critical"

gh issue create --title "[Phase 3] GDPR Compliance Implementation" --body "Data subject rights, consent management, data processing records" --label "phase-3,compliance,high"

# Phase 4 Issues
gh issue create --title "[Phase 4] Create In-App Feedback System" --body "Feedback forms, screenshot capture, bug reporting workflow" --label "phase-4,feedback,high"

gh issue create --title "[Phase 4] Setup Analytics & Monitoring" --body "User behavior tracking, performance monitoring, error tracking" --label "phase-4,analytics,high"

gh issue create --title "[Phase 4] Launch UAT Testing Program" --body "Recruit testers, create scenarios, collect feedback" --label "phase-4,testing,high"

# Phase 5 Issues
gh issue create --title "[Phase 5] Implement Load Testing" --body "User load simulation, database performance testing, scalability testing" --label "phase-5,performance,critical"

gh issue create --title "[Phase 5] Setup Production Monitoring" --body "Application monitoring, error tracking, business metrics dashboards" --label "phase-5,monitoring,critical"

gh issue create --title "[Phase 5] Complete Launch Readiness Checklist" --body "Feature completeness, security audit, performance benchmarks" --label "phase-5,launch,critical"
```

### 4. Configure Automation Rules

In your project settings, add these automation rules:

#### Rule 1: Auto-assign to phases
- **When**: Issue is created with label `phase-1`
- **Then**: Set status to `Phase 1: Testing`

#### Rule 2: Move completed items  
- **When**: Issue is closed
- **Then**: Set status to `Done`

#### Rule 3: Track progress
- **When**: Issue status changes to `In Progress`  
- **Then**: Set assignee to current user

### 5. Setup Project Labels

Create these labels in your repository:

**Phase Labels:**
- `phase-1` (Blue) - Foundation Testing & Validation
- `phase-2` (Green) - Feature Enhancement & Completion  
- `phase-3` (Red) - Security Hardening & Compliance
- `phase-4` (Purple) - User Testing & Feedback
- `phase-5` (Orange) - Launch Validation & Prep

**Priority Labels:**
- `critical` (Dark Red) - Must be completed for launch
- `high` (Red) - Important for launch success
- `medium` (Yellow) - Nice to have
- `low` (Light Gray) - Future enhancement

**Type Labels:**
- `testing` (Light Blue) - Testing related tasks
- `feature` (Green) - New feature development
- `security` (Red) - Security hardening
- `compliance` (Purple) - Regulatory compliance
- `performance` (Orange) - Performance optimization

### 6. Link to CI/CD Pipeline

The GitHub Actions workflow (`launch-readiness-ci.yml`) will automatically run validation for each phase. Issues will be automatically updated based on test results.

### 7. Progress Tracking

**Daily Standup Questions:**
1. What Phase tasks did you complete yesterday?
2. What Phase tasks are you working on today?
3. Are there any blockers preventing phase completion?

**Weekly Phase Review:**
- Review phase completion percentage
- Identify blockers and dependencies  
- Adjust timeline if needed
- Celebrate completions

### 8. Success Metrics Dashboard

Track these metrics in your project:
- **Phase Completion**: % of tasks completed per phase
- **Timeline Adherence**: On-time vs delayed tasks
- **Quality Gates**: Pass/fail status of validation tests  
- **Risk Items**: High-priority issues and blockers

## Supabase and Vercel Setup

### Supabase
- Apply new migrations and deploy functions:
```bash
supabase link --project-ref <PROJECT_REF>
supabase db push
supabase functions deploy stripe ai-router openai-chat openai-assistant
```
- Ensure secrets are set: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`.

### Vercel
- Add `.vercel` to `.gitignore` (already updated here) and link locally:
```bash
vercel link   # select existing org/project
vercel env pull .env  # optional: sync envs locally
```
- Build and preview to verify nothing breaks:
```bash
bun install
bun run build
vercel deploy --prebuilt
```

## RBAC, CORS, and RLS: Next Steps

### RBAC (Stripe)
- Enforce privileged roles for `get_card_details` (admin/compliance only) [done].
- Add rate limiting and require `x-idempotency-key` for all mutations.
- Consider an `issuer` role for card creation; otherwise restrict to self-service with ownership checks [done for reads/updates].

### CORS
- Middleware adopted for `stripe`, `ai-router`, `openai-chat`, `openai-assistant` [done].
- Adopt for any remaining functions to ensure dynamic Origin reflection and `Vary: Origin`.

### RLS
- Migration tightened privileges [done].
- Add seed data and validation scripts to prove deny-by-default across users/tenants.

## Testing Infrastructure

- E2E: Playwright configured with OS deps in CI; run locally with:
```bash
bunx playwright install-deps
bunx playwright install
bun run test:e2e
```
- New API tests:
  - `src/test/e2e/api-stripe.spec.ts` (401 without Authorization)
  - `src/test/e2e/api-cors.spec.ts` (OPTIONS preflight with Origin + Vary)
- Add protected-route and error-page tests as routes stabilize.

## Quick Commands Reference

```bash
# View project status
gh project list

# View issues by phase
gh issue list --label "phase-1"

# Close completed issue
gh issue close [issue-number] --comment "Task completed successfully"

# Add issue to project
gh issue create --title "New task" --label "phase-2,feature" --assignee @me
```

## Contact for Support

If you need help setting up the GitHub project or have questions about the implementation plan, please reach out through the repository issues or discussions.

---

This structured approach will give you complete visibility and control over the launch readiness process with automated tracking and reporting.

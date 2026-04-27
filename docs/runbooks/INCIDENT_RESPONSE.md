# 🚨 Incident Response Plan

**Version:** 1.0
**Last Updated:** November 22, 2025
**Owner:** VortexCore Security Team

---

## 1. Incident Classification

### Severity Levels

| Level | Description | Response Time | Examples |
|-------|-------------|---------------|----------|
| **P0 - Critical** | Service down, data breach, security exploit | < 15 minutes | Complete outage, active security breach, data loss |
| **P1 - High** | Major feature broken, performance degraded severely | < 1 hour | Payment processing down, authentication failing |
| **P2 - Medium** | Non-critical feature broken, minor security issue | < 4 hours | Search not working, UI bugs, slow performance |
| **P3 - Low** | Cosmetic issues, minor bugs | < 24 hours | Typos, minor UI glitches, non-critical features |

---

## 2. Incident Response Team

### Roles & Responsibilities

**Incident Commander (IC)**
- Overall incident coordination
- Decision-making authority
- External communications

**Technical Lead**
- Root cause analysis
- Technical remediation
- Post-mortem owner

**Communications Lead**
- User notifications
- Status page updates
- Stakeholder communications

**On-Call Rotation**
- 24/7 coverage required for P0/P1
- Rotation schedule in PagerDuty/Opsgenie

---

## 3. Response Procedures

### P0 - Critical Incident

**Detection:**
- Monitoring alerts (Sentry, Uptime monitors)
- User reports via support
- Team member discovery

**Immediate Actions (0-15 minutes):**
1. Acknowledge incident in monitoring system
2. Page on-call engineer
3. Create incident channel (#incident-YYYY-MM-DD)
4. Update status page: https://status.vortexcore.com
5. Assess severity and assign IC

**Resolution (15-60 minutes):**
1. IC assembles response team
2. Technical Lead investigates root cause
3. Implement immediate mitigation:
   - Roll back recent deployment
   - Disable problematic feature
   - Scale up infrastructure
   - Activate backup systems
4. Communications Lead notifies:
   - All users (email/in-app notification)
   - Social media (Twitter, Discord)
   - Major customers (direct outreach)

**Post-Incident (1-24 hours):**
1. Conduct post-mortem meeting
2. Document timeline and root cause
3. Create follow-up tasks to prevent recurrence
4. Update runbooks and documentation
5. Send final status update to users

---

### P1 - High Priority Incident

**Response Time:** < 1 hour

**Actions:**
1. Create incident ticket in tracking system
2. Notify on-call team
3. Update status page (investigating)
4. Begin troubleshooting
5. Regular updates every 30 minutes
6. Deploy fix
7. Monitor for 2 hours post-fix
8. Close incident + brief post-mortem

---

### Security Incidents

**Special Procedures for Security Breaches:**

1. **Immediate Containment:**
   - Isolate affected systems
   - Revoke compromised credentials
   - Enable additional logging
   - Preserve evidence (don't delete logs)

2. **Assessment:**
   - Determine scope of breach
   - Identify compromised data
   - Check for ongoing unauthorized access

3. **Notification (within 72 hours if required):**
   - Affected users
   - Data protection authorities (GDPR)
   - Law enforcement (if criminal activity)

4. **Remediation:**
   - Patch vulnerabilities
   - Force password resets
   - Audit access logs
   - Implement additional security controls

5. **Legal & Compliance:**
   - Consult legal counsel
   - Document incident thoroughly
   - File required breach notifications

---

## 4. Communication Templates

### Status Page Update - Critical Outage

```
🔴 INVESTIGATING: VortexCore Platform Outage

We are currently investigating reports of users unable to access the platform.
Our team is actively working on a resolution.

Next update: [TIME]
Incident started: [TIME]
Status: Investigating

Updates will be posted here as we learn more.
```

### Email Template - Service Restoration

```
Subject: VortexCore Service Restored

Hi [User Name],

We're writing to let you know that the service disruption affecting VortexCore
has been resolved as of [TIME].

What happened:
[Brief description]

What we did:
[Resolution steps]

We apologize for any inconvenience this may have caused. If you continue to
experience issues, please contact support@vortexcore.com.

Thank you for your patience.

The VortexCore Team
```

---

## 5. Runbooks

### Common Issues & Solutions

#### Database Connection Errors

**Symptoms:** 502/504 errors, "Database connection failed"

**Solution:**
```bash
# 1. Check Supabase status
curl https://YOUR_PROJECT.supabase.co/rest/v1/

# 2. Check connection pool
# Go to Supabase Dashboard → Settings → Database → Connection pooling

# 3. Restart application (triggers new connections)
vercel redeploy --force

# 4. If persistent, contact Supabase support
```

---

#### Payment Processing Failures

**Symptoms:** Stripe webhooks failing, payments stuck in "pending"

**Solution:**
```bash
# 1. Check Stripe Dashboard for webhook delivery status
# https://dashboard.stripe.com/webhooks

# 2. Verify webhook endpoint is accessible
curl -X POST https://your-app.com/api/stripe-webhook \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# 3. Re-send failed webhook from Stripe Dashboard
# 4. If webhook secret rotated, update in environment variables
```

---

#### High Error Rate from Sentry

**Symptoms:** >100 errors/minute in Sentry

**Solution:**
```bash
# 1. Identify error pattern in Sentry dashboard
# 2. Check recent deployments (likely culprit)
# 3. Rollback if deployment-related
vercel rollback

# 4. If user-triggered, add error handling
# 5. If third-party API, check status pages
```

---

## 6. Monitoring & Alerts

### Critical Alerts

| Metric | Threshold | Action |
|--------|-----------|--------|
| Error rate | >1% | Page on-call |
| Response time | >2s (p95) | Investigate |
| Uptime | <99% | Page on-call |
| Failed payments | >5/hour | Check Stripe |
| Database CPU | >80% | Scale up |

### Alert Channels

- **PagerDuty:** P0/P1 incidents (SMS + Phone)
- **Slack #alerts:** All incidents
- **Email:** P2/P3 incidents
- **Sentry:** Application errors

---

## 7. Post-Mortem Template

```markdown
# Post-Mortem: [Incident Title]

**Date:** YYYY-MM-DD
**Severity:** P0/P1/P2/P3
**Duration:** Xh Ym
**Impact:** X users affected, Y transactions failed

## Timeline
- HH:MM - Incident detected
- HH:MM - Team paged
- HH:MM - Root cause identified
- HH:MM - Fix deployed
- HH:MM - Incident resolved

## Root Cause
[Technical explanation]

## Impact
- Users affected: X
- Revenue impact: $Y
- Reputation impact: Low/Medium/High

## What Went Well
- Quick detection
- Effective communication
- Fast resolution

## What Went Wrong
- Late detection
- Unclear runbook
- Slow rollback

## Action Items
- [ ] Update monitoring (Owner: X, Due: DATE)
- [ ] Improve runbook (Owner: Y, Due: DATE)
- [ ] Add tests (Owner: Z, Due: DATE)

## Lessons Learned
[Key takeaways]
```

---

## 8. Escalation Paths

### Technical Escalation
1. On-call engineer (0-15 min)
2. Engineering manager (15-30 min)
3. CTO (30-60 min)

### Business Escalation
1. Product manager (if feature-related)
2. Customer success (if user-facing)
3. CEO (if P0 + major business impact)

### External Escalation
- Supabase: support@supabase.io
- Netlify/Vercel: Emergency support
- Stripe: https://support.stripe.com/

---

## 9. Emergency Contacts

**Internal:**
- On-Call Engineering: [PagerDuty]
- Engineering Manager: [Phone]
- CTO: [Phone]
- CEO: [Phone]

**External:**
- Supabase Support: support@supabase.io
- Stripe Emergency: [Saved in password manager]
- Legal Counsel: [Phone]

---

## 10. Training & Drills

**Quarterly Incident Response Drills:**
- Simulate P0 outage
- Test communication channels
- Verify runbooks are current
- Update team on changes

**New Team Member Onboarding:**
- Review incident response plan
- Shadow on-call engineer
- Participate in post-mortem
- Complete incident response training

---

**Document Owner:** Security Team
**Review Cadence:** Quarterly
**Next Review:** February 2026

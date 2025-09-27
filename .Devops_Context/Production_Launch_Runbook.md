# Vortex Core v1.0.0-rc3 — Production Launch Runbook

Release window: Sunday 22:00 UTC • Strategy: Blue‑Green with Canary (10% → 50% → 100%) • Platforms: Web (Next.js), Mobile (RN/Expo), REST API • Regions: NG, UK, EU; pilot BR

## Owners & Contacts
- Release manager: <owner> • Channel: <slack/teams> • PagerDuty: <service>
- SRE primary: <owner> • SRE secondary: <owner>
- Eng leads: Wallet/Payments <owner> • Search <owner> • Mobile <owner>
- Support lead: <owner> • Comms/Marketing: <owner> • Product: <owner>

## Readiness & Go/No‑Go Criteria (must be TRUE)
- Tests green on rc3; coverage ≥80% unit / ≥80% integration / ≥75% e2e
- UAT ≥95% (actual 96%); 0 Sev‑1; Sev‑2s fixed or risk‑accepted in ticket
- Security: SAST/DAST/deps/container scans clean (no Highs); SBOM stored; secrets rotated (2025‑09‑09); pentest (Aug‑25) closed
- Data: `wallet_tx` migration additive; dry‑run <1 s; backups <24 h; restore RPO ≤5 min, RTO ≤15 min; AES‑256 at rest, TLS 1.3 in transit
- Ops: Runbook current; blue‑green+canary rehearsed; proven rollback ≤10 min; autoscaling policies active
- Product/Comms: UAT sign‑offs recorded; release notes & customer comms ready; CAB #4321 approved
- Mobile: builds signed; privacy labels/data safety set; phased release enabled

## Change Plan (high‑level)
1) Pre‑deploy (T‑2h)
   - Freeze at rc3; verify reproducible build + signatures + SBOM
   - Confirm vendor quotas (Stripe/Weavr/Prembly/OpenAI) and rate‑limits/circuit breakers
   - Pre‑scale cluster (target +20% headroom); warm caches; verify feature flags/kill switches present
   - Rehearse `wallet_tx` migration against prod snapshot; confirm <1 s and no long locks
2) Deploy blue‑green
   - Deploy new color via GitHub Actions → ArgoCD; run DB migration when new pods Ready (if not pre‑applied)
   - Keep previous color warm for ≥2h after 100%
3) Canary promotion gates
   - 10% for ≥30 min or ≥50k req (later): p95 ≤300 ms; p99 ≤400 ms; error ≤0.5%; checkout success ≥98%; KYC pass‑rate within 2% baseline; search p95 ≤250 ms; crash‑free ≥99.5%
   - 50% for ≥60 min with same gates → 100%
4) Mobile phased release (coordinate with backend): 10% → 25% → 50% → 100% over 24–48 h gated on KPIs

## Smoke & Functional Checks (block on failure)
- API/Web health: `GET /healthz` 200; `GET /readyz` 200
- Auth: signup/login; token refresh; session invalidation
- KYC (Prembly): happy‑path + failure case
- Wallet: top‑up, withdraw, idempotent retries; payment webhooks observed
- Marketplace search: query, filter, sort; relevance sanity
- Checkout: add to cart, pay, refund; success funnel ≥98%
- Feature flags: toggle wallet_sync/search; payments kill‑switch
- Scripts: `node smoke-test.js` and `npx playwright test --grep "@smoke"`

## Rollback Plan (execute immediately on triggers)
- Triggers (any): error rate >0.5% for 5 min; p95 >350 ms for 10 min; checkout success <97% for 10 min; dependency 5xx >3× baseline 5 min; crash‑free <99% over 30 min; any Sev‑1
- Actions:
  - Traffic: revert to last green color via ArgoCD: `argocd app rollback $ARGOCD_APP --to-revision $LAST_GREEN`
  - Flags: disable `wallet_sync`, `marketplace_search`; enable payments kill‑switch
  - Data: migration is additive; no rollback needed; verify no long‑running tx
  - Comms: post incident on status page; open Sev‑1/2 incident; assign IM

## Observability & Alerting
- Dashboards: latency (p50/p95/p99), error rate/route, checkout funnel, KYC pass/fail, dependency health, search latency, mobile crash‑free
- Alert thresholds: warn at 80% SLO; page on breach windows above; error‑budget burn alerts at 2%/5%/10%/h
- Synthetics: hourly global (NG/UK/EU/BR); 1‑min during canary

## Communications & Support
- Status page template ready; customer email queued; help center/FAQ updated
- Support playbooks for known issues (payments/KYC/search); L1→L2→Eng escalation; PD routes verified

## Evidence Links (update with real URLs)
- UAT: `vortexcore.app/dev/report` • Compliance: `vortexcore.app/compliance` • Dashboards: `vortexcore.app`

---
This is a one‑page operational guide. See `Canary_Checklist.json` for CI gates used to automate promotions/rollback.


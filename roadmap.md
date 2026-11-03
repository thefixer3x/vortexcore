# Current request
- [x] Replace AI icons and vendor-facing branding with VortexIQ / VortexDeepresearch.
- [x] Route active AI chats through ai-router and retain minimal personal context.
- [x] Verify updated routes, icon visibility, and chat request handling.
- [x] Locate company_endpoints and query_classifications for review.
- [x] Resolve the three listed access findings with owner/server-verified organization scoping; preserve unassigned legacy records privately.
# Obligations, admin and review (Oct 12)
- [x] List features in the codebase that aren't shown in the app.
- [x] Pay obligations from wallet (amount + date recorded, list updates).
- [x] Live obligations feed + auto-matching / auto re-scan on new transactions.
- [x] Admin screen: promote users, manage company projects.
- [x] Client records / query classifications / company endpoints: already scoped to owners or verified orgs.
- [x] First admin account — admin@lanonasis.com promoted.

# Supabase API key migration
- [x] Switch frontend and server clients to publishable/secret keys without changing access policies.
- [x] Redeploy affected functions; verify public auth/AI access, protected denials, isolated privileged SDK reads, and Supabase logs.
- [ ] Verify signed-in admin and wallet-payment flows in the browser — requires the user's signed-in session.

# Admin dashboard, statements, real AI (Nov 3)
- [x] Fix obligation/payment database rules that silently blocked detection and wallet payments.
- [x] Payment records amount + date — verified in a rolled-back database dry run for admin@lanonasis.com.
- [ ] Click-through as admin@lanonasis.com in the browser — needs the user's sign-in (no test session for this Supabase project); wallet balance is 0 so a top-up is needed first.
- [x] Admin dashboard: charts, company projects, editable pricing tiers (used by the plan sheet).
- [x] Bank statement upload (CSV + PDF) → transactions → live feed → obligation detection.
- [x] Remove canned chat replies; VortexAI search asks the real assistant.
- [x] Re-check the migration: project schemas + public facade views, admin data in control_room, secret-key access (no service-role key use).
- [x] Align with patch review: VortexCore Stripe prices (free/hobby/pro/enterprise, no SubTrack IDs), realtime subscriptions on app_vortexcore, control_room lockdown, VortexCore-only cockpit projects and counts, run in one transaction.
- [x] Confirm every database change applied today is saved in supabase/migrations/.

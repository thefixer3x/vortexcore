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
- [ ] Verify signed-in admin and wallet-payment flows after migration — external Supabase has no managed test session; requires the user's signed-in session.

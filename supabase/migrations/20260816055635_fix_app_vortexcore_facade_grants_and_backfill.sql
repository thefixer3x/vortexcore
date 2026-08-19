-- Captured verbatim from supabase_migrations.schema_migrations (applied
-- remotely 2026-08-16 by Hermes run 53; no local file existed until now —
-- see docs/reports/migration-reconciliation-2026-08-16.md, issue #89).
-- Already applied to mxtsdgkwzjzlttpotole; committed here for reproducibility
-- only, not to be pushed against that project again.

-- Fixes issue #89: the security_invoker views public.vortex_wallets /
-- public.vortex_transactions / public.vortex_settings sit over
-- app_vortexcore base tables that have RLS policies but zero table-level
-- grants for authenticated/service_role, so every query through the view
-- fails with permission denied for every user, including the backend.

grant select, insert, update, delete on app_vortexcore.vortex_wallets to authenticated, service_role;
grant select, insert, update, delete on app_vortexcore.vortex_transactions to authenticated, service_role;
grant select, insert, update, delete on app_vortexcore.vortex_settings to authenticated, service_role;

-- Backfill: existing profiles have no vortex_wallets row because the
-- wallet-provisioning trigger only fires on new auth.users signup.
insert into app_vortexcore.vortex_wallets (user_id)
select p.id
from public.profiles p
where not exists (
  select 1 from app_vortexcore.vortex_wallets w where w.user_id = p.id
)
on conflict (user_id) do nothing;

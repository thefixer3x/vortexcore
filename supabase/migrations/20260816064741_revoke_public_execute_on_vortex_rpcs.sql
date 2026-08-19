-- Captured verbatim from supabase_migrations.schema_migrations (applied
-- remotely 2026-08-16; no local file existed until now — see
-- docs/reports/migration-reconciliation-2026-08-16.md, issue #89).
-- Already applied to mxtsdgkwzjzlttpotole; committed here for reproducibility
-- only, not to be pushed against that project again.

-- Correction: the prior revoke targeted `anon` directly, but anon's
-- execute access actually came through the implicit PUBLIC grant that
-- Postgres adds by default on function creation. authenticated and
-- service_role already hold direct grants (confirmed via
-- information_schema.role_routine_grants), so revoking PUBLIC only
-- removes it for anon.
revoke execute on function public.vortex_delete_ai_credential(text) from public;
revoke execute on function public.vortex_get_ai_credential_status(text) from public;
revoke execute on function public.vortex_get_setting(text) from public;
revoke execute on function public.vortex_set_setting(text, jsonb) from public;

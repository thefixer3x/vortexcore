-- Captured verbatim from supabase_migrations.schema_migrations (applied
-- remotely 2026-08-19; no local file existed until now). Already applied
-- to mxtsdgkwzjzlttpotole; committed here for reproducibility only, not to
-- be pushed against that project again.

ALTER FUNCTION public.sync_auth_user_to_public() SET search_path = public, security_service, pg_temp;

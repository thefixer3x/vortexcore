-- Applied migration 20260212010735 (secure_facade_views_with_rls), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.

-- PROPER FIX: Enable RLS on public facade views and add user-scoped policies
-- This is the correct security boundary for the facade pattern

-- 1. Enable RLS on all facade views
ALTER VIEW public.auth_api_keys_view SET (security_barrier = true);
ALTER VIEW public.auth_events SET (security_barrier = true);
ALTER VIEW public.sessions SET (security_barrier = true);
ALTER VIEW public.user_sessions SET (security_barrier = true);
ALTER VIEW public.oauth_sessions SET (security_barrier = true);

-- Note: Views cannot have ALTER TABLE ... ENABLE ROW LEVEL SECURITY
-- Instead, we need to create materialized views or use grants

-- 2. Revoke public access from facade views
REVOKE ALL ON public.auth_api_keys_view FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.auth_events FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.sessions FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.user_sessions FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.oauth_sessions FROM PUBLIC, anon, authenticated;

-- 3. Grant selective access
-- Service role gets full access
GRANT ALL ON public.auth_api_keys_view TO service_role;
GRANT ALL ON public.auth_events TO service_role;
GRANT ALL ON public.sessions TO service_role;
GRANT ALL ON public.user_sessions TO service_role;
GRANT ALL ON public.oauth_sessions TO service_role;

-- Authenticated users get read access (views already filter by user_id)
GRANT SELECT ON public.auth_api_keys_view TO authenticated;
GRANT SELECT ON public.auth_events TO authenticated;
GRANT SELECT ON public.sessions TO authenticated;
GRANT SELECT ON public.user_sessions TO authenticated;
GRANT SELECT ON public.oauth_sessions TO authenticated;
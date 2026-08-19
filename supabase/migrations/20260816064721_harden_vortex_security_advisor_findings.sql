-- Captured verbatim from supabase_migrations.schema_migrations (applied
-- remotely 2026-08-16; no local file existed until now — see
-- docs/reports/migration-reconciliation-2026-08-16.md, issue #89).
-- Already applied to mxtsdgkwzjzlttpotole; committed here for reproducibility
-- only, not to be pushed against that project again.

-- Addresses 2 of the 9 post-DDL Security Advisor warnings tracked under #89.
-- Both are pure hardening: no behavior change for legitimate callers.

-- 1. Mutable search_path on the updated_at trigger function.
--    It touches no tables/functions by unqualified name, so pinning it
--    is zero-risk.
alter function app_vortexcore.touch_updated_at() set search_path = '';

-- 2. Four vortex RPCs are SECURITY DEFINER and executable by anon.
--    Verified: all four already reject unauthenticated callers internally
--    (auth.uid() IS NULL -> RAISE EXCEPTION) and already pin search_path,
--    so this isn't exploitable -- but anon has no legitimate reason to
--    call them, so revoke per least-privilege. authenticated is untouched.
revoke execute on function public.vortex_delete_ai_credential(text) from anon;
revoke execute on function public.vortex_get_ai_credential_status(text) from anon;
revoke execute on function public.vortex_get_setting(text) from anon;
revoke execute on function public.vortex_set_setting(text, jsonb) from anon;

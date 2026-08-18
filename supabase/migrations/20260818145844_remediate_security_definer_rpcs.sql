-- Align Vortex RPC execution with the underlying table access model.
--
-- Settings are protected by owner-scoped RLS and authenticated CRUD grants, so
-- their RPCs do not need to bypass caller privileges. AI credential storage
-- intentionally denies direct client table access; its two authenticated,
-- auth.uid()-scoped wrappers therefore remain SECURITY DEFINER.

ALTER FUNCTION public.vortex_get_setting(text) SECURITY INVOKER;
ALTER FUNCTION public.vortex_set_setting(text, jsonb) SECURITY INVOKER;

ALTER FUNCTION public.vortex_get_setting(text)
  SET search_path = public, app_vortexcore;
ALTER FUNCTION public.vortex_set_setting(text, jsonb)
  SET search_path = public, app_vortexcore;
ALTER FUNCTION public.vortex_delete_ai_credential(text)
  SET search_path = public, app_vortexcore;
ALTER FUNCTION public.vortex_get_ai_credential_status(text)
  SET search_path = public, app_vortexcore;

REVOKE EXECUTE ON FUNCTION public.vortex_get_setting(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.vortex_set_setting(text, jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.vortex_delete_ai_credential(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.vortex_get_ai_credential_status(text) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.vortex_get_setting(text)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.vortex_set_setting(text, jsonb)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.vortex_delete_ai_credential(text)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.vortex_get_ai_credential_status(text)
  TO authenticated, service_role;

DO $$
DECLARE
  function_name text;
BEGIN
  FOREACH function_name IN ARRAY ARRAY[
    'vortex_get_setting(text)',
    'vortex_set_setting(text,jsonb)',
    'vortex_delete_ai_credential(text)',
    'vortex_get_ai_credential_status(text)'
  ] LOOP
    IF has_function_privilege('anon', function_name, 'EXECUTE') THEN
      RAISE EXCEPTION 'anon retains EXECUTE on %', function_name;
    END IF;

    IF NOT has_function_privilege('authenticated', function_name, 'EXECUTE') THEN
      RAISE EXCEPTION 'authenticated lacks EXECUTE on %', function_name;
    END IF;
  END LOOP;

  IF EXISTS (
    SELECT 1
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public'
       AND p.proname IN ('vortex_get_setting', 'vortex_set_setting')
       AND p.prosecdef
  ) THEN
    RAISE EXCEPTION 'settings RPCs must use caller privileges';
  END IF;
END $$;

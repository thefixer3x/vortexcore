-- Align VortexCore's authenticated public facades with their RLS-protected
-- app_vortexcore base tables. The views use the caller's privileges, so both
-- schema usage and base-table privileges are required for RLS to execute.

GRANT USAGE ON SCHEMA app_vortexcore TO authenticated, service_role;

GRANT SELECT, INSERT, UPDATE, DELETE
  ON TABLE
    app_vortexcore.vortex_wallets,
    app_vortexcore.vortex_transactions,
    app_vortexcore.vortex_settings,
    app_vortexcore.ai_chat_sessions,
    app_vortexcore.ai_chat_messages
  TO authenticated, service_role;

REVOKE ALL
  ON TABLE
    app_vortexcore.vortex_wallets,
    app_vortexcore.vortex_transactions,
    app_vortexcore.vortex_settings,
    app_vortexcore.ai_chat_sessions,
    app_vortexcore.ai_chat_messages
  FROM anon;

DO $$
DECLARE
  relation_name text;
  relation_kind "char";
BEGIN
  FOREACH relation_name IN ARRAY ARRAY[
    'vortex_wallets',
    'vortex_transactions',
    'vortex_settings',
    'ai_chat_sessions',
    'ai_chat_messages'
  ] LOOP
    SELECT c.relkind
      INTO relation_kind
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public'
       AND c.relname = relation_name;

    IF relation_kind IS NOT NULL AND relation_kind <> 'v' THEN
      RAISE EXCEPTION 'public.% must be reviewed before replacing non-view relation', relation_name;
    END IF;

    EXECUTE format(
      'CREATE OR REPLACE VIEW public.%I WITH (security_invoker = true) AS SELECT * FROM app_vortexcore.%I',
      relation_name,
      relation_name
    );
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC, anon', relation_name);
    EXECUTE format(
      'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO authenticated, service_role',
      relation_name
    );
  END LOOP;
END $$;

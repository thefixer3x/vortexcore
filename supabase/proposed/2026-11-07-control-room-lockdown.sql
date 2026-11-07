-- =============================================================================
-- Control-room lockdown (shared Supabase project)
--
-- STATUS: APPLIED to production on 2026-11-07, with owner approval, and verified
-- afterwards. Kept here as the record; everything below ran in one transaction.
--
-- Live state read on 2026-11-07 (read-only catalog queries):
--   * public.render_services is a security_invoker view over
--     control_room.render_services with INSTEAD OF INSERT/UPDATE/DELETE
--     triggers whose functions are SECURITY DEFINER (owner postgres).
--     anon and authenticated hold INSERT/UPDATE/DELETE on the view. INSERT
--     needs no row read, so the public anon key can create arbitrary
--     control-room services: the trigger runs as the owner and
--     security_invoker never applies. (UPDATE/DELETE are blocked today only
--     because they must read rows first and the client roles cannot read
--     control_room; the test confirms both.)
--   * public.create/update/delete_control_room_app and
--     public.get_control_room_app(s) are SECURITY DEFINER with no auth check.
--     EXECUTE is held by PUBLIC (and anon, authenticated). delete_ works today
--     (any caller can deactivate or hard-delete any app); get_ returns every
--     control_room.apps row. create_/update_ currently fail on a missing
--     column, but the privilege path is the same.
--   * pg_stat_statements shows no calls to any of these from anon or
--     authenticated; the only known caller is the vortex-admin edge function,
--     which uses the service role and is unaffected.
--
-- What this changes:
--   1. Views public.render_services, public.apps, public.projects,
--      public.vortex_cockpit_projects: no write privileges for anon or
--      authenticated. SELECT is left as it is: these views are
--      security_invoker and control_room grants nothing to those roles, so
--      reads already return nothing / fail for them.
--   2. The five control-room RPCs: EXECUTE revoked from PUBLIC, anon and
--      authenticated (revoking only from anon/authenticated is not enough,
--      both inherit EXECUTE through PUBLIC); service_role keeps it.
--   3. The INSTEAD OF trigger functions: EXECUTE revoked from PUBLIC, anon and
--      authenticated as well (defence in depth; triggers do not check EXECUTE
--      when they fire, so step 1 is what closes the write path).
--
-- Rollback: 2026-11-07-control-room-lockdown.rollback.sql restores the exact
-- previous grants.
-- Test: supabase/proposed/test/run.sh (local Postgres, built from the live
-- definitions).
-- =============================================================================

begin;

-- 1. No writes through the public views -------------------------------------
revoke insert, update, delete, truncate, references, trigger
  on table public.render_services, public.apps, public.projects, public.vortex_cockpit_projects
  from anon, authenticated;

-- 2. Control-room RPCs: service role only ------------------------------------
revoke execute on function
  public.create_control_room_app(text, text, text, text, text, text, text, text, text, jsonb),
  public.update_control_room_app(text, jsonb),
  public.delete_control_room_app(text, boolean),
  public.get_control_room_app(text),
  public.get_control_room_apps(text, text)
  from public, anon, authenticated;

grant execute on function
  public.create_control_room_app(text, text, text, text, text, text, text, text, text, jsonb),
  public.update_control_room_app(text, jsonb),
  public.delete_control_room_app(text, boolean),
  public.get_control_room_app(text),
  public.get_control_room_apps(text, text)
  to service_role;

-- 3. Trigger functions: not callable by client roles -------------------------
revoke execute on function
  public.render_services_insert(),
  public.render_services_update(),
  public.render_services_delete(),
  public.projects_insert(),
  public.projects_update(),
  public.projects_delete()
  from public, anon, authenticated;

grant execute on function
  public.render_services_insert(),
  public.render_services_update(),
  public.render_services_delete(),
  public.projects_insert(),
  public.projects_update(),
  public.projects_delete()
  to service_role;

commit;

-- =============================================================================
-- Checks after applying (read-only)
-- =============================================================================
-- Function ACLs: no "=X" (PUBLIC), no anon=, no authenticated=.
--   select p.proname, p.proacl from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--   where n.nspname = 'public' and (p.proname like '%control_room_app%'
--     or p.proname like 'render_services_%' or p.proname like 'projects_%');
-- View privileges: only SELECT left for anon/authenticated.
--   select table_name, grantee, string_agg(privilege_type, ',') from information_schema.role_table_grants
--   where table_schema = 'public' and table_name in ('render_services','apps','projects','vortex_cockpit_projects')
--     and grantee in ('anon','authenticated') group by 1, 2;
-- In the app: open the admin Projects / Control Room screens (vortex-admin,
-- service role) and confirm they still load and save.

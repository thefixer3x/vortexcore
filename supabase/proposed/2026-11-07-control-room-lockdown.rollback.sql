-- Rollback for 2026-11-07-control-room-lockdown.sql
-- Restores the grants exactly as read from the live project on 2026-11-07.
-- Note: this re-opens the write path described in the lockdown file.

begin;

-- 1. View privileges as before: anon and authenticated had every table privilege
--    on these views (apps, render_services). projects and vortex_cockpit_projects
--    had none for these roles, so nothing is restored for them.
grant select, insert, update, delete, truncate, references, trigger
  on table public.render_services, public.apps
  to anon, authenticated;

-- 2 and 3. EXECUTE as before: PUBLIC, anon, authenticated, service_role.
grant execute on function
  public.create_control_room_app(text, text, text, text, text, text, text, text, text, jsonb),
  public.update_control_room_app(text, jsonb),
  public.delete_control_room_app(text, boolean),
  public.get_control_room_app(text),
  public.get_control_room_apps(text, text),
  public.render_services_insert(),
  public.render_services_update(),
  public.render_services_delete(),
  public.projects_insert(),
  public.projects_update(),
  public.projects_delete()
  to public, anon, authenticated, service_role;

commit;

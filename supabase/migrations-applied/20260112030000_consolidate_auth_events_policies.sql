-- Applied migration 20260112030000 (consolidate_auth_events_policies), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.

alter policy "Admins can read all auth events" on auth_gateway.auth_events
  using (
    is_admin()
    OR ((aggregate_type = 'api_key'::text) AND (((payload ->> 'user_id'::text))::uuid = ( SELECT auth.uid() AS uid)))
    OR ((event_type = 'AuthEventLogged'::text) AND (aggregate_id = (( SELECT auth.uid() AS uid))::text))
    OR ((aggregate_type = 'session'::text) AND (((payload ->> 'user_id'::text))::uuid = ( SELECT auth.uid() AS uid)))
    OR ((aggregate_type = 'user'::text) AND (aggregate_id = (( SELECT auth.uid() AS uid))::text))
  );

drop policy "Users can read own api key events" on auth_gateway.auth_events;

drop policy "Users can read own audit events" on auth_gateway.auth_events;

drop policy "Users can read own session events" on auth_gateway.auth_events;

drop policy "Users can read own user events" on auth_gateway.auth_events;
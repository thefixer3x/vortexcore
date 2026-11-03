-- Applied migration 20260218070750 (drop_duplicate_auth_events_constraint), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.


-- auth_events_event_id_unique is identical to the pkey — drop the redundant constraint
ALTER TABLE auth_gateway.auth_events
  DROP CONSTRAINT IF EXISTS auth_events_event_id_unique;

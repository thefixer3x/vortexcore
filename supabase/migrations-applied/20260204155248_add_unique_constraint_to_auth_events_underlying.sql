-- Applied migration 20260204155248 (add_unique_constraint_to_auth_events_underlying), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.

ALTER TABLE auth_gateway.auth_events ADD CONSTRAINT auth_events_event_id_unique UNIQUE (event_id);
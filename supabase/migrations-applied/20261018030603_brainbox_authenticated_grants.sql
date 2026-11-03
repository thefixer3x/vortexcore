-- Applied migration 20261018030603 (brainbox_authenticated_grants), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.

GRANT USAGE ON SCHEMA apps TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON apps.ai_brainbox_sync_jobs TO authenticated;

GRANT SELECT (id, user_id, provider, status, scopes, expires_at, account_label,
              metadata, last_synced_at, created_at, updated_at)
  ON apps.ai_brainbox_connections TO authenticated;
GRANT DELETE ON apps.ai_brainbox_connections TO authenticated;
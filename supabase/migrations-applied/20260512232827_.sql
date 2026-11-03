-- Applied migration 20260512232827 (), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.


-- =========================================================
-- Brainbox plugin harness: connections + sync_jobs
-- Strictly scoped to apps.ai_brainbox_* and public facades
-- =========================================================

-- 1) Connections table
CREATE TABLE IF NOT EXISTS apps.ai_brainbox_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  scopes text[] NOT NULL DEFAULT '{}',
  access_token_encrypted text,
  refresh_token_encrypted text,
  token_iv text,
  expires_at timestamptz,
  account_label text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ai_brainbox_connections_status_chk
    CHECK (status IN ('pending','active','error','revoked'))
);

CREATE INDEX IF NOT EXISTS ai_brainbox_connections_user_idx
  ON apps.ai_brainbox_connections (user_id);
CREATE INDEX IF NOT EXISTS ai_brainbox_connections_user_provider_idx
  ON apps.ai_brainbox_connections (user_id, provider);

ALTER TABLE apps.ai_brainbox_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS bb_connections_select_own ON apps.ai_brainbox_connections;
CREATE POLICY bb_connections_select_own
  ON apps.ai_brainbox_connections FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS bb_connections_insert_own ON apps.ai_brainbox_connections;
CREATE POLICY bb_connections_insert_own
  ON apps.ai_brainbox_connections FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS bb_connections_update_own ON apps.ai_brainbox_connections;
CREATE POLICY bb_connections_update_own
  ON apps.ai_brainbox_connections FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS bb_connections_delete_own ON apps.ai_brainbox_connections;
CREATE POLICY bb_connections_delete_own
  ON apps.ai_brainbox_connections FOR DELETE TO authenticated
  USING (user_id = auth.uid());


-- 2) Sync jobs table
CREATE TABLE IF NOT EXISTS apps.ai_brainbox_sync_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id uuid NOT NULL REFERENCES apps.ai_brainbox_connections(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'queued',
  cursor text,
  stats jsonb NOT NULL DEFAULT '{}'::jsonb,
  error text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ai_brainbox_sync_jobs_status_chk
    CHECK (status IN ('queued','running','done','error'))
);

CREATE INDEX IF NOT EXISTS ai_brainbox_sync_jobs_user_idx
  ON apps.ai_brainbox_sync_jobs (user_id);
CREATE INDEX IF NOT EXISTS ai_brainbox_sync_jobs_connection_idx
  ON apps.ai_brainbox_sync_jobs (connection_id);

ALTER TABLE apps.ai_brainbox_sync_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS bb_sync_jobs_select_own ON apps.ai_brainbox_sync_jobs;
CREATE POLICY bb_sync_jobs_select_own
  ON apps.ai_brainbox_sync_jobs FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS bb_sync_jobs_insert_own ON apps.ai_brainbox_sync_jobs;
CREATE POLICY bb_sync_jobs_insert_own
  ON apps.ai_brainbox_sync_jobs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS bb_sync_jobs_update_own ON apps.ai_brainbox_sync_jobs;
CREATE POLICY bb_sync_jobs_update_own
  ON apps.ai_brainbox_sync_jobs FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS bb_sync_jobs_delete_own ON apps.ai_brainbox_sync_jobs;
CREATE POLICY bb_sync_jobs_delete_own
  ON apps.ai_brainbox_sync_jobs FOR DELETE TO authenticated
  USING (user_id = auth.uid());


-- 3) Extend imported_data for idempotent provider syncs
ALTER TABLE apps.ai_brainbox_imported_data
  ADD COLUMN IF NOT EXISTS connection_id uuid
    REFERENCES apps.ai_brainbox_connections(id) ON DELETE SET NULL;
ALTER TABLE apps.ai_brainbox_imported_data
  ADD COLUMN IF NOT EXISTS external_id text;
ALTER TABLE apps.ai_brainbox_imported_data
  ADD COLUMN IF NOT EXISTS external_updated_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS ai_brainbox_imported_data_conn_extid_uq
  ON apps.ai_brainbox_imported_data (connection_id, external_id)
  WHERE connection_id IS NOT NULL AND external_id IS NOT NULL;


-- 4) updated_at triggers (reuse existing helper if present, else create local)
CREATE OR REPLACE FUNCTION apps.ai_brainbox_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bb_connections_set_updated_at ON apps.ai_brainbox_connections;
CREATE TRIGGER bb_connections_set_updated_at
  BEFORE UPDATE ON apps.ai_brainbox_connections
  FOR EACH ROW EXECUTE FUNCTION apps.ai_brainbox_set_updated_at();

DROP TRIGGER IF EXISTS bb_sync_jobs_set_updated_at ON apps.ai_brainbox_sync_jobs;
CREATE TRIGGER bb_sync_jobs_set_updated_at
  BEFORE UPDATE ON apps.ai_brainbox_sync_jobs
  FOR EACH ROW EXECUTE FUNCTION apps.ai_brainbox_set_updated_at();


-- 5) Public facade views (security_invoker = true, NO token columns)
DROP VIEW IF EXISTS public.ai_brainbox_connections;
CREATE VIEW public.ai_brainbox_connections
WITH (security_invoker = true) AS
SELECT
  id,
  user_id,
  provider,
  status,
  scopes,
  expires_at,
  account_label,
  metadata,
  last_synced_at,
  created_at,
  updated_at
FROM apps.ai_brainbox_connections;

GRANT SELECT ON public.ai_brainbox_connections TO authenticated;

DROP VIEW IF EXISTS public.ai_brainbox_sync_jobs;
CREATE VIEW public.ai_brainbox_sync_jobs
WITH (security_invoker = true) AS
SELECT
  id,
  user_id,
  connection_id,
  status,
  cursor,
  stats,
  error,
  started_at,
  finished_at,
  created_at,
  updated_at
FROM apps.ai_brainbox_sync_jobs;

GRANT SELECT ON public.ai_brainbox_sync_jobs TO authenticated;

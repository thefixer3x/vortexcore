-- Applied migration 20260212010103 (enable_rls_user_sync_log), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.

-- Enable RLS on user_sync_log table
ALTER TABLE public.user_sync_log ENABLE ROW LEVEL SECURITY;

-- This is a system log table - only service role should have access
CREATE POLICY "Only service role can access user_sync_log"
  ON public.user_sync_log
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Optional: Allow authenticated users to view sync logs (read-only)
-- Uncomment if you want users to see system sync status
-- CREATE POLICY "Authenticated users can view sync logs"
--   ON public.user_sync_log
--   FOR SELECT
--   USING (auth.role() = 'authenticated');
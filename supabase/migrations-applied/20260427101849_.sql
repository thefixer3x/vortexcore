-- Applied migration 20260427101849 (), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.

-- Public facade view for app_vortexcore.ai_chat_messages
-- Enables typed Supabase client access for normalized chat message storage.
CREATE OR REPLACE VIEW public.ai_chat_messages
WITH (security_invoker = true) AS
SELECT
  id,
  session_id,
  user_id,
  role,
  content,
  tokens,
  metadata,
  created_at
FROM app_vortexcore.ai_chat_messages;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_chat_messages TO authenticated;

-- Ensure RLS is enabled and scoped on the underlying table
ALTER TABLE app_vortexcore.ai_chat_messages ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'app_vortexcore'
      AND tablename  = 'ai_chat_messages'
      AND policyname = 'users_select_own_messages'
  ) THEN
    CREATE POLICY users_select_own_messages
      ON app_vortexcore.ai_chat_messages
      FOR SELECT TO authenticated
      USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'app_vortexcore'
      AND tablename  = 'ai_chat_messages'
      AND policyname = 'users_insert_own_messages'
  ) THEN
    CREATE POLICY users_insert_own_messages
      ON app_vortexcore.ai_chat_messages
      FOR INSERT TO authenticated
      WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'app_vortexcore'
      AND tablename  = 'ai_chat_messages'
      AND policyname = 'users_update_own_messages'
  ) THEN
    CREATE POLICY users_update_own_messages
      ON app_vortexcore.ai_chat_messages
      FOR UPDATE TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'app_vortexcore'
      AND tablename  = 'ai_chat_messages'
      AND policyname = 'users_delete_own_messages'
  ) THEN
    CREATE POLICY users_delete_own_messages
      ON app_vortexcore.ai_chat_messages
      FOR DELETE TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- Index for the daily rate-limit / analytics query
-- (COUNT(*) WHERE user_id = ? AND created_at > today)
CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_user_created
  ON app_vortexcore.ai_chat_messages (user_id, created_at DESC);

-- Index for fast session-scoped reads
CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_session_created
  ON app_vortexcore.ai_chat_messages (session_id, created_at ASC);
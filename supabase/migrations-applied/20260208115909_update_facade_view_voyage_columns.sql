-- Applied migration 20260208115909 (update_facade_view_voyage_columns), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.

-- Step 2: Update facade view to include voyage columns
DROP VIEW IF EXISTS public.memory_entries;

CREATE VIEW public.memory_entries WITH (security_invoker = true) AS
SELECT 
  id,
  title,
  content,
  memory_type,
  tags,
  topic_id,
  user_id,
  organization_id,
  embedding,
  voyage_embedding,
  embedding_provider,
  embedding_model,
  metadata,
  created_at,
  updated_at,
  last_accessed,
  access_count,
  type
FROM security_service.memory_entries;

-- Grant permissions on the view
GRANT SELECT, INSERT, UPDATE, DELETE ON public.memory_entries TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.memory_entries TO service_role;
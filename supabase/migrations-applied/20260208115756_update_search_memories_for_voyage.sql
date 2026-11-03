-- Applied migration 20260208115756 (update_search_memories_for_voyage), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.

-- Step 1: Update search_memories to use voyage_embedding (1024 dims)
-- This function accepts 1024-dim query vectors and searches voyage_embedding column

CREATE OR REPLACE FUNCTION public.search_memories(
  query_embedding vector(1024),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10,
  filter_organization_id uuid DEFAULT NULL,
  filter_user_id uuid DEFAULT NULL,
  filter_type text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  memory_type text,
  tags text[],
  metadata jsonb,
  similarity_score float,
  user_id uuid,
  organization_id uuid,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, security_service
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.title::TEXT,
    m.content,
    m.memory_type::TEXT,
    m.tags,
    m.metadata,
    (1 - (m.voyage_embedding <=> query_embedding))::FLOAT AS similarity_score,
    m.user_id,
    m.organization_id,
    m.created_at,
    m.updated_at
  FROM security_service.memory_entries m
  WHERE
    (filter_organization_id IS NULL OR m.organization_id = filter_organization_id)
    AND (filter_user_id IS NULL OR m.user_id = filter_user_id)
    AND (filter_type IS NULL OR m.memory_type::TEXT = filter_type)
    AND m.voyage_embedding IS NOT NULL
    AND (1 - (m.voyage_embedding <=> query_embedding)) >= match_threshold
  ORDER BY m.voyage_embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.search_memories TO authenticated, service_role;
-- Applied migration 20260208181459 (fix_search_memories_varchar_cast), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.


-- Fix: cast varchar columns to text to match RETURNS TABLE
DROP FUNCTION IF EXISTS search_memories(vector, double precision, integer, uuid, uuid, text);

CREATE OR REPLACE FUNCTION search_memories(
  query_embedding vector,
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 10,
  filter_organization_id UUID DEFAULT NULL,
  filter_user_id UUID DEFAULT NULL,
  filter_type TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  memory_type TEXT,
  tags TEXT[],
  metadata JSONB,
  similarity FLOAT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, security_service, extensions
AS $$
DECLARE
  query_dim INT;
BEGIN
  query_dim := vector_dims(query_embedding);
  
  IF query_dim = 1024 THEN
    RETURN QUERY
    SELECT
      m.id,
      m.title::text,
      m.content::text,
      m.memory_type::text,
      m.tags,
      m.metadata,
      (1 - (m.voyage_embedding <=> query_embedding))::float,
      m.created_at,
      m.updated_at
    FROM memory_entries m
    WHERE
      (filter_organization_id IS NULL OR m.organization_id = filter_organization_id)
      AND (filter_user_id IS NULL OR m.user_id = filter_user_id)
      AND (filter_type IS NULL OR m.memory_type::text = filter_type)
      AND m.voyage_embedding IS NOT NULL
      AND (1 - (m.voyage_embedding <=> query_embedding)) > match_threshold
    ORDER BY m.voyage_embedding <=> query_embedding
    LIMIT match_count;
  ELSE
    RETURN QUERY
    SELECT
      m.id,
      m.title::text,
      m.content::text,
      m.memory_type::text,
      m.tags,
      m.metadata,
      (1 - (m.embedding <=> query_embedding))::float,
      m.created_at,
      m.updated_at
    FROM memory_entries m
    WHERE
      (filter_organization_id IS NULL OR m.organization_id = filter_organization_id)
      AND (filter_user_id IS NULL OR m.user_id = filter_user_id)
      AND (filter_type IS NULL OR m.memory_type::text = filter_type)
      AND m.embedding IS NOT NULL
      AND (1 - (m.embedding <=> query_embedding)) > match_threshold
    ORDER BY m.embedding <=> query_embedding
    LIMIT match_count;
  END IF;
END;
$$;

COMMENT ON FUNCTION search_memories IS 'Dimension-aware vector search (1024=voyage_embedding, 1536=embedding) with explicit type casts for facade view';

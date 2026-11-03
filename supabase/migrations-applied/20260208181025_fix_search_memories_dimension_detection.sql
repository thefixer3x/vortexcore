-- Applied migration 20260208181025 (fix_search_memories_dimension_detection), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.


-- Fix: use vector_dims() instead of array_length cast
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
    -- Voyage AI embedding (1024-dim) - search voyage_embedding column
    RETURN QUERY
    SELECT
      m.id,
      m.title,
      m.content,
      m.memory_type,
      m.tags,
      m.metadata,
      (1 - (m.voyage_embedding <=> query_embedding))::float as similarity,
      m.created_at,
      m.updated_at
    FROM memory_entries m
    WHERE
      (filter_organization_id IS NULL OR m.organization_id = filter_organization_id)
      AND (filter_user_id IS NULL OR m.user_id = filter_user_id)
      AND (filter_type IS NULL OR m.memory_type = filter_type)
      AND m.voyage_embedding IS NOT NULL
      AND (1 - (m.voyage_embedding <=> query_embedding)) > match_threshold
    ORDER BY m.voyage_embedding <=> query_embedding
    LIMIT match_count;
  ELSE
    -- OpenAI embedding (1536-dim) - search embedding column
    RETURN QUERY
    SELECT
      m.id,
      m.title,
      m.content,
      m.memory_type,
      m.tags,
      m.metadata,
      (1 - (m.embedding <=> query_embedding))::float as similarity,
      m.created_at,
      m.updated_at
    FROM memory_entries m
    WHERE
      (filter_organization_id IS NULL OR m.organization_id = filter_organization_id)
      AND (filter_user_id IS NULL OR m.user_id = filter_user_id)
      AND (filter_type IS NULL OR m.memory_type = filter_type)
      AND m.embedding IS NOT NULL
      AND (1 - (m.embedding <=> query_embedding)) > match_threshold
    ORDER BY m.embedding <=> query_embedding
    LIMIT match_count;
  END IF;
END;
$$;

COMMENT ON FUNCTION search_memories IS 'Vector similarity search - auto-detects embedding dimension via vector_dims() (1024=Voyage, 1536=OpenAI)';

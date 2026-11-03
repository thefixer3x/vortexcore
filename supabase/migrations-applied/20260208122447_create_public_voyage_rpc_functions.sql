-- Applied migration 20260208122447 (create_public_voyage_rpc_functions), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.


-- Create public schema wrappers for Voyage RPC functions
-- These call the security_service functions but are accessible from public schema

-- match_memories_voyage - for semantic search
CREATE OR REPLACE FUNCTION public.match_memories_voyage(
  query_embedding extensions.vector(1024),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10,
  filter_user_id uuid DEFAULT NULL,
  distance_metric text DEFAULT 'cosine'
)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  type text,
  tags text[],
  metadata jsonb,
  similarity float,
  user_id uuid,
  organization_id uuid,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, security_service, extensions
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.title::TEXT,
    m.content,
    m.memory_type::TEXT as type,
    m.tags,
    m.metadata,
    (1 - (m.voyage_embedding <=> query_embedding))::FLOAT AS similarity,
    m.user_id,
    m.organization_id,
    m.created_at,
    m.updated_at
  FROM security_service.memory_entries m
  WHERE
    (filter_user_id IS NULL OR m.user_id = filter_user_id)
    AND m.voyage_embedding IS NOT NULL
    AND (1 - (m.voyage_embedding <=> query_embedding)) >= match_threshold
  ORDER BY m.voyage_embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- hybrid_search_voyage - for combined semantic + keyword search  
CREATE OR REPLACE FUNCTION public.hybrid_search_voyage(
  query_text text,
  query_embedding extensions.vector(1024),
  match_count int DEFAULT 10,
  semantic_weight float DEFAULT 0.7,
  keyword_weight float DEFAULT 0.3,
  min_similarity float DEFAULT 0.5,
  filter_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  type text,
  tags text[],
  metadata jsonb,
  semantic_similarity float,
  keyword_rank float,
  combined_score float,
  user_id uuid,
  organization_id uuid,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, security_service, extensions
AS $$
BEGIN
  RETURN QUERY
  WITH semantic_results AS (
    SELECT
      m.id,
      m.title,
      m.content,
      m.memory_type as type,
      m.tags,
      m.metadata,
      (1 - (m.voyage_embedding <=> query_embedding))::FLOAT AS similarity,
      m.user_id,
      m.organization_id,
      m.created_at,
      m.updated_at
    FROM security_service.memory_entries m
    WHERE
      (filter_user_id IS NULL OR m.user_id = filter_user_id)
      AND m.voyage_embedding IS NOT NULL
      AND (1 - (m.voyage_embedding <=> query_embedding)) >= min_similarity
  ),
  keyword_results AS (
    SELECT
      m.id,
      ts_rank(to_tsvector('english', COALESCE(m.title, '') || ' ' || COALESCE(m.content, '')), 
              plainto_tsquery('english', query_text))::FLOAT AS rank
    FROM security_service.memory_entries m
    WHERE
      (filter_user_id IS NULL OR m.user_id = filter_user_id)
      AND (m.title ILIKE '%' || query_text || '%' OR m.content ILIKE '%' || query_text || '%')
  )
  SELECT
    sr.id,
    sr.title::TEXT,
    sr.content,
    sr.type::TEXT,
    sr.tags,
    sr.metadata,
    sr.similarity AS semantic_similarity,
    COALESCE(kr.rank, 0.0)::FLOAT AS keyword_rank,
    (sr.similarity * semantic_weight + COALESCE(kr.rank, 0.0) * keyword_weight)::FLOAT AS combined_score,
    sr.user_id,
    sr.organization_id,
    sr.created_at,
    sr.updated_at
  FROM semantic_results sr
  LEFT JOIN keyword_results kr ON sr.id = kr.id
  ORDER BY combined_score DESC
  LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION public.match_memories_voyage IS 'Semantic search using Voyage AI embeddings (1024 dims)';
COMMENT ON FUNCTION public.hybrid_search_voyage IS 'Hybrid semantic+keyword search using Voyage AI embeddings';

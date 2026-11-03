-- Applied migration 20260827005453 (mcp_search_filter_pushdown_008), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.

-- Push MCP Voyage filters into the canonical storage query.
-- Route ownership remains separate from the Onasis REST Edge Function:
-- mcp-core -> public.match_memories_voyage -> security_service.memory_entries.

BEGIN;

DO $$
BEGIN
  IF to_regclass('security_service.memory_entries') IS NULL THEN
    RAISE EXCEPTION 'security_service.memory_entries is required';
  END IF;
END;
$$;

DROP FUNCTION IF EXISTS public.match_memories_voyage(
  extensions.vector, DOUBLE PRECISION, INTEGER, UUID, TEXT
);
DROP FUNCTION IF EXISTS public.hybrid_search_voyage(
  TEXT, extensions.vector, INTEGER, DOUBLE PRECISION,
  DOUBLE PRECISION, DOUBLE PRECISION, UUID
);

CREATE OR REPLACE FUNCTION public.match_memories_voyage(
  query_embedding extensions.vector,
  match_threshold DOUBLE PRECISION DEFAULT 0.7,
  match_count INTEGER DEFAULT 10,
  filter_user_id UUID DEFAULT NULL,
  distance_metric TEXT DEFAULT 'cosine',
  filter_organization_id UUID DEFAULT NULL,
  filter_type TEXT DEFAULT NULL,
  filter_tags TEXT[] DEFAULT NULL,
  filter_date_from TIMESTAMPTZ DEFAULT NULL,
  filter_date_to TIMESTAMPTZ DEFAULT NULL,
  include_deleted BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  type TEXT,
  tags TEXT[],
  metadata JSONB,
  similarity DOUBLE PRECISION,
  user_id UUID,
  organization_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'extensions'
AS $$
BEGIN
  IF query_embedding IS NULL OR extensions.vector_dims(query_embedding) <> 1024 THEN
    RAISE EXCEPTION 'match_memories_voyage requires a 1024-dimensional query embedding';
  END IF;

  IF match_count IS NULL OR match_count < 1 OR match_count > 100 THEN
    RAISE EXCEPTION 'match_count must be between 1 and 100';
  END IF;

  IF match_threshold IS NULL OR match_threshold < -1 OR match_threshold > 1 THEN
    RAISE EXCEPTION 'match_threshold must be between -1 and 1';
  END IF;

  IF distance_metric <> 'cosine' THEN
    RAISE EXCEPTION 'match_memories_voyage supports cosine distance only';
  END IF;

  RETURN QUERY
  SELECT
    m.id,
    m.title::TEXT,
    m.content,
    m.memory_type::TEXT,
    m.tags,
    m.metadata,
    (1 - (m.voyage_embedding <=> query_embedding))::DOUBLE PRECISION,
    m.user_id,
    m.organization_id,
    m.created_at,
    m.updated_at
  FROM security_service.memory_entries m
  WHERE (filter_organization_id IS NULL OR m.organization_id = filter_organization_id)
    AND (filter_user_id IS NULL OR m.user_id = filter_user_id)
    AND (filter_type IS NULL OR m.memory_type::TEXT = filter_type)
    AND (filter_tags IS NULL OR m.tags && filter_tags)
    AND (filter_date_from IS NULL OR m.created_at >= filter_date_from)
    AND (filter_date_to IS NULL OR m.created_at <= filter_date_to)
    AND (COALESCE(include_deleted, FALSE) OR m.deleted_at IS NULL)
    AND m.voyage_embedding IS NOT NULL
    AND (1 - (m.voyage_embedding <=> query_embedding)) >= match_threshold
  ORDER BY m.voyage_embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.hybrid_search_voyage(
  query_text TEXT,
  query_embedding extensions.vector,
  match_count INTEGER DEFAULT 10,
  semantic_weight DOUBLE PRECISION DEFAULT 0.7,
  keyword_weight DOUBLE PRECISION DEFAULT 0.3,
  min_similarity DOUBLE PRECISION DEFAULT 0.5,
  filter_user_id UUID DEFAULT NULL,
  filter_organization_id UUID DEFAULT NULL,
  filter_type TEXT DEFAULT NULL,
  filter_tags TEXT[] DEFAULT NULL,
  filter_date_from TIMESTAMPTZ DEFAULT NULL,
  filter_date_to TIMESTAMPTZ DEFAULT NULL,
  include_deleted BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  type TEXT,
  tags TEXT[],
  metadata JSONB,
  semantic_similarity DOUBLE PRECISION,
  keyword_rank DOUBLE PRECISION,
  combined_score DOUBLE PRECISION,
  user_id UUID,
  organization_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'extensions'
AS $$
BEGIN
  IF query_embedding IS NULL OR extensions.vector_dims(query_embedding) <> 1024 THEN
    RAISE EXCEPTION 'hybrid_search_voyage requires a 1024-dimensional query embedding';
  END IF;

  IF match_count IS NULL OR match_count < 1 OR match_count > 100 THEN
    RAISE EXCEPTION 'match_count must be between 1 and 100';
  END IF;

  IF min_similarity IS NULL OR min_similarity < -1 OR min_similarity > 1 THEN
    RAISE EXCEPTION 'min_similarity must be between -1 and 1';
  END IF;

  IF semantic_weight IS NULL OR keyword_weight IS NULL
     OR semantic_weight < 0 OR semantic_weight > 1
     OR keyword_weight < 0 OR keyword_weight > 1
     OR abs((semantic_weight + keyword_weight) - 1.0) > 0.01 THEN
    RAISE EXCEPTION 'semantic_weight and keyword_weight must be between 0 and 1 and sum to 1';
  END IF;

  RETURN QUERY
  WITH semantic_results AS (
    SELECT
      m.id,
      (1 - (m.voyage_embedding <=> query_embedding))::DOUBLE PRECISION AS semantic_score
    FROM security_service.memory_entries m
    WHERE (filter_organization_id IS NULL OR m.organization_id = filter_organization_id)
      AND (filter_user_id IS NULL OR m.user_id = filter_user_id)
      AND (filter_type IS NULL OR m.memory_type::TEXT = filter_type)
      AND (filter_tags IS NULL OR m.tags && filter_tags)
      AND (filter_date_from IS NULL OR m.created_at >= filter_date_from)
      AND (filter_date_to IS NULL OR m.created_at <= filter_date_to)
      AND (COALESCE(include_deleted, FALSE) OR m.deleted_at IS NULL)
      AND m.voyage_embedding IS NOT NULL
      AND (1 - (m.voyage_embedding <=> query_embedding)) >= min_similarity
    ORDER BY m.voyage_embedding <=> query_embedding
    LIMIT match_count * 2
  ),
  keyword_results AS (
    SELECT
      m.id,
      ts_rank(
        to_tsvector('english', m.title::TEXT || ' ' || m.content),
        plainto_tsquery('english', query_text)
      )::DOUBLE PRECISION AS keyword_score
    FROM security_service.memory_entries m
    WHERE (filter_organization_id IS NULL OR m.organization_id = filter_organization_id)
      AND (filter_user_id IS NULL OR m.user_id = filter_user_id)
      AND (filter_type IS NULL OR m.memory_type::TEXT = filter_type)
      AND (filter_tags IS NULL OR m.tags && filter_tags)
      AND (filter_date_from IS NULL OR m.created_at >= filter_date_from)
      AND (filter_date_to IS NULL OR m.created_at <= filter_date_to)
      AND (COALESCE(include_deleted, FALSE) OR m.deleted_at IS NULL)
      AND to_tsvector(
        'english', m.title::TEXT || ' ' || m.content
      ) @@ plainto_tsquery('english', query_text)
    ORDER BY keyword_score DESC
    LIMIT match_count * 2
  ),
  candidate_ids AS (
    SELECT s.id AS candidate_id FROM semantic_results s
    UNION
    SELECT k.id AS candidate_id FROM keyword_results k
  )
  SELECT
    m.id,
    m.title::TEXT,
    m.content,
    m.memory_type::TEXT,
    m.tags,
    m.metadata,
    COALESCE(s.semantic_score, 0.0),
    COALESCE(k.keyword_score, 0.0),
    (COALESCE(s.semantic_score, 0.0) * semantic_weight
      + COALESCE(k.keyword_score, 0.0) * keyword_weight),
    m.user_id,
    m.organization_id,
    m.created_at,
    m.updated_at
  FROM candidate_ids c
  JOIN security_service.memory_entries m ON m.id = c.candidate_id
  LEFT JOIN semantic_results s ON s.id = c.candidate_id
  LEFT JOIN keyword_results k ON k.id = c.candidate_id
  ORDER BY 9 DESC
  LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION public.match_memories_voyage(
  extensions.vector, DOUBLE PRECISION, INTEGER, UUID, TEXT, UUID,
  TEXT, TEXT[], TIMESTAMPTZ, TIMESTAMPTZ, BOOLEAN
) IS 'MCP semantic retrieval contract for 1024d Voyage vectors.';

COMMENT ON FUNCTION public.hybrid_search_voyage(
  TEXT, extensions.vector, INTEGER, DOUBLE PRECISION, DOUBLE PRECISION,
  DOUBLE PRECISION, UUID, UUID, TEXT, TEXT[], TIMESTAMPTZ, TIMESTAMPTZ, BOOLEAN
) IS 'MCP hybrid retrieval contract for 1024d Voyage vectors.';

REVOKE ALL ON FUNCTION public.match_memories_voyage(
  extensions.vector, DOUBLE PRECISION, INTEGER, UUID, TEXT, UUID,
  TEXT, TEXT[], TIMESTAMPTZ, TIMESTAMPTZ, BOOLEAN
) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.hybrid_search_voyage(
  TEXT, extensions.vector, INTEGER, DOUBLE PRECISION, DOUBLE PRECISION,
  DOUBLE PRECISION, UUID, UUID, TEXT, TEXT[], TIMESTAMPTZ, TIMESTAMPTZ, BOOLEAN
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.match_memories_voyage(
  extensions.vector, DOUBLE PRECISION, INTEGER, UUID, TEXT, UUID,
  TEXT, TEXT[], TIMESTAMPTZ, TIMESTAMPTZ, BOOLEAN
) TO service_role;
GRANT EXECUTE ON FUNCTION public.hybrid_search_voyage(
  TEXT, extensions.vector, INTEGER, DOUBLE PRECISION, DOUBLE PRECISION,
  DOUBLE PRECISION, UUID, UUID, TEXT, TEXT[], TIMESTAMPTZ, TIMESTAMPTZ, BOOLEAN
) TO service_role;

CREATE INDEX IF NOT EXISTS idx_memory_entries_org_type_created_active
  ON security_service.memory_entries(organization_id, memory_type, created_at DESC)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_memory_entries_org_updated_active
  ON security_service.memory_entries(organization_id, updated_at DESC)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_memory_entries_tags_active
  ON security_service.memory_entries USING GIN(tags)
  WHERE deleted_at IS NULL;

COMMIT;

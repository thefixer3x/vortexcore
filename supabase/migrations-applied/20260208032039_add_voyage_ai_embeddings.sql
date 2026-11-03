-- Applied migration 20260208032039 (add_voyage_ai_embeddings), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.


-- =============================================
-- Voyage AI Embeddings Support
-- Adds 1024-dimension Voyage AI embedding support
-- to security_service.memory_entries
-- =============================================

-- Add Voyage AI embedding column (1024 dimensions for voyage-3.5)
ALTER TABLE security_service.memory_entries 
ADD COLUMN IF NOT EXISTS voyage_embedding vector(1024);

-- Add embedding provider tracking
ALTER TABLE security_service.memory_entries 
ADD COLUMN IF NOT EXISTS embedding_provider varchar(50) DEFAULT 'openai';

-- Add embedding model tracking  
ALTER TABLE security_service.memory_entries 
ADD COLUMN IF NOT EXISTS embedding_model varchar(100);

-- =============================================
-- HNSW Indexes for Voyage AI (1024-dim)
-- =============================================

-- Cosine similarity index (primary for semantic search)
CREATE INDEX IF NOT EXISTS idx_voyage_embedding_cosine 
ON security_service.memory_entries 
USING hnsw (voyage_embedding vector_cosine_ops) 
WITH (m = 16, ef_construction = 64);

-- Euclidean distance index
CREATE INDEX IF NOT EXISTS idx_voyage_embedding_euclidean 
ON security_service.memory_entries 
USING hnsw (voyage_embedding vector_l2_ops) 
WITH (m = 16, ef_construction = 64);

-- Inner product index
CREATE INDEX IF NOT EXISTS idx_voyage_embedding_ip 
ON security_service.memory_entries 
USING hnsw (voyage_embedding vector_ip_ops) 
WITH (m = 16, ef_construction = 64);

-- =============================================
-- Voyage AI Match Memories Function
-- =============================================

CREATE OR REPLACE FUNCTION security_service.match_memories_voyage(
    query_embedding vector(1024),
    match_threshold float DEFAULT 0.7,
    match_count int DEFAULT 10,
    filter_organization_id uuid DEFAULT NULL,
    filter_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    title varchar,
    content text,
    tags text[],
    metadata jsonb,
    similarity float,
    embedding_provider varchar,
    embedding_model varchar,
    created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = security_service, public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        me.id,
        me.title,
        me.content,
        me.tags,
        me.metadata,
        (1 - (me.voyage_embedding <=> query_embedding))::float as similarity,
        me.embedding_provider,
        me.embedding_model,
        me.created_at
    FROM security_service.memory_entries me
    WHERE me.voyage_embedding IS NOT NULL
        AND (filter_organization_id IS NULL OR me.organization_id = filter_organization_id)
        AND (filter_user_id IS NULL OR me.user_id = filter_user_id)
        AND 1 - (me.voyage_embedding <=> query_embedding) > match_threshold
    ORDER BY me.voyage_embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- =============================================
-- Voyage AI Hybrid Search (Semantic + Keyword)
-- =============================================

CREATE OR REPLACE FUNCTION security_service.hybrid_search_voyage(
    query_embedding vector(1024),
    query_text text,
    match_count int DEFAULT 10,
    semantic_weight float DEFAULT 0.7,
    keyword_weight float DEFAULT 0.3,
    filter_organization_id uuid DEFAULT NULL,
    filter_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    title varchar,
    content text,
    tags text[],
    metadata jsonb,
    semantic_score float,
    keyword_score float,
    combined_score float,
    embedding_provider varchar,
    created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = security_service, public
AS $$
BEGIN
    RETURN QUERY
    WITH semantic_results AS (
        SELECT 
            me.id,
            me.title,
            me.content,
            me.tags,
            me.metadata,
            me.embedding_provider,
            me.created_at,
            (1 - (me.voyage_embedding <=> query_embedding))::float as sem_score
        FROM security_service.memory_entries me
        WHERE me.voyage_embedding IS NOT NULL
            AND (filter_organization_id IS NULL OR me.organization_id = filter_organization_id)
            AND (filter_user_id IS NULL OR me.user_id = filter_user_id)
        ORDER BY me.voyage_embedding <=> query_embedding
        LIMIT match_count * 2
    ),
    keyword_results AS (
        SELECT 
            me.id,
            ts_rank(
                to_tsvector('english', COALESCE(me.title, '') || ' ' || COALESCE(me.content, '')),
                plainto_tsquery('english', query_text)
            )::float as kw_score
        FROM security_service.memory_entries me
        WHERE to_tsvector('english', COALESCE(me.title, '') || ' ' || COALESCE(me.content, '')) 
              @@ plainto_tsquery('english', query_text)
            AND (filter_organization_id IS NULL OR me.organization_id = filter_organization_id)
            AND (filter_user_id IS NULL OR me.user_id = filter_user_id)
    )
    SELECT 
        s.id,
        s.title,
        s.content,
        s.tags,
        s.metadata,
        s.sem_score as semantic_score,
        COALESCE(k.kw_score, 0.0)::float as keyword_score,
        (s.sem_score * semantic_weight + COALESCE(k.kw_score, 0.0) * keyword_weight)::float as combined_score,
        s.embedding_provider,
        s.created_at
    FROM semantic_results s
    LEFT JOIN keyword_results k ON s.id = k.id
    ORDER BY (s.sem_score * semantic_weight + COALESCE(k.kw_score, 0.0) * keyword_weight) DESC
    LIMIT match_count;
END;
$$;

-- =============================================
-- Upsert Memory with Voyage Embedding
-- =============================================

CREATE OR REPLACE FUNCTION security_service.upsert_memory_voyage(
    p_id uuid,
    p_organization_id uuid,
    p_user_id uuid,
    p_title varchar,
    p_content text,
    p_voyage_embedding vector(1024),
    p_tags text[] DEFAULT '{}',
    p_metadata jsonb DEFAULT '{}'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = security_service, public
AS $$
DECLARE
    result_id uuid;
BEGIN
    INSERT INTO security_service.memory_entries (
        id, organization_id, user_id, title, content, 
        voyage_embedding, embedding_provider, embedding_model,
        tags, metadata, created_at, updated_at
    )
    VALUES (
        COALESCE(p_id, gen_random_uuid()),
        p_organization_id,
        p_user_id,
        p_title,
        p_content,
        p_voyage_embedding,
        'voyage',
        'voyage-3.5',
        p_tags,
        p_metadata,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        content = EXCLUDED.content,
        voyage_embedding = EXCLUDED.voyage_embedding,
        embedding_provider = 'voyage',
        embedding_model = 'voyage-3.5',
        tags = EXCLUDED.tags,
        metadata = EXCLUDED.metadata,
        updated_at = NOW()
    RETURNING id INTO result_id;
    
    RETURN result_id;
END;
$$;

-- =============================================
-- Grant Permissions
-- =============================================

GRANT EXECUTE ON FUNCTION security_service.match_memories_voyage TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION security_service.hybrid_search_voyage TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION security_service.upsert_memory_voyage TO authenticated, service_role;

-- =============================================
-- Documentation
-- =============================================

COMMENT ON COLUMN security_service.memory_entries.voyage_embedding IS 
    'Voyage AI embedding vector (1024 dimensions) - voyage-3.5/voyage-4 models. Anthropic recommended.';

COMMENT ON COLUMN security_service.memory_entries.embedding_provider IS 
    'Provider that generated the embedding: openai, voyage, local';

COMMENT ON COLUMN security_service.memory_entries.embedding_model IS 
    'Specific model: text-embedding-3-small, voyage-3.5, voyage-code-3, etc.';

COMMENT ON FUNCTION security_service.match_memories_voyage IS 
    'Semantic search using Voyage AI embeddings (1024-dim). Returns memories ranked by cosine similarity.';

COMMENT ON FUNCTION security_service.hybrid_search_voyage IS 
    'Hybrid search: Voyage AI semantic (70%) + PostgreSQL full-text keyword (30%). Best of both worlds.';

COMMENT ON FUNCTION security_service.upsert_memory_voyage IS 
    'Insert or update memory with Voyage AI embedding. Auto-sets provider=voyage, model=voyage-3.5.';

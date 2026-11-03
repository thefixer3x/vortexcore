-- Applied migration 20260208032148 (add_clean_memory_views), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.


-- =============================================
-- Clean Presentation Layer for Memory Entries
-- Hides raw vectors, presents clean data
-- =============================================

-- Drop existing view if exists
DROP VIEW IF EXISTS security_service.memories_clean;

-- =============================================
-- Clean Memory View (No Vectors Exposed)
-- =============================================

CREATE OR REPLACE VIEW security_service.memories_clean AS
SELECT 
    id,
    organization_id,
    user_id,
    title,
    content,
    -- Clean type presentation
    COALESCE(type, 'context') as memory_type,
    tags,
    topic_id,
    -- Metadata without internal fields
    metadata - 'embedding_raw' - 'vector_debug' as metadata,
    -- Embedding status (not the actual vectors!)
    CASE 
        WHEN embedding IS NOT NULL AND voyage_embedding IS NOT NULL THEN 'dual'
        WHEN voyage_embedding IS NOT NULL THEN 'voyage'
        WHEN embedding IS NOT NULL THEN 'openai'
        ELSE 'none'
    END as embedding_status,
    -- Provider info (clean)
    COALESCE(embedding_provider, 'openai') as provider,
    embedding_model as model,
    -- Timestamps (formatted)
    created_at,
    updated_at,
    last_accessed,
    access_count,
    -- Computed fields
    CHAR_LENGTH(content) as content_length,
    ARRAY_LENGTH(tags, 1) as tag_count
FROM security_service.memory_entries;

-- =============================================
-- Clean Search Results Function
-- Returns beautifully formatted results
-- =============================================

CREATE OR REPLACE FUNCTION security_service.search_memories_clean(
    query_embedding vector(1024),
    search_query text DEFAULT NULL,
    match_threshold float DEFAULT 0.5,
    match_count int DEFAULT 10,
    filter_organization_id uuid DEFAULT NULL,
    filter_user_id uuid DEFAULT NULL,
    filter_tags text[] DEFAULT NULL,
    include_highlights boolean DEFAULT true
)
RETURNS TABLE (
    id uuid,
    title varchar,
    content_preview text,
    full_content text,
    memory_type varchar,
    tags text[],
    relevance_score numeric,
    relevance_label text,
    match_reason text,
    provider text,
    created_at timestamptz,
    last_accessed timestamptz,
    access_count integer,
    metadata jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = security_service, public
AS $$
BEGIN
    RETURN QUERY
    WITH ranked_results AS (
        SELECT 
            me.id,
            me.title,
            me.content,
            COALESCE(me.type, 'context')::varchar as mem_type,
            me.tags,
            me.metadata - 'embedding_raw' - 'vector_debug' as clean_metadata,
            me.embedding_provider,
            me.created_at,
            me.last_accessed,
            me.access_count,
            (1 - (me.voyage_embedding <=> query_embedding)) as raw_score
        FROM security_service.memory_entries me
        WHERE me.voyage_embedding IS NOT NULL
            AND (filter_organization_id IS NULL OR me.organization_id = filter_organization_id)
            AND (filter_user_id IS NULL OR me.user_id = filter_user_id)
            AND (filter_tags IS NULL OR me.tags && filter_tags)
            AND (1 - (me.voyage_embedding <=> query_embedding)) > match_threshold
        ORDER BY me.voyage_embedding <=> query_embedding
        LIMIT match_count
    )
    SELECT 
        r.id,
        r.title,
        -- Content preview (first 200 chars, clean)
        CASE 
            WHEN LENGTH(r.content) > 200 
            THEN SUBSTRING(r.content FROM 1 FOR 200) || '...'
            ELSE r.content
        END as content_preview,
        r.content as full_content,
        r.mem_type as memory_type,
        r.tags,
        -- Relevance as percentage (0-100)
        ROUND((r.raw_score * 100)::numeric, 1) as relevance_score,
        -- Human-readable relevance
        CASE 
            WHEN r.raw_score >= 0.9 THEN 'Excellent match'
            WHEN r.raw_score >= 0.8 THEN 'Very good match'
            WHEN r.raw_score >= 0.7 THEN 'Good match'
            WHEN r.raw_score >= 0.6 THEN 'Moderate match'
            WHEN r.raw_score >= 0.5 THEN 'Partial match'
            ELSE 'Weak match'
        END as relevance_label,
        -- Match reason
        CASE
            WHEN search_query IS NOT NULL AND r.title ILIKE '%' || search_query || '%' 
            THEN 'Title contains "' || search_query || '"'
            WHEN search_query IS NOT NULL AND r.content ILIKE '%' || search_query || '%'
            THEN 'Content matches search terms'
            ELSE 'Semantically similar'
        END as match_reason,
        COALESCE(r.embedding_provider, 'voyage') as provider,
        r.created_at,
        r.last_accessed,
        r.access_count,
        r.clean_metadata as metadata
    FROM ranked_results r
    ORDER BY r.raw_score DESC;
END;
$$;

-- =============================================
-- Get Memory by ID (Clean, No Vectors)
-- =============================================

CREATE OR REPLACE FUNCTION security_service.get_memory_clean(
    memory_id uuid,
    requesting_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    title varchar,
    content text,
    memory_type varchar,
    tags text[],
    metadata jsonb,
    embedding_status text,
    provider text,
    model text,
    created_at timestamptz,
    updated_at timestamptz,
    last_accessed timestamptz,
    access_count integer,
    content_length integer,
    word_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = security_service, public
AS $$
BEGIN
    -- Update access tracking
    UPDATE security_service.memory_entries 
    SET 
        last_accessed = NOW(),
        access_count = COALESCE(access_count, 0) + 1
    WHERE security_service.memory_entries.id = memory_id;

    RETURN QUERY
    SELECT 
        me.id,
        me.title,
        me.content,
        COALESCE(me.type, 'context')::varchar as memory_type,
        me.tags,
        me.metadata - 'embedding_raw' - 'vector_debug' as metadata,
        CASE 
            WHEN me.embedding IS NOT NULL AND me.voyage_embedding IS NOT NULL THEN 'dual (OpenAI + Voyage)'
            WHEN me.voyage_embedding IS NOT NULL THEN 'voyage-ai'
            WHEN me.embedding IS NOT NULL THEN 'openai'
            ELSE 'not embedded'
        END as embedding_status,
        COALESCE(me.embedding_provider, 'unknown') as provider,
        me.embedding_model as model,
        me.created_at,
        me.updated_at,
        me.last_accessed,
        me.access_count,
        CHAR_LENGTH(me.content)::integer as content_length,
        ARRAY_LENGTH(REGEXP_SPLIT_TO_ARRAY(me.content, '\s+'), 1)::integer as word_count
    FROM security_service.memory_entries me
    WHERE me.id = memory_id;
END;
$$;

-- =============================================
-- List Memories (Paginated, Clean)
-- =============================================

CREATE OR REPLACE FUNCTION security_service.list_memories_clean(
    filter_organization_id uuid DEFAULT NULL,
    filter_user_id uuid DEFAULT NULL,
    filter_tags text[] DEFAULT NULL,
    filter_type varchar DEFAULT NULL,
    sort_by varchar DEFAULT 'created_at',
    sort_order varchar DEFAULT 'desc',
    page_size int DEFAULT 20,
    page_offset int DEFAULT 0
)
RETURNS TABLE (
    id uuid,
    title varchar,
    content_preview text,
    memory_type varchar,
    tags text[],
    embedding_status text,
    provider text,
    created_at timestamptz,
    updated_at timestamptz,
    access_count integer,
    total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = security_service, public
AS $$
DECLARE
    total bigint;
BEGIN
    -- Get total count
    SELECT COUNT(*) INTO total
    FROM security_service.memory_entries me
    WHERE (filter_organization_id IS NULL OR me.organization_id = filter_organization_id)
        AND (filter_user_id IS NULL OR me.user_id = filter_user_id)
        AND (filter_tags IS NULL OR me.tags && filter_tags)
        AND (filter_type IS NULL OR me.type = filter_type);

    RETURN QUERY
    SELECT 
        me.id,
        me.title,
        CASE 
            WHEN LENGTH(me.content) > 150 
            THEN SUBSTRING(me.content FROM 1 FOR 150) || '...'
            ELSE me.content
        END as content_preview,
        COALESCE(me.type, 'context')::varchar as memory_type,
        me.tags,
        CASE 
            WHEN me.embedding IS NOT NULL AND me.voyage_embedding IS NOT NULL THEN 'dual'
            WHEN me.voyage_embedding IS NOT NULL THEN 'voyage'
            WHEN me.embedding IS NOT NULL THEN 'openai'
            ELSE 'none'
        END as embedding_status,
        COALESCE(me.embedding_provider, 'openai') as provider,
        me.created_at,
        me.updated_at,
        me.access_count,
        total as total_count
    FROM security_service.memory_entries me
    WHERE (filter_organization_id IS NULL OR me.organization_id = filter_organization_id)
        AND (filter_user_id IS NULL OR me.user_id = filter_user_id)
        AND (filter_tags IS NULL OR me.tags && filter_tags)
        AND (filter_type IS NULL OR me.type = filter_type)
    ORDER BY 
        CASE WHEN sort_by = 'created_at' AND sort_order = 'desc' THEN me.created_at END DESC,
        CASE WHEN sort_by = 'created_at' AND sort_order = 'asc' THEN me.created_at END ASC,
        CASE WHEN sort_by = 'updated_at' AND sort_order = 'desc' THEN me.updated_at END DESC,
        CASE WHEN sort_by = 'updated_at' AND sort_order = 'asc' THEN me.updated_at END ASC,
        CASE WHEN sort_by = 'title' AND sort_order = 'asc' THEN me.title END ASC,
        CASE WHEN sort_by = 'title' AND sort_order = 'desc' THEN me.title END DESC,
        CASE WHEN sort_by = 'access_count' AND sort_order = 'desc' THEN me.access_count END DESC NULLS LAST
    LIMIT page_size
    OFFSET page_offset;
END;
$$;

-- =============================================
-- Memory Statistics (Clean Summary)
-- =============================================

CREATE OR REPLACE FUNCTION security_service.get_memory_stats(
    filter_organization_id uuid DEFAULT NULL,
    filter_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
    total_memories bigint,
    memories_with_voyage_embedding bigint,
    memories_with_openai_embedding bigint,
    memories_with_dual_embedding bigint,
    memories_without_embedding bigint,
    total_content_size bigint,
    avg_content_length numeric,
    most_used_tags jsonb,
    memory_types_breakdown jsonb,
    oldest_memory timestamptz,
    newest_memory timestamptz,
    most_accessed_memory uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = security_service, public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::bigint as total_memories,
        COUNT(*) FILTER (WHERE me.voyage_embedding IS NOT NULL AND me.embedding IS NULL)::bigint as memories_with_voyage_embedding,
        COUNT(*) FILTER (WHERE me.embedding IS NOT NULL AND me.voyage_embedding IS NULL)::bigint as memories_with_openai_embedding,
        COUNT(*) FILTER (WHERE me.embedding IS NOT NULL AND me.voyage_embedding IS NOT NULL)::bigint as memories_with_dual_embedding,
        COUNT(*) FILTER (WHERE me.embedding IS NULL AND me.voyage_embedding IS NULL)::bigint as memories_without_embedding,
        SUM(CHAR_LENGTH(me.content))::bigint as total_content_size,
        ROUND(AVG(CHAR_LENGTH(me.content))::numeric, 0) as avg_content_length,
        (
            SELECT jsonb_agg(jsonb_build_object('tag', tag, 'count', cnt))
            FROM (
                SELECT UNNEST(me2.tags) as tag, COUNT(*) as cnt
                FROM security_service.memory_entries me2
                WHERE (filter_organization_id IS NULL OR me2.organization_id = filter_organization_id)
                    AND (filter_user_id IS NULL OR me2.user_id = filter_user_id)
                GROUP BY tag
                ORDER BY cnt DESC
                LIMIT 10
            ) top_tags
        ) as most_used_tags,
        (
            SELECT jsonb_object_agg(COALESCE(me2.type, 'context'), cnt)
            FROM (
                SELECT COALESCE(me2.type, 'context') as type, COUNT(*) as cnt
                FROM security_service.memory_entries me2
                WHERE (filter_organization_id IS NULL OR me2.organization_id = filter_organization_id)
                    AND (filter_user_id IS NULL OR me2.user_id = filter_user_id)
                GROUP BY me2.type
            ) type_counts
        ) as memory_types_breakdown,
        MIN(me.created_at) as oldest_memory,
        MAX(me.created_at) as newest_memory,
        (
            SELECT me2.id 
            FROM security_service.memory_entries me2
            WHERE (filter_organization_id IS NULL OR me2.organization_id = filter_organization_id)
                AND (filter_user_id IS NULL OR me2.user_id = filter_user_id)
            ORDER BY me2.access_count DESC NULLS LAST
            LIMIT 1
        ) as most_accessed_memory
    FROM security_service.memory_entries me
    WHERE (filter_organization_id IS NULL OR me.organization_id = filter_organization_id)
        AND (filter_user_id IS NULL OR me.user_id = filter_user_id);
END;
$$;

-- =============================================
-- Grant Permissions
-- =============================================

GRANT SELECT ON security_service.memories_clean TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION security_service.search_memories_clean TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION security_service.get_memory_clean TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION security_service.list_memories_clean TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION security_service.get_memory_stats TO authenticated, service_role;

-- =============================================
-- Documentation
-- =============================================

COMMENT ON VIEW security_service.memories_clean IS 
    'Clean view of memories without raw vector data. Safe for dashboard, CLI, SDK, API exposure.';

COMMENT ON FUNCTION security_service.search_memories_clean IS 
    'Professional semantic search with clean results: relevance scores as percentages, human-readable labels, content previews.';

COMMENT ON FUNCTION security_service.get_memory_clean IS 
    'Get single memory with clean presentation. Auto-updates access tracking. No vector exposure.';

COMMENT ON FUNCTION security_service.list_memories_clean IS 
    'Paginated memory listing with clean presentation. Supports filtering, sorting, pagination.';

COMMENT ON FUNCTION security_service.get_memory_stats IS 
    'Memory collection statistics: embedding coverage, content sizes, popular tags, type breakdown.';

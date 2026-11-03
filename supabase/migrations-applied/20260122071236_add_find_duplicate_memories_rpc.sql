-- Applied migration 20260122071236 (add_find_duplicate_memories_rpc), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.

-- RPC function to find duplicate memories using vector similarity
-- Used by intelligence-detect-duplicates edge function

CREATE OR REPLACE FUNCTION public.find_duplicate_memories(
  p_user_id UUID,
  p_threshold FLOAT DEFAULT 0.85,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  primary_id UUID,
  primary_title TEXT,
  duplicate_id UUID,
  duplicate_title TEXT,
  similarity FLOAT,
  duplicate_created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH memory_pairs AS (
    SELECT 
      m1.id AS primary_id,
      m1.title AS primary_title,
      m1.embedding AS primary_embedding,
      m2.id AS duplicate_id,
      m2.title AS duplicate_title,
      m2.created_at AS duplicate_created_at,
      1 - (m1.embedding <=> m2.embedding) AS similarity
    FROM memory_entries m1
    INNER JOIN memory_entries m2 
      ON m1.id < m2.id  -- Avoid self-joins and duplicates
      AND m1.user_id = m2.user_id
    WHERE m1.user_id = p_user_id
      AND m1.embedding IS NOT NULL
      AND m2.embedding IS NOT NULL
  )
  SELECT 
    mp.primary_id,
    mp.primary_title::TEXT,
    mp.duplicate_id,
    mp.duplicate_title::TEXT,
    mp.similarity::FLOAT,
    mp.duplicate_created_at
  FROM memory_pairs mp
  WHERE mp.similarity >= p_threshold
  ORDER BY mp.similarity DESC
  LIMIT p_limit;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.find_duplicate_memories(UUID, FLOAT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.find_duplicate_memories(UUID, FLOAT, INTEGER) TO service_role;

-- Add comment explaining the function
COMMENT ON FUNCTION public.find_duplicate_memories IS 
'Finds duplicate memory entries using pgvector cosine similarity. 
Returns pairs of memories with similarity >= threshold.
Used by intelligence-detect-duplicates edge function.';
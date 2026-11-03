-- Applied migration 20260122073449 (add_memory_scan_limit_to_duplicate_detection), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.

-- Add memory scan limit to prevent expensive queries for users with large collections
-- This limits HOW MANY memories are compared (input), not just how many pairs are returned (output)

DROP FUNCTION IF EXISTS public.find_duplicate_memories(uuid, double precision, integer);

CREATE OR REPLACE FUNCTION public.find_duplicate_memories(
  p_user_id UUID,
  p_threshold FLOAT DEFAULT 0.85,
  p_limit INTEGER DEFAULT 50,
  p_max_memories INTEGER DEFAULT 500  -- Limit input memories to scan (prevents O(n²) blowup)
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
SET search_path = public, extensions
AS $$
BEGIN
  RETURN QUERY
  WITH recent_memories AS (
    -- Only consider the most recent N memories with embeddings
    SELECT id, title, embedding, created_at, user_id
    FROM memory_entries
    WHERE user_id = p_user_id
      AND embedding IS NOT NULL
    ORDER BY created_at DESC
    LIMIT p_max_memories
  ),
  memory_pairs AS (
    SELECT 
      m1.id AS primary_id,
      m1.title AS primary_title,
      m2.id AS duplicate_id,
      m2.title AS duplicate_title,
      m2.created_at AS duplicate_created_at,
      1 - (m1.embedding <=> m2.embedding) AS similarity
    FROM recent_memories m1
    INNER JOIN recent_memories m2 
      ON m1.id < m2.id
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

-- Add comment explaining the parameter
COMMENT ON FUNCTION public.find_duplicate_memories(uuid, double precision, integer, integer) IS 
'Finds duplicate memories using vector similarity. 
Parameters:
- p_user_id: User whose memories to check
- p_threshold: Minimum similarity score (0-1, default 0.85)
- p_limit: Max duplicate pairs to return (default 50)
- p_max_memories: Max memories to scan (default 500, prevents O(n²) blowup for large collections)';

GRANT EXECUTE ON FUNCTION public.find_duplicate_memories(uuid, double precision, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.find_duplicate_memories(uuid, double precision, integer, integer) TO service_role;
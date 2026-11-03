-- Applied migration 20260208115939 (create_voyage_migration_helpers), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.

-- Step 3: Create helper RPC functions for migration

-- Get memories that need Voyage embeddings
CREATE OR REPLACE FUNCTION public.get_memories_needing_voyage_migration(p_limit int DEFAULT 100)
RETURNS TABLE (
  id uuid,
  content text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, security_service
AS $$
BEGIN
  RETURN QUERY
  SELECT m.id, m.content
  FROM security_service.memory_entries m
  WHERE m.voyage_embedding IS NULL
  ORDER BY m.created_at DESC
  LIMIT p_limit;
END;
$$;

-- Update a memory with Voyage embedding
CREATE OR REPLACE FUNCTION public.update_memory_voyage_embedding(
  p_memory_id uuid,
  p_voyage_embedding vector(1024),
  p_embedding_model text DEFAULT 'voyage-4'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, security_service
AS $$
BEGIN
  UPDATE security_service.memory_entries
  SET 
    voyage_embedding = p_voyage_embedding,
    embedding_provider = 'voyage',
    embedding_model = p_embedding_model,
    updated_at = NOW()
  WHERE id = p_memory_id;
  
  RETURN FOUND;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_memories_needing_voyage_migration TO service_role;
GRANT EXECUTE ON FUNCTION public.update_memory_voyage_embedding TO service_role;
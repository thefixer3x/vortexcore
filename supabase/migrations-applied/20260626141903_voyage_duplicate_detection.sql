-- Applied migration 20260626141903 (voyage_duplicate_detection), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.

CREATE OR REPLACE FUNCTION detect_duplicate_memories_voyage(
  match_threshold FLOAT DEFAULT 0.85,
  neighbors_per_memory INT DEFAULT 5,
  max_memories INT DEFAULT 2000,
  filter_organization_id UUID DEFAULT NULL,
  filter_user_id UUID DEFAULT NULL,
  filter_type TEXT DEFAULT NULL
)
RETURNS TABLE (
  primary_id UUID,
  primary_title TEXT,
  primary_created_at TIMESTAMPTZ,
  duplicate_id UUID,
  duplicate_title TEXT,
  duplicate_created_at TIMESTAMPTZ,
  similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  source_table TEXT;
  type_col TEXT;
BEGIN
  IF to_regclass('security_service.memory_entries') IS NOT NULL THEN
    source_table := 'security_service.memory_entries';
  ELSIF to_regclass('maas.memory_entries') IS NOT NULL THEN
    source_table := 'maas.memory_entries';
  ELSIF to_regclass('public.memory_entries') IS NOT NULL THEN
    source_table := 'public.memory_entries';
  ELSE
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = split_part(source_table, '.', 1)
      AND table_name = split_part(source_table, '.', 2)
      AND column_name = 'voyage_embedding'
  ) THEN
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = split_part(source_table, '.', 1)
      AND table_name = split_part(source_table, '.', 2)
      AND column_name = 'memory_type'
  ) THEN
    type_col := 'memory_type';
  ELSE
    type_col := 'type';
  END IF;

  RETURN QUERY EXECUTE format(
    'WITH base AS (
       SELECT id, title, created_at, voyage_embedding
       FROM %1$s
       WHERE voyage_embedding IS NOT NULL
         AND ($4 IS NULL OR organization_id = $4)
         AND ($5 IS NULL OR user_id = $5)
         AND ($6 IS NULL OR %2$I = $6)
       LIMIT $3
     )
     SELECT
       b.id,
       b.title::TEXT,
       b.created_at,
       n.id,
       n.title::TEXT,
       n.created_at,
       (1 - (b.voyage_embedding <=> n.voyage_embedding))::FLOAT AS similarity
     FROM base b
     CROSS JOIN LATERAL (
       SELECT m.id, m.title, m.created_at, m.voyage_embedding
       FROM %1$s m
       WHERE m.voyage_embedding IS NOT NULL
         AND m.id <> b.id
         AND ($4 IS NULL OR m.organization_id = $4)
         AND ($5 IS NULL OR m.user_id = $5)
         AND ($6 IS NULL OR m.%2$I = $6)
       ORDER BY m.voyage_embedding <=> b.voyage_embedding
       LIMIT $2
     ) n
     WHERE (1 - (b.voyage_embedding <=> n.voyage_embedding)) >= $1
       AND b.id < n.id
     ORDER BY similarity DESC',
    source_table,
    type_col
  )
  USING
    match_threshold,
    neighbors_per_memory,
    max_memories,
    filter_organization_id,
    filter_user_id,
    filter_type;
END;
$$;

GRANT EXECUTE ON FUNCTION detect_duplicate_memories_voyage TO authenticated, anon;
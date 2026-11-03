-- Applied migration 20261005040008 (detect_duplicates_scope_and_live_rows), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.

-- detect_duplicate_memories_voyage: close an anon-callable cross-tenant read
-- and stop it scanning soft-deleted rows. See repo migration
-- 20261005_029_detect_duplicates_scope_and_live_rows.sql for the full rationale.

CREATE OR REPLACE FUNCTION public.detect_duplicate_memories_voyage(
  match_threshold        DOUBLE PRECISION DEFAULT 0.85,
  neighbors_per_memory   INTEGER DEFAULT 5,
  max_memories           INTEGER DEFAULT 2000,
  filter_organization_id UUID DEFAULT NULL,
  filter_user_id         UUID DEFAULT NULL,
  filter_type            TEXT DEFAULT NULL
)
RETURNS TABLE (
  primary_id           UUID,
  primary_title        TEXT,
  primary_created_at   TIMESTAMPTZ,
  duplicate_id         UUID,
  duplicate_title      TEXT,
  duplicate_created_at TIMESTAMPTZ,
  similarity           DOUBLE PRECISION
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, extensions
AS $function$
DECLARE
  source_table TEXT;
  type_col     TEXT;
  live_pred    TEXT;
BEGIN
  IF filter_user_id IS NULL AND filter_organization_id IS NULL THEN
    RAISE EXCEPTION 'detect_duplicate_memories_voyage: filter_user_id or filter_organization_id is required'
      USING ERRCODE = '42501';
  END IF;

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

  live_pred := CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = split_part(source_table, '.', 1)
      AND table_name   = split_part(source_table, '.', 2)
      AND column_name  = 'deleted_at'
  ) THEN 'm.deleted_at IS NULL' ELSE 'TRUE' END;

  RETURN QUERY EXECUTE format(
    'WITH base AS (
       SELECT m.id, m.title, m.created_at, m.voyage_embedding
       FROM %1$s m
       WHERE m.voyage_embedding IS NOT NULL
         AND %3$s
         AND ($4 IS NULL OR m.organization_id = $4)
         AND ($5 IS NULL OR m.user_id = $5)
         AND ($6 IS NULL OR m.%2$I::TEXT = $6)
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
         AND %3$s
         AND ($4 IS NULL OR m.organization_id = $4)
         AND ($5 IS NULL OR m.user_id = $5)
         AND ($6 IS NULL OR m.%2$I::TEXT = $6)
       ORDER BY m.voyage_embedding <=> b.voyage_embedding
       LIMIT $2
     ) n
     WHERE (1 - (b.voyage_embedding <=> n.voyage_embedding)) >= $1
       AND b.id < n.id
     ORDER BY similarity DESC',
    source_table,
    type_col,
    live_pred
  )
  USING
    match_threshold,
    neighbors_per_memory,
    max_memories,
    filter_organization_id,
    filter_user_id,
    filter_type;
END;
$function$;

REVOKE ALL ON FUNCTION public.detect_duplicate_memories_voyage(DOUBLE PRECISION, INTEGER, INTEGER, UUID, UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.detect_duplicate_memories_voyage(DOUBLE PRECISION, INTEGER, INTEGER, UUID, UUID, TEXT) TO service_role;
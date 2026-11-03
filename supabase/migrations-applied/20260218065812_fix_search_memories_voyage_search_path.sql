-- Applied migration 20260218065812 (fix_search_memories_voyage_search_path), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.


CREATE OR REPLACE FUNCTION public.search_memories_voyage(
  query_embedding vector,
  match_threshold double precision DEFAULT 0.7,
  match_count integer DEFAULT 10,
  filter_organization_id uuid DEFAULT NULL::uuid,
  filter_user_id uuid DEFAULT NULL::uuid,
  filter_type text DEFAULT NULL::text
)
RETURNS TABLE(
  id uuid,
  title text,
  content text,
  memory_type text,
  tags text[],
  metadata jsonb,
  similarity_score double precision,
  user_id uuid,
  organization_id uuid,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
-- Locks the search path to prevent schema injection attacks.
-- Safe here because all object references in this function are already fully schema-qualified.
SET search_path = ''
AS $function$
DECLARE
  source_table TEXT;
  type_expr TEXT;
BEGIN
  -- Prefer real base tables, fall back to public relation only if needed
  IF to_regclass('security_service.memory_entries') IS NOT NULL THEN
    source_table := 'security_service.memory_entries';
  ELSIF to_regclass('maas.memory_entries') IS NOT NULL THEN
    source_table := 'maas.memory_entries';
  ELSIF to_regclass('public.memory_entries') IS NOT NULL THEN
    source_table := 'public.memory_entries';
  ELSE
    RETURN;
  END IF;

  -- If voyage_embedding isn't exposed on chosen relation, return empty result.
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = split_part(source_table, '.', 1)
      AND table_name = split_part(source_table, '.', 2)
      AND column_name = 'voyage_embedding'
  ) THEN
    RETURN;
  END IF;

  -- Support both memory_type (public/security_service) and type (maas legacy)
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = split_part(source_table, '.', 1)
      AND table_name = split_part(source_table, '.', 2)
      AND column_name = 'memory_type'
  ) THEN
    type_expr := 'm.memory_type::TEXT';
  ELSE
    type_expr := 'm.type::TEXT';
  END IF;

  RETURN QUERY EXECUTE format(
    'SELECT
      m.id,
      m.title::TEXT,
      m.content,
      %1$s AS memory_type,
      m.tags,
      m.metadata,
      (1 - (m.voyage_embedding <=> $1))::FLOAT AS similarity_score,
      m.user_id,
      m.organization_id,
      m.created_at,
      m.updated_at
    FROM %2$s m
    WHERE
      ($2 IS NULL OR m.organization_id = $2)
      AND ($3 IS NULL OR m.user_id = $3)
      AND ($4 IS NULL OR %1$s = $4)
      AND m.voyage_embedding IS NOT NULL
      AND (1 - (m.voyage_embedding <=> $1)) >= $5
    ORDER BY m.voyage_embedding <=> $1
    LIMIT $6',
    type_expr,
    source_table
  )
  USING
    query_embedding,
    filter_organization_id,
    filter_user_id,
    filter_type,
    match_threshold,
    match_count;
END;
$function$;

-- Applied migration 20261005040203 (analyze_patterns_aggregate_enum_cast), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.

-- analyze_patterns_aggregate: memory_type is the enum public.memory_type, so
-- COALESCE(memory_type, '<unknown>') cast '<unknown>' into the enum and every
-- call failed with 22P02. Cast to TEXT in the bounded CTE. Found by the
-- post-apply smoke test; mirrored in repo migration 024.

CREATE OR REPLACE FUNCTION public.analyze_patterns_aggregate(
  p_time_range_days        INT DEFAULT 30,
  p_filter_user_id         UUID DEFAULT NULL,
  p_filter_organization_id UUID DEFAULT NULL,
  p_filter_type            TEXT DEFAULT NULL,
  p_max_memories           INT DEFAULT 1000,
  p_top_n_tags             INT DEFAULT 10,
  p_top_n_hours            INT DEFAULT 3
)
RETURNS TABLE (
  total_memories           BIGINT,
  average_content_length   INT,
  type_distribution        JSONB,
  day_of_week_distribution JSONB,
  peak_hours               JSONB,
  top_tags                 JSONB,
  rows_considered          BIGINT,
  cap_hit                  BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, extensions
AS $$
DECLARE
  source_table TEXT;
  type_col     TEXT;
  live_pred    TEXT;
BEGIN
  IF p_filter_user_id IS NULL AND p_filter_organization_id IS NULL THEN
    RAISE EXCEPTION 'analyze_patterns_aggregate: p_filter_user_id or p_filter_organization_id is required'
      USING ERRCODE = '42501';
  END IF;

  IF to_regclass('security_service.memory_entries') IS NOT NULL THEN
    source_table := 'security_service.memory_entries';
  ELSIF to_regclass('maas.memory_entries') IS NOT NULL THEN
    source_table := 'maas.memory_entries';
  ELSIF to_regclass('public.memory_entries') IS NOT NULL THEN
    source_table := 'public.memory_entries';
  ELSE
    total_memories := 0;
    average_content_length := 0;
    type_distribution := '{}'::jsonb;
    day_of_week_distribution := '{}'::jsonb;
    peak_hours := '[]'::jsonb;
    top_tags := '[]'::jsonb;
    rows_considered := 0;
    cap_hit := FALSE;
    RETURN NEXT;
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = split_part(source_table, '.', 1)
      AND table_name   = split_part(source_table, '.', 2)
      AND column_name  = 'memory_type'
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

  p_time_range_days := LEAST(GREATEST(p_time_range_days, 1), 365);
  p_max_memories    := LEAST(GREATEST(p_max_memories,    10), 5000);
  p_top_n_tags      := LEAST(GREATEST(p_top_n_tags,       1), 50);
  p_top_n_hours     := LEAST(GREATEST(p_top_n_hours,      1), 24);

  RETURN QUERY EXECUTE format(
    'WITH bounded AS (
       SELECT id, title, content, %2$I::TEXT AS memory_type, tags, created_at, access_count
       FROM %1$s m
       WHERE %3$s
         AND ($3 IS NULL OR m.user_id = $3)
         AND ($4 IS NULL OR m.organization_id = $4)
         AND ($5::TEXT IS NULL OR %2$I::TEXT = $5)
         AND m.created_at >= NOW() - ($1 || '' days'')::INTERVAL
       ORDER BY m.created_at DESC
       LIMIT $2
     ),
     type_dist AS (
       SELECT COALESCE(memory_type, ''<unknown>'') AS memory_type, COUNT(*) AS n
       FROM bounded
       GROUP BY 1
     ),
     dow_dist AS (
       SELECT EXTRACT(ISODOW FROM created_at)::INT AS dow, COUNT(*) AS n
       FROM bounded
       GROUP BY 1
     ),
     hour_dist AS (
       SELECT EXTRACT(HOUR FROM created_at)::INT AS hour_of_day, COUNT(*) AS n
       FROM bounded
       GROUP BY 1
       ORDER BY n DESC, hour_of_day ASC
       LIMIT $6
     ),
     tag_dist AS (
       SELECT tag, COUNT(*) AS n
       FROM bounded, LATERAL unnest(COALESCE(tags, ARRAY[]::TEXT[])) AS tag
       WHERE tag IS NOT NULL AND LENGTH(tag) > 0
       GROUP BY tag
       ORDER BY n DESC, tag ASC
       LIMIT $7
     ),
     counted AS (
       SELECT COUNT(*)                                AS total,
              COALESCE(AVG(LENGTH(content)), 0)::INT AS avg_len
       FROM bounded
     )
     SELECT
       counted.total::BIGINT,
       counted.avg_len,
       COALESCE((SELECT jsonb_object_agg(memory_type, n) FROM type_dist), ''{}''::jsonb),
       ''{"1":0,"2":0,"3":0,"4":0,"5":0,"6":0,"7":0}''::jsonb
         || COALESCE((SELECT jsonb_object_agg(dow::TEXT, n) FROM dow_dist), ''{}''::jsonb),
       COALESCE((SELECT to_jsonb(array_agg(hour_of_day ORDER BY n DESC, hour_of_day ASC)) FROM hour_dist), ''[]''::jsonb),
       COALESCE((SELECT to_jsonb(array_agg(jsonb_build_object(''tag'', tag, ''count'', n))) FROM tag_dist), ''[]''::jsonb),
       counted.total::BIGINT,
       (counted.total = $2)
     FROM counted',
    source_table,
    type_col,
    live_pred
  )
  USING
    p_time_range_days,
    p_max_memories,
    p_filter_user_id,
    p_filter_organization_id,
    p_filter_type,
    p_top_n_hours,
    p_top_n_tags;
END;
$$;

REVOKE ALL ON FUNCTION public.analyze_patterns_aggregate(INT, UUID, UUID, TEXT, INT, INT, INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.analyze_patterns_aggregate(INT, UUID, UUID, TEXT, INT, INT, INT) TO service_role;
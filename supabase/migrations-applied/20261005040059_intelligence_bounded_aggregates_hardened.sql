-- Applied migration 20261005040059 (intelligence_bounded_aggregates_hardened), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.

-- Bounded intelligence aggregates, hardened before first application.
-- See repo migration 20260718_024_intelligence_bounded_aggregates.sql for the
-- full rationale (mandatory scope, service_role-only grants, pinned
-- search_path, deleted_at excluded, soft delete instead of hard delete).

CREATE OR REPLACE FUNCTION public.delete_duplicate_memories(
  duplicate_ids          UUID[],
  filter_user_id         UUID DEFAULT NULL,
  filter_organization_id UUID DEFAULT NULL,
  dry_run                BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  deleted_id              UUID,
  deleted_user_id         UUID,
  deleted_organization_id UUID,
  deleted_created_at      TIMESTAMPTZ,
  total_deleted           BIGINT,
  was_dry_run             BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, extensions
AS $$
DECLARE
  source_table TEXT;
BEGIN
  IF filter_user_id IS NULL AND filter_organization_id IS NULL THEN
    RAISE EXCEPTION 'delete_duplicate_memories: filter_user_id or filter_organization_id is required'
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
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = split_part(source_table, '.', 1)
      AND table_name   = split_part(source_table, '.', 2)
      AND column_name  = 'deleted_at'
  ) THEN
    RAISE EXCEPTION 'delete_duplicate_memories: % has no deleted_at column; refusing hard delete', source_table;
  END IF;

  IF duplicate_ids IS NULL OR array_length(duplicate_ids, 1) IS NULL THEN
    RETURN;
  END IF;

  IF array_length(duplicate_ids, 1) > 500 THEN
    RAISE EXCEPTION 'duplicate_ids array length (%) exceeds 500-row bulk cap',
      array_length(duplicate_ids, 1);
  END IF;

  IF dry_run THEN
    RETURN QUERY EXECUTE format(
      'SELECT
         m.id,
         m.user_id,
         m.organization_id,
         m.created_at,
         (SELECT COUNT(*) FROM %1$s m2
            WHERE m2.id = ANY($1)
              AND m2.deleted_at IS NULL
              AND ($2 IS NULL OR m2.user_id = $2)
              AND ($3 IS NULL OR m2.organization_id = $3))::BIGINT,
         TRUE
       FROM %1$s m
       WHERE m.id = ANY($1)
         AND m.deleted_at IS NULL
         AND ($2 IS NULL OR m.user_id = $2)
         AND ($3 IS NULL OR m.organization_id = $3)
       ORDER BY m.id',
      source_table
    )
    USING duplicate_ids, filter_user_id, filter_organization_id;
    RETURN;
  END IF;

  RETURN QUERY EXECUTE format(
    'WITH deleted AS (
       UPDATE %1$s m
          SET deleted_at = NOW()
        WHERE m.id = ANY($1)
          AND m.deleted_at IS NULL
          AND ($2 IS NULL OR m.user_id = $2)
          AND ($3 IS NULL OR m.organization_id = $3)
       RETURNING m.id, m.user_id, m.organization_id, m.created_at
     )
     SELECT
       d.id,
       d.user_id,
       d.organization_id,
       d.created_at,
       (SELECT COUNT(*) FROM deleted)::BIGINT,
       FALSE
     FROM deleted d
     ORDER BY d.id',
    source_table
  )
  USING duplicate_ids, filter_user_id, filter_organization_id;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_duplicate_memories(UUID[], UUID, UUID, BOOLEAN) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_duplicate_memories(UUID[], UUID, UUID, BOOLEAN) TO service_role;


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
       SELECT id, title, content, %2$I AS memory_type, tags, created_at, access_count
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


CREATE OR REPLACE FUNCTION public.list_insight_candidate_memories(
  p_filter_user_id         UUID DEFAULT NULL,
  p_filter_organization_id UUID DEFAULT NULL,
  p_filter_type            TEXT DEFAULT NULL,
  p_topic                  TEXT DEFAULT NULL,
  p_time_range_days        INT DEFAULT 30,
  p_max_memories           INT DEFAULT 50,
  p_offset                 INT DEFAULT 0,
  p_limit                  INT DEFAULT 50
)
RETURNS TABLE (
  id          UUID,
  title       TEXT,
  content     TEXT,
  memory_type TEXT,
  tags        TEXT[],
  created_at  TIMESTAMPTZ
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
    RAISE EXCEPTION 'list_insight_candidate_memories: p_filter_user_id or p_filter_organization_id is required'
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
  p_max_memories    := LEAST(GREATEST(p_max_memories,    5), 200);
  p_offset          := GREATEST(p_offset, 0);
  p_limit           := LEAST(GREATEST(p_limit, 1), GREATEST(p_max_memories, 1));

  RETURN QUERY EXECUTE format(
    'SELECT
       m.id,
       m.title::TEXT,
       m.content,
       %2$I::TEXT AS memory_type,
       m.tags,
       m.created_at
     FROM %1$s m
     WHERE %3$s
       AND ($1 IS NULL OR m.user_id = $1)
       AND ($2 IS NULL OR m.organization_id = $2)
       AND ($3::TEXT IS NULL OR %2$I::TEXT = $3)
       AND m.created_at >= NOW() - ($4 || '' days'')::INTERVAL
       AND ($5::TEXT IS NULL
            OR m.title   ILIKE ''%%'' || $5 || ''%%''
            OR m.content ILIKE ''%%'' || $5 || ''%%''
            OR EXISTS (
                 SELECT 1
                 FROM unnest(COALESCE(m.tags, ARRAY[]::TEXT[])) AS tag(tag_text)
                 WHERE tag_text ILIKE ''%%'' || $5 || ''%%''
               ))
     ORDER BY m.created_at DESC
     LIMIT $6
     OFFSET $7',
    source_table,
    type_col,
    live_pred
  )
  USING
    p_filter_user_id,
    p_filter_organization_id,
    p_filter_type,
    p_time_range_days,
    p_topic,
    p_limit,
    p_offset;
END;
$$;

REVOKE ALL ON FUNCTION public.list_insight_candidate_memories(UUID, UUID, TEXT, TEXT, INT, INT, INT, INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_insight_candidate_memories(UUID, UUID, TEXT, TEXT, INT, INT, INT, INT) TO service_role;

COMMENT ON FUNCTION public.delete_duplicate_memories(UUID[], UUID, UUID, BOOLEAN) IS
  'Soft-delete (sets deleted_at) of memory entries identified as duplicates by detect_duplicate_memories_voyage. Scope required; service_role only. dry_run=TRUE reports what would be deleted without touching rows.';
COMMENT ON FUNCTION public.analyze_patterns_aggregate(INT, UUID, UUID, TEXT, INT, INT, INT) IS
  'Server-side GROUP BY for intelligence-analyze-patterns over live (non-deleted) rows. Scope required; service_role only.';
COMMENT ON FUNCTION public.list_insight_candidate_memories(UUID, UUID, TEXT, TEXT, INT, INT, INT, INT) IS
  'Bounded, paginated fetch of live (non-deleted) rows for intelligence-extract-insights. Scope required; service_role only.';
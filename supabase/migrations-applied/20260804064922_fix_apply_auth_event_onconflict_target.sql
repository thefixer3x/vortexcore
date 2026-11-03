-- Applied migration 20260804064922 (fix_apply_auth_event_onconflict_target), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.

-- Retarget apply_auth_event's ON CONFLICT at the base table.
--
-- public.auth_events is an auto-updatable VIEW over auth_gateway.auth_events.
-- ON CONFLICT inference resolves against indexes on the relation named in the
-- INSERT; a view has none, so inference failed with 42P10 before the base
-- table was ever consulted. This blocked auth-gateway outbox delivery from
-- 2026-01-13.
--
-- The base table already has the required unique index
-- (auth_events_pkey on event_id, NOT NULL) and needs no change.
--
-- Source of truth: apps/onasis-core/supabase/migrations/
--   20260804_020_fix_apply_auth_event_onconflict_target.sql
-- Reviewed and merged in thefixer3x/Onasis-CORE#82 (merge e142600).
--
-- Only the INSERT target changes. The audit projection call, JSONB result
-- shape and exception handler are reproduced verbatim from the live
-- definition. search_path stays 'pg_catalog','public' and the new target is
-- schema-qualified; auth_gateway is deliberately NOT added to the search path
-- of a SECURITY DEFINER function.

CREATE OR REPLACE FUNCTION public.apply_auth_event(
  p_event_id uuid,
  p_aggregate_type text,
  p_aggregate_id text,
  p_version bigint,
  p_event_type text,
  p_event_type_version integer,
  p_payload jsonb,
  p_metadata jsonb,
  p_occurred_at timestamp with time zone
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  v_result JSONB;
  v_is_new BOOLEAN;
  v_projected_to_audit BOOLEAN := false;
BEGIN
  -- Target the base table, not the public view. ON CONFLICT inference cannot
  -- resolve through a view.
  INSERT INTO auth_gateway.auth_events (
    event_id,
    aggregate_type,
    aggregate_id,
    version,
    event_type,
    event_type_version,
    payload,
    metadata,
    occurred_at
  ) VALUES (
    p_event_id,
    p_aggregate_type,
    p_aggregate_id,
    p_version,
    p_event_type,
    p_event_type_version,
    p_payload,
    p_metadata,
    p_occurred_at
  )
  ON CONFLICT (event_id) DO NOTHING
  RETURNING true INTO v_is_new;

  v_projected_to_audit := public.project_auth_event_to_audit_log(
    p_event_id,
    p_aggregate_type,
    p_aggregate_id,
    p_event_type,
    p_payload,
    p_metadata,
    p_occurred_at
  );

  v_result := jsonb_build_object(
    'success', true,
    'event_id', p_event_id,
    'is_new', COALESCE(v_is_new, false),
    'projected_to_audit', COALESCE(v_projected_to_audit, false),
    'ingested_at', NOW()
  );

  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'event_id', p_event_id,
      'error', SQLERRM,
      'error_detail', SQLSTATE
    );
END;
$function$;
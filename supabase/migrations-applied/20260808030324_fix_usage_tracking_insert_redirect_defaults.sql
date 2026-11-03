-- Applied migration 20260808030324 (fix_usage_tracking_insert_redirect_defaults), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.

CREATE OR REPLACE FUNCTION public.usage_tracking_insert_redirect()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'analytics', 'public'
AS $function$
BEGIN
  INSERT INTO analytics.usage_tracking (id, user_id, action, metadata, created_at)
  VALUES (
    COALESCE(NEW.id, gen_random_uuid()),
    NEW.user_id,
    NEW.action,
    COALESCE(NEW.metadata, '{}'::jsonb),
    COALESCE(NEW.created_at, now())
  );
  RETURN NEW;
END;
$function$;
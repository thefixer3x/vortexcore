-- Applied migration 20260808030422 (fix_usage_tracking_insert_redirect_defaults), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.

CREATE OR REPLACE FUNCTION public.usage_tracking_insert_redirect()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'analytics', 'public'
AS $function$
BEGIN
  NEW.id := COALESCE(NEW.id, gen_random_uuid());
  NEW.metadata := COALESCE(NEW.metadata, '{}'::jsonb);
  NEW.created_at := COALESCE(NEW.created_at, now());

  INSERT INTO analytics.usage_tracking (id, user_id, action, metadata, created_at)
  VALUES (NEW.id, NEW.user_id, NEW.action, NEW.metadata, NEW.created_at);

  RETURN NEW;
END;
$function$;
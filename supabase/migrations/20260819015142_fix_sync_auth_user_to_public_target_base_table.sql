-- Captured verbatim from supabase_migrations.schema_migrations (applied
-- remotely 2026-08-19; no local file existed until now). Already applied
-- to mxtsdgkwzjzlttpotole; committed here for reproducibility only, not to
-- be pushed against that project again.

-- INSERT must target security_service.users (the base table, which has the
-- PK that ON CONFLICT needs), not the public.users view — ON CONFLICT
-- cannot resolve against a view's relation even when it's auto-updatable.
CREATE OR REPLACE FUNCTION public.sync_auth_user_to_public()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO security_service.users (id, email, password_hash, organization_id, role, plan, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    'managed_by_supabase_auth',
    COALESCE(
      (NEW.raw_user_meta_data->>'organization_id')::uuid,
      'ba2c1b22-3c4d-4a5b-aca3-881995d863d5'
    ),
    'user'::user_role,
    'free'::plan_type,
    NEW.created_at,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();

  INSERT INTO public.profiles (id, email, organization_id, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      (NEW.raw_user_meta_data->>'organization_id')::uuid,
      (SELECT organization_id FROM security_service.users WHERE id = NEW.id),
      'ba2c1b22-3c4d-4a5b-aca3-881995d863d5'
    ),
    NEW.created_at,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    organization_id = COALESCE(
      EXCLUDED.organization_id,
      public.profiles.organization_id
    ),
    updated_at = NOW();

  RETURN NEW;
END;
$function$

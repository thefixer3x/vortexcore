-- Applied migration 20260327212331 (add_organization_id_to_profiles), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.


-- Step 1: Add organization_id column to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- Step 2: Backfill from public.users (which already has correct org linkage)
UPDATE public.profiles p
SET organization_id = u.organization_id,
    updated_at = NOW()
FROM public.users u
WHERE p.id = u.id
  AND p.organization_id IS NULL
  AND u.organization_id IS NOT NULL;

-- Step 3: Index for query performance
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON public.profiles(organization_id);

-- Step 4: Update sync function to carry org_id into profiles on future signups
CREATE OR REPLACE FUNCTION public.sync_auth_user_to_public()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.users (id, email, password_hash, organization_id, role, plan, created_at, updated_at)
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
      (SELECT organization_id FROM public.users WHERE id = NEW.id),
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
$$;

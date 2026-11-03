-- Applied migration 20260906165600 (20260906_022_repair_projects_organization_id), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.

-- Repair an historical CREATE TABLE IF NOT EXISTS gap on control_room.projects.
--
-- public.projects is the security-invoker facade over that base table. Extend
-- the facade only after updating the base table so existing API callers can
-- read and write the new nullable ownership column.

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

DO $$
BEGIN
  IF to_regclass('control_room.projects') IS NULL THEN
    RAISE EXCEPTION 'control_room.projects is required before repairing organization ownership';
  END IF;

  IF to_regclass('public.organizations') IS NULL THEN
    RAISE EXCEPTION 'public.organizations is required before repairing projects.organization_id';
  END IF;
END;
$$;

ALTER TABLE control_room.projects
  ADD COLUMN IF NOT EXISTS organization_id UUID;

-- Only backfill metadata values that are syntactically UUIDs and resolve to a
-- current public.organizations row. The remaining rows stay deliberately NULL.
UPDATE control_room.projects AS project
SET organization_id = organization.id
FROM public.organizations AS organization
WHERE project.organization_id IS NULL
  AND project.metadata ? 'organization_id'
  AND project.metadata->>'organization_id' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  AND organization.id::text = project.metadata->>'organization_id';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'projects_organization_id_fkey'
      AND conrelid = 'control_room.projects'::regclass
  ) THEN
    ALTER TABLE control_room.projects
      ADD CONSTRAINT projects_organization_id_fkey
      FOREIGN KEY (organization_id)
      REFERENCES public.organizations(id)
      ON DELETE SET NULL
      NOT VALID;
  END IF;
END;
$$;

ALTER TABLE control_room.projects
  VALIDATE CONSTRAINT projects_organization_id_fkey;

CREATE INDEX IF NOT EXISTS idx_projects_organization_id
  ON control_room.projects(organization_id)
  WHERE organization_id IS NOT NULL;

-- Preserve the facade's existing security-invoker model and append the new
-- column so existing positional consumers retain their current column order.
CREATE OR REPLACE VIEW public.projects
WITH (security_invoker = true)
AS
SELECT
  id,
  name,
  description,
  type,
  status,
  api_key,
  metadata,
  created_at,
  updated_at,
  organization_id
FROM control_room.projects;

COMMENT ON COLUMN control_room.projects.organization_id IS
  'Nullable canonical organization ownership. Backfilled only when metadata.organization_id resolves to public.organizations.';

DO $$
DECLARE
  total_count INTEGER;
  linked_count INTEGER;
  unresolved_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count FROM control_room.projects;
  SELECT COUNT(*) INTO linked_count FROM control_room.projects WHERE organization_id IS NOT NULL;
  SELECT COUNT(*) INTO unresolved_count FROM control_room.projects WHERE organization_id IS NULL;

  RAISE NOTICE
    'projects organization repair complete: total=%, linked=%, unresolved=%',
    total_count,
    linked_count,
    unresolved_count;
END;
$$;

COMMIT;

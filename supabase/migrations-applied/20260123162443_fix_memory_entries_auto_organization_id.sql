-- Applied migration 20260123162443 (fix_memory_entries_auto_organization_id), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.

-- Fix memory_entries_insert to auto-populate organization_id from users table
-- This ensures organization_id is always set, even when frontend doesn't provide it

CREATE OR REPLACE FUNCTION public.memory_entries_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  resolved_org_id UUID;
BEGIN
  -- If organization_id not provided, look it up from users table
  IF NEW.organization_id IS NULL AND NEW.user_id IS NOT NULL THEN
    SELECT organization_id INTO resolved_org_id
    FROM public.users
    WHERE id = NEW.user_id;
    
    -- If still null, try maas.users
    IF resolved_org_id IS NULL THEN
      SELECT organization_id INTO resolved_org_id
      FROM maas.users
      WHERE id = NEW.user_id;
    END IF;
    
    NEW.organization_id := resolved_org_id;
  END IF;
  
  -- If still null, raise an error with helpful message
  IF NEW.organization_id IS NULL THEN
    RAISE EXCEPTION 'organization_id is required. User % does not have an organization assigned.', NEW.user_id;
  END IF;

  -- Insert into security_service schema
  INSERT INTO security_service.memory_entries (
    id, title, content, memory_type, tags, topic_id, user_id, 
    organization_id, embedding, metadata, created_at, updated_at, 
    last_accessed, access_count, type
  ) VALUES (
    COALESCE(NEW.id, extensions.uuid_generate_v4()),
    NEW.title,
    NEW.content,
    COALESCE(NEW.memory_type, 'context'),
    COALESCE(NEW.tags, '{}'::text[]),
    NEW.topic_id,
    NEW.user_id,
    NEW.organization_id,  -- Now guaranteed to be populated
    NEW.embedding,
    COALESCE(NEW.metadata, '{}'),
    COALESCE(NEW.created_at, now()),
    COALESCE(NEW.updated_at, now()),
    NEW.last_accessed,
    COALESCE(NEW.access_count, 0),
    COALESCE(NEW.type, 'context')
  );
  
  RETURN NEW;
END;
$function$;

-- Also update the maas schema trigger if it exists separately
CREATE OR REPLACE FUNCTION maas.memory_entries_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  resolved_org_id UUID;
BEGIN
  -- If organization_id not provided, look it up from users table
  IF NEW.organization_id IS NULL AND NEW.user_id IS NOT NULL THEN
    SELECT organization_id INTO resolved_org_id
    FROM maas.users
    WHERE id = NEW.user_id;
    
    -- Fallback to public.users
    IF resolved_org_id IS NULL THEN
      SELECT organization_id INTO resolved_org_id
      FROM public.users
      WHERE id = NEW.user_id;
    END IF;
    
    NEW.organization_id := resolved_org_id;
  END IF;
  
  -- If still null, raise an error with helpful message
  IF NEW.organization_id IS NULL THEN
    RAISE EXCEPTION 'organization_id is required. User % does not have an organization assigned.', NEW.user_id;
  END IF;

  RETURN NEW;
END;
$function$;
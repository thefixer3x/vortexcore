-- Applied migration 20260812183147 (api_key_context_projection_rollout), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.

-- ADR-004 staged rollout: complete the MXT projection contract only after
-- browser key issuance is routed through auth-gateway. Apply as reviewed SQL;
-- never use supabase db push against the shared production project.

ALTER TABLE public.api_keys
  ADD COLUMN IF NOT EXISTS key_context text,
  ADD COLUMN IF NOT EXISTS binding jsonb NOT NULL DEFAULT '{}'::jsonb;

UPDATE public.api_keys
SET key_context = NULL
WHERE key_context = 'legacy';

ALTER TABLE public.api_keys
  DROP CONSTRAINT IF EXISTS api_keys_key_context_check;

ALTER TABLE public.api_keys
  ADD CONSTRAINT api_keys_key_context_check
  CHECK (key_context IS NULL OR key_context IN ('personal', 'team', 'enterprise'))
  NOT VALID;

ALTER TABLE public.api_keys
  VALIDATE CONSTRAINT api_keys_key_context_check;

COMMENT ON COLUMN public.api_keys.key_context IS
  'Memory boundary metadata projected to PTNR: personal, team, enterprise; NULL is legacy.';

COMMENT ON COLUMN public.api_keys.binding IS
  'Consumer binding metadata projected to PTNR independently of memory context.';

CREATE OR REPLACE FUNCTION public.trigger_sync_api_key()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  edge_function_url TEXT;
  request_id BIGINT;
  user_org_id UUID;
  service_key TEXT;
BEGIN
  edge_function_url := 'https://mxtsdgkwzjzlttpotole.supabase.co/functions/v1/sync-api-key';

  SELECT decrypted_secret INTO service_key
  FROM vault.decrypted_secrets
  WHERE name = 'service_role_key';

  SELECT organization_id INTO user_org_id
  FROM public.users
  WHERE id = NEW.user_id;

  SELECT net.http_post(
    url := edge_function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'api_keys',
      'schema', 'public',
      'record', jsonb_build_object(
        'id', NEW.id,
        'user_id', NEW.user_id,
        'organization_id', user_org_id,
        'name', NEW.name,
        'key_hash', NEW.key_hash,
        'access_level', COALESCE(NEW.access_level, 'authenticated'),
        'permissions', COALESCE(NEW.permissions, '[]'::jsonb),
        'key_context', NEW.key_context,
        'binding', COALESCE(NEW.binding, '{}'::jsonb),
        'expires_at', NEW.expires_at,
        'created_at', NEW.created_at,
        'is_active', COALESCE(NEW.is_active, true)
      ),
      'old_record', NULL
    )
  ) INTO request_id;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.trigger_sync_api_key_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  edge_function_url TEXT;
  request_id BIGINT;
  event_type TEXT;
  user_org_id UUID;
  service_key TEXT;
BEGIN
  edge_function_url := 'https://mxtsdgkwzjzlttpotole.supabase.co/functions/v1/sync-api-key';

  SELECT decrypted_secret INTO service_key
  FROM vault.decrypted_secrets
  WHERE name = 'service_role_key';

  SELECT organization_id INTO user_org_id
  FROM public.users
  WHERE id = NEW.user_id;

  IF OLD.is_active = true AND NEW.is_active = false THEN
    event_type := 'REVOKE';
  ELSIF OLD.key_hash IS DISTINCT FROM NEW.key_hash THEN
    event_type := 'ROTATE';
  ELSE
    event_type := 'UPDATE';
  END IF;

  SELECT net.http_post(
    url := edge_function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    ),
    body := jsonb_build_object(
      'type', event_type,
      'table', 'api_keys',
      'schema', 'public',
      'record', jsonb_build_object(
        'id', NEW.id,
        'user_id', NEW.user_id,
        'organization_id', user_org_id,
        'name', NEW.name,
        'key_hash', NEW.key_hash,
        'access_level', COALESCE(NEW.access_level, 'authenticated'),
        'permissions', COALESCE(NEW.permissions, '[]'::jsonb),
        'key_context', NEW.key_context,
        'binding', COALESCE(NEW.binding, '{}'::jsonb),
        'expires_at', NEW.expires_at,
        'created_at', NEW.created_at,
        'is_active', COALESCE(NEW.is_active, true)
      ),
      'old_record', jsonb_build_object(
        'key_hash', OLD.key_hash,
        'is_active', OLD.is_active
      )
    )
  ) INTO request_id;

  RAISE LOG 'API key % triggered for % (org: %), request_id: %', event_type, NEW.id, user_org_id, request_id;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.trigger_sync_api_key_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  edge_function_url TEXT;
  request_id BIGINT;
  service_key TEXT;
  user_org_id UUID;
BEGIN
  edge_function_url := 'https://mxtsdgkwzjzlttpotole.supabase.co/functions/v1/sync-api-key';

  SELECT decrypted_secret INTO service_key
  FROM vault.decrypted_secrets
  WHERE name = 'service_role_key';

  SELECT organization_id INTO user_org_id
  FROM public.users
  WHERE id = OLD.user_id;

  SELECT net.http_post(
    url := edge_function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    ),
    body := jsonb_build_object(
      'type', 'DELETE',
      'table', 'api_keys',
      'schema', 'public',
      'record', NULL,
      'old_record', jsonb_build_object(
        'id', OLD.id,
        'user_id', OLD.user_id,
        'organization_id', user_org_id,
        'name', COALESCE(OLD.name, 'deleted-key'),
        'key_hash', OLD.key_hash,
        'access_level', COALESCE(OLD.access_level, 'authenticated'),
        'permissions', COALESCE(OLD.permissions, '[]'::jsonb),
        'key_context', OLD.key_context,
        'binding', COALESCE(OLD.binding, '{}'::jsonb),
        'is_active', false,
        'created_at', OLD.created_at
      )
    )
  ) INTO request_id;

  RAISE LOG 'API key DELETE triggered for % request_id: %', OLD.id, request_id;
  RETURN OLD;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.trigger_sync_api_key()
FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trigger_sync_api_key_update()
FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trigger_sync_api_key_delete()
FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trigger_api_key_sync_on_update ON public.api_keys;

CREATE TRIGGER trigger_api_key_sync_on_update
AFTER UPDATE OF
  key_hash,
  is_active,
  permissions,
  access_level,
  key_context,
  binding,
  expires_at,
  user_id,
  organization_id,
  name
ON public.api_keys
FOR EACH ROW
WHEN (
  OLD.key_hash IS DISTINCT FROM NEW.key_hash
  OR OLD.is_active IS DISTINCT FROM NEW.is_active
  OR OLD.permissions IS DISTINCT FROM NEW.permissions
  OR OLD.access_level IS DISTINCT FROM NEW.access_level
  OR OLD.key_context IS DISTINCT FROM NEW.key_context
  OR OLD.binding IS DISTINCT FROM NEW.binding
  OR OLD.expires_at IS DISTINCT FROM NEW.expires_at
  OR OLD.user_id IS DISTINCT FROM NEW.user_id
  OR OLD.organization_id IS DISTINCT FROM NEW.organization_id
  OR OLD.name IS DISTINCT FROM NEW.name
)
EXECUTE FUNCTION public.trigger_sync_api_key_update();
-- Applied migration 20261017054242 (sync_triggers_webhook_secret_header), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.

CREATE OR REPLACE FUNCTION public.trigger_sync_api_key()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  edge_function_url TEXT;
  request_id BIGINT;
  user_org_id UUID;
  sync_secret TEXT;
BEGIN
  edge_function_url := 'https://mxtsdgkwzjzlttpotole.supabase.co/functions/v1/sync-api-key';

  SELECT decrypted_secret INTO sync_secret
  FROM vault.decrypted_secrets
  WHERE name = 'sync_webhook_secret';

  SELECT organization_id INTO user_org_id
  FROM public.users
  WHERE id = NEW.user_id;

  SELECT net.http_post(
    url := edge_function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Sync-Webhook-Secret', sync_secret
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
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  edge_function_url TEXT;
  request_id BIGINT;
  event_type TEXT;
  user_org_id UUID;
  sync_secret TEXT;
BEGIN
  edge_function_url := 'https://mxtsdgkwzjzlttpotole.supabase.co/functions/v1/sync-api-key';

  SELECT decrypted_secret INTO sync_secret
  FROM vault.decrypted_secrets
  WHERE name = 'sync_webhook_secret';

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
      'X-Sync-Webhook-Secret', sync_secret
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
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  edge_function_url TEXT;
  request_id BIGINT;
  sync_secret TEXT;
  user_org_id UUID;
BEGIN
  edge_function_url := 'https://mxtsdgkwzjzlttpotole.supabase.co/functions/v1/sync-api-key';

  SELECT decrypted_secret INTO sync_secret
  FROM vault.decrypted_secrets
  WHERE name = 'sync_webhook_secret';

  SELECT organization_id INTO user_org_id
  FROM public.users
  WHERE id = OLD.user_id;

  SELECT net.http_post(
    url := edge_function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Sync-Webhook-Secret', sync_secret
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

CREATE OR REPLACE FUNCTION public.trigger_sync_user()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  edge_function_url TEXT;
  request_id BIGINT;
  sync_secret TEXT;
  event_type TEXT;
BEGIN
  edge_function_url := 'https://mxtsdgkwzjzlttpotole.supabase.co/functions/v1/sync-user';

  IF TG_OP = 'INSERT' THEN
    event_type := 'INSERT';
  ELSIF TG_OP = 'UPDATE' THEN
    event_type := 'UPDATE';
  ELSE
    event_type := TG_OP;
  END IF;

  SELECT decrypted_secret INTO sync_secret
  FROM vault.decrypted_secrets
  WHERE name = 'sync_webhook_secret';

  SELECT net.http_post(
    url := edge_function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Sync-Webhook-Secret', sync_secret
    ),
    body := jsonb_build_object(
      'type', event_type,
      'table', 'users',
      'record', jsonb_build_object(
        'id', NEW.id,
        'email', NEW.email,
        'role', COALESCE(NEW.role::text, 'user'),
        'organization_id', NEW.organization_id,
        'plan', NEW.plan,
        'created_at', NEW.created_at,
        'updated_at', NEW.updated_at
      )
    )
  ) INTO request_id;

  RETURN NEW;
END;
$function$;
-- Applied migration 20260421102020 (fix_trigger_sync_user_role_enum), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.

CREATE OR REPLACE FUNCTION public.trigger_sync_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  edge_function_url TEXT;
  request_id BIGINT;
  service_key TEXT;
  event_type TEXT;
BEGIN
  -- Get the edge function URL
  edge_function_url := 'https://mxtsdgkwzjzlttpotole.supabase.co/functions/v1/sync-user';
  
  -- Determine event type
  IF TG_OP = 'INSERT' THEN
    event_type := 'INSERT';
  ELSIF TG_OP = 'UPDATE' THEN
    event_type := 'UPDATE';
  ELSE
    event_type := TG_OP;
  END IF;
  
  -- Get the service role key from vault
  SELECT decrypted_secret INTO service_key
  FROM vault.decrypted_secrets
  WHERE name = 'service_role_key';
  
  -- Call the edge function via pg_net
  SELECT net.http_post(
    url := edge_function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
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
$$;
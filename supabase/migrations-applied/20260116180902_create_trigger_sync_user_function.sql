-- Applied migration 20260116180902 (create_trigger_sync_user_function), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.


-- Create trigger function to sync users to auth-gateway
-- Similar to trigger_sync_api_key but for auth.users table

CREATE OR REPLACE FUNCTION public.trigger_sync_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
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
      'table', 'auth.users',
      'record', jsonb_build_object(
        'id', NEW.id,
        'email', NEW.email,
        'role', NEW.role,
        'raw_user_meta_data', COALESCE(NEW.raw_user_meta_data, '{}'::jsonb),
        'raw_app_meta_data', COALESCE(NEW.raw_app_meta_data, '{}'::jsonb),
        'email_confirmed_at', NEW.email_confirmed_at,
        'last_sign_in_at', NEW.last_sign_in_at,
        'created_at', NEW.created_at,
        'updated_at', NEW.updated_at
      )
    )
  ) INTO request_id;
  
  RETURN NEW;
END;
$function$;

-- Add comment for documentation
COMMENT ON FUNCTION public.trigger_sync_user() IS 'Syncs user data from auth.users to auth-gateway via edge function for CQRS and user_accounts table';

-- Applied migration 20260116230524 (setup_user_sync_cron), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.

-- =============================================================================
-- CRON JOB: Batch sync users from Main DB → Auth-Gateway
-- Runs every 6 hours at minute 0
-- =============================================================================

-- Create a config table for sync settings (more secure than hardcoding)
CREATE TABLE IF NOT EXISTS public.sync_config (
  key text PRIMARY KEY,
  value text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Store the webhook secret
INSERT INTO public.sync_config (key, value)
VALUES ('webhook_secret', 'd45932caace861750bed85b45ee56c391c967919d9a12df049d6df4aaa248bc1')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

-- Restrict access to service role only
ALTER TABLE public.sync_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only" ON public.sync_config
  FOR ALL USING (auth.role() = 'service_role');

-- Create a helper function to call the sync edge function
CREATE OR REPLACE FUNCTION public.trigger_user_sync_to_auth_gateway()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  webhook_secret text;
  request_id bigint;
BEGIN
  -- Get webhook secret from config
  SELECT value INTO webhook_secret
  FROM public.sync_config
  WHERE key = 'webhook_secret';
  
  IF webhook_secret IS NULL THEN
    RAISE WARNING 'User sync webhook secret not found in sync_config';
    RETURN;
  END IF;

  -- Call the batch-sync-users edge function
  SELECT net.http_post(
    url := 'https://mxtsdgkwzjzlttpotole.supabase.co/functions/v1/batch-sync-users',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Webhook-Secret', webhook_secret
    ),
    body := '{}'::jsonb
  ) INTO request_id;

  RAISE NOTICE 'User sync to Auth-Gateway triggered, request_id: %', request_id;
END;
$$;

-- Schedule the cron job: Every 6 hours at minute 0
SELECT cron.schedule(
  'sync-users-to-auth-gateway',
  '0 */6 * * *',
  $$SELECT public.trigger_user_sync_to_auth_gateway()$$
);

-- Create a job log table to track sync history
CREATE TABLE IF NOT EXISTS public.user_sync_log (
  id serial PRIMARY KEY,
  sync_type text NOT NULL,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  status text DEFAULT 'pending',
  users_synced int,
  errors jsonb,
  metadata jsonb
);

COMMENT ON FUNCTION public.trigger_user_sync_to_auth_gateway() IS 
'Triggers batch sync of users from Main DB to Auth-Gateway. Called by pg_cron every 6 hours.';
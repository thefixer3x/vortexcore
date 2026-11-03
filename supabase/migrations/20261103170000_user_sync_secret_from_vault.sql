-- The user-sync webhook secret used to live in plain text in public.sync_config
-- and was published in a reference copy of 20260116230524_setup_user_sync_cron.sql.
-- It was rotated on 2026-11-03. The new value is stored out of band in Vault as
-- 'user_sync_webhook_secret' (and as the WEBHOOK_SECRET function secret); it is
-- never written in a migration.

CREATE OR REPLACE FUNCTION public.trigger_user_sync_to_auth_gateway()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  webhook_secret text;
  request_id bigint;
BEGIN
  SELECT decrypted_secret INTO webhook_secret
  FROM vault.decrypted_secrets
  WHERE name = 'user_sync_webhook_secret';

  IF webhook_secret IS NULL THEN
    RAISE WARNING 'Vault secret user_sync_webhook_secret not found';
    RETURN;
  END IF;

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

-- Only pg_cron (as postgres) should run this.
REVOKE EXECUTE ON FUNCTION public.trigger_user_sync_to_auth_gateway() FROM PUBLIC, anon, authenticated;

DELETE FROM public.sync_config WHERE key = 'webhook_secret';

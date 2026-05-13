-- BYOK credentials table in dedicated schema
CREATE TABLE IF NOT EXISTS app_vortexcore.vortex_user_ai_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  label TEXT,
  encrypted_key TEXT NOT NULL,
  key_hint TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  last_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider)
);

ALTER TABLE app_vortexcore.vortex_user_ai_credentials ENABLE ROW LEVEL SECURITY;

-- Deny-all by default; access goes through SECURITY DEFINER RPCs and edge functions (service role)
CREATE POLICY "deny all client access"
  ON app_vortexcore.vortex_user_ai_credentials
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);

CREATE OR REPLACE FUNCTION app_vortexcore.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_user_ai_credentials_updated ON app_vortexcore.vortex_user_ai_credentials;
CREATE TRIGGER trg_user_ai_credentials_updated
  BEFORE UPDATE ON app_vortexcore.vortex_user_ai_credentials
  FOR EACH ROW EXECUTE FUNCTION app_vortexcore.touch_updated_at();

-- Public-schema RPC: status only, never returns the key
CREATE OR REPLACE FUNCTION public.vortex_get_ai_credential_status(_provider TEXT)
RETURNS TABLE (
  provider TEXT,
  label TEXT,
  key_hint TEXT,
  status TEXT,
  last_verified_at TIMESTAMPTZ,
  connected BOOLEAN
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, app_vortexcore
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  RETURN QUERY
  SELECT c.provider, c.label, c.key_hint, c.status, c.last_verified_at, TRUE AS connected
  FROM app_vortexcore.vortex_user_ai_credentials c
  WHERE c.user_id = auth.uid() AND c.provider = _provider;
END;
$$;

-- Public-schema RPC: disconnect
CREATE OR REPLACE FUNCTION public.vortex_delete_ai_credential(_provider TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, app_vortexcore
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  DELETE FROM app_vortexcore.vortex_user_ai_credentials
  WHERE user_id = auth.uid() AND provider = _provider;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.vortex_get_ai_credential_status(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.vortex_delete_ai_credential(TEXT) TO authenticated;
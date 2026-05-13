
-- Make sure RLS is on
ALTER TABLE app_vortexcore.vortex_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vortex_settings_owner" ON app_vortexcore.vortex_settings;
CREATE POLICY "vortex_settings_owner"
  ON app_vortexcore.vortex_settings
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Public RPC wrappers (PostgREST only exposes public)
CREATE OR REPLACE FUNCTION public.vortex_get_setting(p_key text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, app_vortexcore
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_val jsonb;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  SELECT value INTO v_val
  FROM app_vortexcore.vortex_settings
  WHERE user_id = v_uid AND key = p_key;
  RETURN COALESCE(v_val, '{}'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.vortex_set_setting(p_key text, p_value jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, app_vortexcore
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  INSERT INTO app_vortexcore.vortex_settings (user_id, key, value)
  VALUES (v_uid, p_key, p_value)
  ON CONFLICT (user_id, key)
  DO UPDATE SET value = EXCLUDED.value, updated_at = now();
  RETURN p_value;
END;
$$;

GRANT EXECUTE ON FUNCTION public.vortex_get_setting(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.vortex_set_setting(text, jsonb) TO authenticated;

-- Applied migration 20260123060150 (015_universal_auth_identifier_schema_only), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.

-- Universal Authentication Identifier (UAI) Schema - SCHEMA ONLY
-- For databases without auth_gateway.user_accounts
-- Creates UAI infrastructure for cross-service identity resolution

BEGIN;

-- =============================================================================
-- CORE UAI TABLE: auth_identities
-- =============================================================================
CREATE TABLE IF NOT EXISTS auth_gateway.auth_identities (
  auth_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted', 'pending_verification')),
  primary_email TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  organization_id UUID,
  email_verified BOOLEAN DEFAULT false,
  phone_verified BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_auth_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_auth_identities_primary_email ON auth_gateway.auth_identities(LOWER(primary_email));
CREATE INDEX IF NOT EXISTS idx_auth_identities_organization_id ON auth_gateway.auth_identities(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_auth_identities_status ON auth_gateway.auth_identities(status);
CREATE INDEX IF NOT EXISTS idx_auth_identities_created_at ON auth_gateway.auth_identities(created_at DESC);

CREATE OR REPLACE FUNCTION auth_gateway.touch_auth_identity()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auth_identities_updated_at ON auth_gateway.auth_identities;
CREATE TRIGGER trg_auth_identities_updated_at
BEFORE UPDATE ON auth_gateway.auth_identities
FOR EACH ROW EXECUTE FUNCTION auth_gateway.touch_auth_identity();

-- =============================================================================
-- AUTH CREDENTIALS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS auth_gateway.auth_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID NOT NULL REFERENCES auth_gateway.auth_identities(auth_id) ON DELETE CASCADE,
  method TEXT NOT NULL CHECK (method IN (
    'supabase_jwt', 'api_key', 'oauth_pkce', 'oauth_token', 'magic_link',
    'otp_email', 'otp_sms', 'sso_session', 'password', 'passkey', 'mcp_token'
  )),
  identifier TEXT NOT NULL,
  credential_hash TEXT,
  provider TEXT,
  provider_user_id TEXT,
  platform TEXT CHECK (platform IN ('mcp', 'cli', 'web', 'api', 'mobile', 'sdk')),
  is_primary BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  UNIQUE(method, identifier)
);

CREATE INDEX IF NOT EXISTS idx_auth_credentials_auth_id ON auth_gateway.auth_credentials(auth_id);
CREATE INDEX IF NOT EXISTS idx_auth_credentials_method ON auth_gateway.auth_credentials(method);
CREATE INDEX IF NOT EXISTS idx_auth_credentials_identifier ON auth_gateway.auth_credentials(identifier);
CREATE INDEX IF NOT EXISTS idx_auth_credentials_method_identifier ON auth_gateway.auth_credentials(method, identifier);
CREATE INDEX IF NOT EXISTS idx_auth_credentials_provider ON auth_gateway.auth_credentials(provider) WHERE provider IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_auth_credentials_active ON auth_gateway.auth_credentials(auth_id) WHERE is_active = true;

DROP TRIGGER IF EXISTS trg_auth_credentials_updated_at ON auth_gateway.auth_credentials;
CREATE TRIGGER trg_auth_credentials_updated_at
BEFORE UPDATE ON auth_gateway.auth_credentials
FOR EACH ROW EXECUTE FUNCTION auth_gateway.touch_auth_identity();

-- =============================================================================
-- IDENTITY PROVENANCE TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS auth_gateway.identity_provenance (
  id BIGSERIAL PRIMARY KEY,
  auth_id UUID NOT NULL REFERENCES auth_gateway.auth_identities(auth_id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'identity_created', 'identity_merged', 'identity_split', 'identity_suspended',
    'identity_reactivated', 'identity_deleted', 'credential_added', 'credential_removed',
    'credential_rotated', 'credential_verified', 'credential_expired', 'primary_changed',
    'email_changed', 'organization_changed', 'auth_success', 'auth_failure',
    'token_issued', 'token_revoked'
  )),
  credential_id UUID REFERENCES auth_gateway.auth_credentials(id) ON DELETE SET NULL,
  actor_auth_id UUID REFERENCES auth_gateway.auth_identities(auth_id) ON DELETE SET NULL,
  actor_type TEXT CHECK (actor_type IN ('user', 'admin', 'system', 'api')),
  ip_address INET,
  user_agent TEXT,
  platform TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  related_auth_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_identity_provenance_auth_id ON auth_gateway.identity_provenance(auth_id);
CREATE INDEX IF NOT EXISTS idx_identity_provenance_event_type ON auth_gateway.identity_provenance(event_type);
CREATE INDEX IF NOT EXISTS idx_identity_provenance_created_at ON auth_gateway.identity_provenance(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_identity_provenance_credential_id ON auth_gateway.identity_provenance(credential_id) WHERE credential_id IS NOT NULL;

-- =============================================================================
-- IDENTITY RESOLUTION FUNCTION
-- =============================================================================
CREATE OR REPLACE FUNCTION auth_gateway.resolve_identity(
  p_method TEXT,
  p_identifier TEXT,
  p_create_if_missing BOOLEAN DEFAULT false,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
  v_auth_id UUID;
  v_credential_id UUID;
BEGIN
  SELECT auth_id INTO v_auth_id
  FROM auth_gateway.auth_credentials
  WHERE method = p_method
    AND identifier = p_identifier
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW());

  IF v_auth_id IS NOT NULL THEN
    UPDATE auth_gateway.auth_credentials
    SET last_used_at = NOW()
    WHERE method = p_method AND identifier = p_identifier;

    UPDATE auth_gateway.auth_identities
    SET last_auth_at = NOW()
    WHERE auth_id = v_auth_id;

    RETURN v_auth_id;
  END IF;

  IF p_create_if_missing THEN
    INSERT INTO auth_gateway.auth_identities (
      primary_email,
      metadata
    ) VALUES (
      CASE WHEN p_method IN ('magic_link', 'otp_email', 'supabase_jwt')
           THEN p_identifier
           ELSE NULL END,
      p_metadata
    )
    RETURNING auth_id INTO v_auth_id;

    INSERT INTO auth_gateway.auth_credentials (
      auth_id,
      method,
      identifier,
      is_primary,
      metadata
    ) VALUES (
      v_auth_id,
      p_method,
      p_identifier,
      true,
      p_metadata
    )
    RETURNING id INTO v_credential_id;

    INSERT INTO auth_gateway.identity_provenance (
      auth_id,
      event_type,
      credential_id,
      actor_type,
      details
    ) VALUES (
      v_auth_id,
      'identity_created',
      v_credential_id,
      'system',
      jsonb_build_object(
        'method', p_method,
        'identifier', p_identifier,
        'source', 'auto_creation'
      )
    );

    RETURN v_auth_id;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- LINK CREDENTIAL FUNCTION
-- =============================================================================
CREATE OR REPLACE FUNCTION auth_gateway.link_credential(
  p_auth_id UUID,
  p_method TEXT,
  p_identifier TEXT,
  p_is_primary BOOLEAN DEFAULT false,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_actor_auth_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_credential_id UUID;
  v_existing_auth_id UUID;
BEGIN
  SELECT auth_id INTO v_existing_auth_id
  FROM auth_gateway.auth_credentials
  WHERE method = p_method AND identifier = p_identifier;

  IF v_existing_auth_id IS NOT NULL THEN
    IF v_existing_auth_id = p_auth_id THEN
      SELECT id INTO v_credential_id
      FROM auth_gateway.auth_credentials
      WHERE method = p_method AND identifier = p_identifier;
      RETURN v_credential_id;
    ELSE
      RAISE EXCEPTION 'Credential already linked to different identity';
    END IF;
  END IF;

  IF p_is_primary THEN
    UPDATE auth_gateway.auth_credentials
    SET is_primary = false
    WHERE auth_id = p_auth_id AND method = p_method AND is_primary = true;
  END IF;

  INSERT INTO auth_gateway.auth_credentials (
    auth_id,
    method,
    identifier,
    is_primary,
    metadata
  ) VALUES (
    p_auth_id,
    p_method,
    p_identifier,
    p_is_primary,
    p_metadata
  )
  RETURNING id INTO v_credential_id;

  INSERT INTO auth_gateway.identity_provenance (
    auth_id,
    event_type,
    credential_id,
    actor_auth_id,
    actor_type,
    details
  ) VALUES (
    p_auth_id,
    'credential_added',
    v_credential_id,
    p_actor_auth_id,
    CASE WHEN p_actor_auth_id IS NOT NULL THEN 'user' ELSE 'system' END,
    jsonb_build_object(
      'method', p_method,
      'identifier', p_identifier,
      'is_primary', p_is_primary
    )
  );

  RETURN v_credential_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- RLS POLICIES
-- =============================================================================
ALTER TABLE auth_gateway.auth_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_gateway.auth_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_gateway.identity_provenance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage identities" ON auth_gateway.auth_identities;
CREATE POLICY "Service role can manage identities" ON auth_gateway.auth_identities
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage credentials" ON auth_gateway.auth_credentials;
CREATE POLICY "Service role can manage credentials" ON auth_gateway.auth_credentials
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can view provenance" ON auth_gateway.identity_provenance;
CREATE POLICY "Service role can view provenance" ON auth_gateway.identity_provenance
  FOR SELECT USING (true);

GRANT ALL ON auth_gateway.auth_identities TO service_role;
GRANT ALL ON auth_gateway.auth_credentials TO service_role;
GRANT SELECT, INSERT ON auth_gateway.identity_provenance TO service_role;
GRANT USAGE ON SEQUENCE auth_gateway.identity_provenance_id_seq TO service_role;

COMMENT ON TABLE auth_gateway.auth_identities IS 'Canonical identity table - single UUID per real user (UAI)';
COMMENT ON TABLE auth_gateway.auth_credentials IS 'Links authentication methods to canonical identities';
COMMENT ON TABLE auth_gateway.identity_provenance IS 'Audit trail for all identity-related events';
COMMENT ON COLUMN auth_gateway.auth_identities.auth_id IS 'Universal Authentication Identifier (UAI) - the single canonical ID';
COMMENT ON FUNCTION auth_gateway.resolve_identity IS 'Resolves any auth method to a canonical auth_id';
COMMENT ON FUNCTION auth_gateway.link_credential IS 'Links a new auth method to an existing identity';

COMMIT;
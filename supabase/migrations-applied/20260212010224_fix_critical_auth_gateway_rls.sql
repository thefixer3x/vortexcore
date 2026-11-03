-- Applied migration 20260212010224 (fix_critical_auth_gateway_rls), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.

-- CRITICAL: Replace overly permissive public policies with service_role-only policies

-- 1. Drop dangerous public policies
DROP POLICY IF EXISTS "Service role can manage credentials" ON auth_gateway.auth_credentials;
DROP POLICY IF EXISTS "Service role can manage identities" ON auth_gateway.auth_identities;
DROP POLICY IF EXISTS "Service role has full access to oauth_audit_log" ON auth_gateway.oauth_audit_log;
DROP POLICY IF EXISTS "Service role has full access to oauth_authorization_codes" ON auth_gateway.oauth_authorization_codes;
DROP POLICY IF EXISTS "Service role has full access to oauth_clients" ON auth_gateway.oauth_clients;
DROP POLICY IF EXISTS "Service role has full access to oauth_tokens" ON auth_gateway.oauth_tokens;

-- 2. Create secure service_role-only policies
CREATE POLICY "Service role can manage credentials"
  ON auth_gateway.auth_credentials
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage identities"
  ON auth_gateway.auth_identities
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to oauth_audit_log"
  ON auth_gateway.oauth_audit_log
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to oauth_authorization_codes"
  ON auth_gateway.oauth_authorization_codes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to oauth_clients"
  ON auth_gateway.oauth_clients
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to oauth_tokens"
  ON auth_gateway.oauth_tokens
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 3. Add read-only access for authenticated users to their own credentials
CREATE POLICY "Users can view their own credentials"
  ON auth_gateway.auth_credentials
  FOR SELECT
  TO authenticated
  USING (auth_id = auth.uid());

-- 4. Add read-only access for authenticated users to their own identities
CREATE POLICY "Users can view their own identities"
  ON auth_gateway.auth_identities
  FOR SELECT
  TO authenticated
  USING (auth_id = auth.uid());
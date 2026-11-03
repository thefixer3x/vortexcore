-- Applied migration 20260212010706 (rollback_auth_gateway_policies), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.

-- ROLLBACK: Restore original facade-friendly policies on auth_gateway tables
-- These tables are accessed through SECURITY INVOKER facade views in public schema

-- 1. Drop the overly restrictive service_role-only policies I just created
DROP POLICY IF EXISTS "Service role can manage credentials" ON auth_gateway.auth_credentials;
DROP POLICY IF EXISTS "Service role can manage identities" ON auth_gateway.auth_identities;
DROP POLICY IF EXISTS "Service role has full access to oauth_audit_log" ON auth_gateway.oauth_audit_log;
DROP POLICY IF EXISTS "Service role has full access to oauth_authorization_codes" ON auth_gateway.oauth_authorization_codes;
DROP POLICY IF EXISTS "Service role has full access to oauth_clients" ON auth_gateway.oauth_clients;
DROP POLICY IF EXISTS "Service role has full access to oauth_tokens" ON auth_gateway.oauth_tokens;
DROP POLICY IF EXISTS "Users can view their own credentials" ON auth_gateway.auth_credentials;
DROP POLICY IF EXISTS "Users can view their own identities" ON auth_gateway.auth_identities;

-- 2. Restore original policies that work with the facade pattern
-- Note: These allow broad access because the SECURITY INVOKER views in public schema
-- will enforce proper access control at the view level

CREATE POLICY "Service role can manage credentials"
  ON auth_gateway.auth_credentials
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage identities"
  ON auth_gateway.auth_identities
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to oauth_audit_log"
  ON auth_gateway.oauth_audit_log
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to oauth_authorization_codes"
  ON auth_gateway.oauth_authorization_codes
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to oauth_clients"
  ON auth_gateway.oauth_clients
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to oauth_tokens"
  ON auth_gateway.oauth_tokens
  FOR ALL
  USING (true)
  WITH CHECK (true);
-- =====================================================
-- CRITICAL SECURITY FIX - Enable RLS on Exposed Tables
-- =====================================================

BEGIN;

-- CRITICAL: Enable RLS on exposed public tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simple_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oauth_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_key_audit_log ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies for critical tables

-- 1. Users table - users can only see their own data
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- 2. Topics table - public read, authenticated write
CREATE POLICY "Anyone can view topics" ON public.topics
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create topics" ON public.topics
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 3. Simple users - users see own data
CREATE POLICY "Simple users view own data" ON public.simple_users
  FOR SELECT USING (auth.uid()::text = user_id OR auth.uid()::text = id::text);

-- 4. OAuth sessions - strict user access only
CREATE POLICY "OAuth sessions strict user access" ON public.oauth_sessions
  FOR ALL USING (auth.uid()::text = user_id);

-- 5. Vendor key audit log - admin only
CREATE POLICY "Vendor audit log admin only" ON public.vendor_key_audit_log
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Fix function search paths
ALTER FUNCTION public.cleanup_expired_oauth_sessions() SET search_path = public, pg_catalog;
ALTER FUNCTION public.execute_safe_query() SET search_path = public, pg_catalog;
ALTER FUNCTION public.set_profile_owner() SET search_path = public, pg_catalog;
ALTER FUNCTION public.set_updated_at() SET search_path = public, pg_catalog;
ALTER FUNCTION public.update_simple_users_updated_at() SET search_path = public, pg_catalog;
ALTER FUNCTION public.validate_vendor_api_key() SET search_path = public, pg_catalog;
ALTER FUNCTION credit.update_updated_at_column() SET search_path = credit, public, pg_catalog;
ALTER FUNCTION client_services.update_updated_at() SET search_path = client_services, public, pg_catalog;

COMMIT;

-- Verify RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'topics', 'simple_users', 'oauth_sessions', 'vendor_key_audit_log')
ORDER BY tablename;

-- List all RLS policies created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('users', 'topics', 'simple_users', 'oauth_sessions', 'vendor_key_audit_log')
ORDER BY tablename, policyname;


-- =====================================================
-- Migration: Remediate SECURITY DEFINER RPCs
-- =====================================================
-- Addresses: Nine Vortex Security Advisor WARN findings
-- Related: t_d887445e, issue #89, issue #97

-- This migration addresses the four public SECURITY DEFINER
-- RPCs that are executable by both anon and authenticated roles.

-- RPCs found in production (discovered 2026-08-18):
--   1. vortex_delete_ai_credential(_provider text)
--   2. vortex_get_ai_credential_status(_provider text)
--   3. vortex_get_setting(p_key text)
--   4. vortex_set_setting(p_key text, p_value jsonb)

-- These functions exist in production but have NO migration
-- provenance. They are NOT in any repository migration file.
-- They must be discovered via live catalog before full remediation.

-- Remediation strategy:
--   - Revoke EXECUTE from PUBLIC (anon + all roles inherit)
--   - Add constrained search_path to each function
--   - Grant EXECUTE only to authenticated and service_role
--   - Add validation notices

-- NOTE: This assumes the function signatures match what
-- PostgREST reported. Full function introspection via live
-- catalog SQL is recommended before production deployment.

-- =====================================================

-- =================================================================
-- 1. REVOKE EXECUTE FROM PUBLIC (anon can no longer call RPCs)
-- =================================================================
REVOKE EXECUTE ON FUNCTION public.vortex_delete_ai_credential(_provider) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.vortex_get_ai_credential_status(_provider) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.vortex_get_setting(p_key) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.vortex_set_setting(p_key, p_value) FROM PUBLIC;

-- =================================================================
-- 2. ADD CONSTRAINED SEARCH_PATH TO EACH FUNCTION
-- =================================================================
-- Use CREATE OR REPLACE to modify existing functions in-place.
-- The function bodies are PRESERVED; only search_path is added.

-- WARNING: We do NOT know the original function bodies.
-- These CREATE OR REPLACE statements assume the function bodies
-- are simple pass-throughs to app_vortexcore tables.
-- If the bodies are complex, this migration will FAIL to compile
-- and must be skipped until live catalog introspection is complete.

-- Attempt safe search_path addition (fails gracefully if body differs):

-- vortex_delete_ai_credential(_provider)
DO $$
BEGIN
  -- Check if this is a SECURITY DEFINER function
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'vortex_delete_ai_credential' AND prosecurity = 'd'::boolean) THEN
    RAISE NOTICE 'vortex_delete_ai_credential: found as SECURITY DEFINER, attempting search_path add';
    -- Note: We cannot safely reconstruct the full function body without
    -- live catalog introspection. Skip for now and log.
    RAISE WARNING 'vortex_delete_ai_credential: search_path fix requires live catalog introspection — skipping CREATE OR REPLACE until body is known';
  ELSE
    RAISE NOTICE 'vortex_delete_ai_credential: not found as SECURITY DEFINER, no action needed';
  END IF;
EXCEPTION WHEN undefined_function THEN
  RAISE WARNING 'vortex_delete_ai_credential: function not found in this database';
END $$;

-- vortex_get_ai_credential_status(_provider)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'vortex_get_ai_credential_status' AND prosecurity = 'd'::boolean) THEN
    RAISE NOTICE 'vortex_get_ai_credential_status: found as SECURITY DEFINER, attempting search_path add';
    RAISE WARNING 'vortex_get_ai_credential_status: search_path fix requires live catalog introspection — skipping CREATE OR REPLACE until body is known';
  ELSE
    RAISE NOTICE 'vortex_get_ai_credential_status: not found as SECURITY DEFINER, no action needed';
  END IF;
EXCEPTION WHEN undefined_function THEN
  RAISE WARNING 'vortex_get_ai_credential_status: function not found in this database';
END $$;

-- vortex_get_setting(p_key)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'vortex_get_setting' AND prosecurity = 'd'::boolean) THEN
    RAISE NOTICE 'vortex_get_setting: found as SECURITY DEFINER, attempting search_path add';
    RAISE WARNING 'vortex_get_setting: search_path fix requires live catalog introspection — skipping CREATE OR REPLACE until body is known';
  ELSE
    RAISE NOTICE 'vortex_get_setting: not found as SECURITY DEFINER, no action needed';
  END IF;
EXCEPTION WHEN undefined_function THEN
  RAISE WARNING 'vortex_get_setting: function not found in this database';
END $$;

-- vortex_set_setting(p_key, p_value)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'vortex_set_setting' AND prosecurity = 'd'::boolean) THEN
    RAISE NOTICE 'vortex_set_setting: found as SECURITY DEFINER, attempting search_path add';
    RAISE WARNING 'vortex_set_setting: search_path fix requires live catalog introspection — skipping CREATE OR REPLACE until body is known';
  ELSE
    RAISE NOTICE 'vortex_set_setting: not found as SECURITY DEFINER, no action needed';
  END IF;
EXCEPTION WHEN undefined_function THEN
  RAISE WARNING 'vortex_set_setting: function not found in this database';
END $$;

-- =================================================================
-- 3. GRANT EXECUTE TO AUTHENTICATED AND SERVICE_ROLE
-- =================================================================
GRANT EXECUTE ON FUNCTION public.vortex_delete_ai_credential(_provider) TO authenticated;
GRANT EXECUTE ON FUNCTION public.vortex_delete_ai_credential(_provider) TO service_role;

GRANT EXECUTE ON FUNCTION public.vortex_get_ai_credential_status(_provider) TO authenticated;
GRANT EXECUTE ON FUNCTION public.vortex_get_ai_credential_status(_provider) TO service_role;

GRANT EXECUTE ON FUNCTION public.vortex_get_setting(p_key) TO authenticated;
GRANT EXECUTE ON FUNCTION public.vortex_get_setting(p_key) TO service_role;

GRANT EXECUTE ON FUNCTION public.vortex_set_setting(p_key, p_value) TO authenticated;
GRANT EXECUTE ON FUNCTION public.vortex_set_setting(p_key, p_value) TO service_role;

-- =================================================================
-- 4. VALIDATION
-- =================================================================
-- Check which functions are still publicly executable

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT p.proname, r.rolname, p.prosecdef AS security_definer
    FROM pg_proc p
    JOIN pg_roles r ON p.proowner = r.oid
    WHERE p.pronamespace = 'public'::regnamespace
      AND p.prosecurity = 'd'::boolean
      AND p.proname LIKE 'vortex_%'
  LOOP
    RAISE NOTICE 'SECURITY DEFINER: %.% (owner: %)', r.pronamespace::text, r.proname, r.rolname;
  END LOOP;

  -- Check if any vortex functions are still executable by anon
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    WHERE p.pronamespace = 'public'::regnamespace
      AND p.proname LIKE 'vortex_%'
      AND has_function_privilege('anon', p.oid, 'EXECUTE')
  ) THEN
    RAISE WARNING 'Some vortex_* functions are still executable by anon — review grants above';
  ELSE
    RAISE NOTICE 'No vortex_* functions executable by anon — search_path fixes require live catalog introspection';
  END IF;
END $$;
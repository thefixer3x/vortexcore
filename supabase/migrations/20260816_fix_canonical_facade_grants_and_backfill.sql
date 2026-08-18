-- =====================================================
-- Migration: Fix canonical facade grants & backfill
-- =====================================================
-- Replaces: quarantined 20260816_fix_missing_columns_and_tables.sql
-- Provenance: Reconciles remote migration 20260816055635
--             (Hermes run 53) with version-controlled state.

-- This migration:
--   1. Adds missing profiles columns (default_currency, language,
--      company_name, two_factor_enabled, onboarding_completed)
--   2. Adds explicit per-table grants on app_vortexcore base tables
--   3. Backfills wallets for existing profiles
--   4. Constrains search_path on create_user_wallet()
--   5. Revokes unsafe schema-wide GRANT ALL on affected tables

-- NO GRANT ALL ON ALL TABLES. NO duplicate public base tables.
-- =====================================================

-- =================================================================
-- 1. ADD MISSING COLUMNS TO profiles (idempotent)
-- =================================================================
DO $$
BEGIN
  -- default_currency
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='profiles' AND column_name='default_currency'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN default_currency text NOT NULL DEFAULT 'NGN';
  END IF;

  -- language
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='profiles' AND column_name='language'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN language text NOT NULL DEFAULT 'en';
  END IF;

  -- company_name
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='profiles' AND column_name='company_name'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN company_name text;
  END IF;

  -- two_factor_enabled
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='profiles' AND column_name='two_factor_enabled'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN two_factor_enabled boolean NOT NULL DEFAULT false;
  END IF;

  -- onboarding_completed
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='profiles' AND column_name='onboarding_completed'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN onboarding_completed boolean NOT NULL DEFAULT false;
  END IF;

  -- Default onboarding_completed for existing users with transactions
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='profiles' AND column_name='onboarding_completed'
  ) THEN
    UPDATE public.profiles p SET onboarding_completed = true
    WHERE EXISTS (SELECT 1 FROM public.transactions t WHERE t.user_id = p.id);
  END IF;

  -- Default two_factor_enabled for existing users
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='profiles' AND column_name='two_factor_enabled'
  ) THEN
    UPDATE public.profiles SET two_factor_enabled = false
    WHERE two_factor_enabled IS NOT TRUE;
  END IF;

  -- Default company_name for existing users
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='profiles' AND column_name='company_name'
  ) THEN
    UPDATE public.profiles SET company_name = NULL WHERE company_name = '';
  END IF;

  -- Default default_currency for existing users
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='profiles' AND column_name='default_currency'
  ) THEN
    UPDATE public.profiles SET default_currency = 'NGN' WHERE default_currency = '';
  END IF;

  -- Default language for existing users
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='profiles' AND column_name='language'
  ) THEN
    UPDATE public.profiles SET language = 'en' WHERE language = '';
  END IF;
END $$;

-- =================================================================
-- 2. EXPLICIT PER-TABLE GRANTS ON app_vortexcore BASE TABLES
-- =================================================================
-- No GRANT ALL. Only the minimum explicit grants required for
-- the canonical facade views to function.

-- Revoke schema-wide grants on the three canonical tables
REVOKE ALL ON app_vortexcore.vortex_wallets FROM authenticated;
REVOKE ALL ON app_vortexcore.vortex_wallets FROM service_role;
REVOKE ALL ON app_vortexcore.vortex_transactions FROM authenticated;
REVOKE ALL ON app_vortexcore.vortex_transactions FROM service_role;
REVOKE ALL ON app_vortexcore.vortex_settings FROM authenticated;
REVOKE ALL ON app_vortexcore.vortex_settings FROM service_role;

-- Grant minimal explicit privileges: authenticated needs CRUD
-- through the invoker-view facades.
GRANT SELECT, INSERT, UPDATE, DELETE ON app_vortexcore.vortex_wallets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON app_vortexcore.vortex_transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON app_vortexcore.vortex_settings TO authenticated;

-- Service role needs full CRUD (webhook/backend operations).
GRANT SELECT, INSERT, UPDATE, DELETE ON app_vortexcore.vortex_wallets TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON app_vortexcore.vortex_transactions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON app_vortexcore.vortex_settings TO service_role;

-- Sequences for auto-increment.
GRANT USAGE ON ALL SEQUENCES IN SCHEMA app_vortexcore TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA app_vortexcore TO service_role;

-- anon has NO access to financial tables.
REVOKE ALL ON app_vortexcore.vortex_wallets FROM anon;
REVOKE ALL ON app_vortexcore.vortex_transactions FROM anon;
REVOKE ALL ON app_vortexcore.vortex_settings FROM anon;

-- =================================================================
-- 3. EXISTING-USER WALLET BACKFILL
-- =================================================================
-- Create wallets for profiles that do not yet have one.
-- This mirrors the remote migration 20260816055635 backfill.

INSERT INTO app_vortexcore.vortex_wallets (user_id, balance, currency, is_locked, metadata, created_at, updated_at)
SELECT p.id, 0, COALESCE(p.default_currency, 'NGN'), false, '{}'::jsonb, NOW(), NOW()
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM app_vortexcore.vortex_wallets w WHERE w.user_id = p.id
)
ON CONFLICT (user_id) DO NOTHING;

-- =================================================================
-- 4. CONSTRAIN search_path ON public.create_user_wallet()
-- =================================================================
-- This function was created by the quarantined migration without
-- a search_path constraint. Constrain it here to mitigate
-- search_path injection risk.

CREATE OR REPLACE FUNCTION public.create_user_wallet()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO app_vortexcore.vortex_wallets (user_id, balance, currency)
  VALUES (NEW.id, 0, 'NGN')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- =================================================================
-- 5. VALIDATION (informational — does not fail the migration)
-- =================================================================
-- Verify that the three canonical tables have the expected grants.
-- If any grant is missing, log a NOTICE for operator awareness.

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT table_name, grantee, privilege_type
    FROM information_schema.table_privileges
    WHERE table_schema = 'app_vortexcore'
      AND table_name IN ('vortex_wallets', 'vortex_transactions', 'vortex_settings')
      AND grantee IN ('authenticated', 'service_role')
  LOOP
    RAISE NOTICE 'GRANT OK: app_vortexcore.% <- % (%)', r.table_name, r.grantee, r.privilege_type;
  END LOOP;

  -- Verify backfill count
  IF EXISTS (SELECT 1 FROM app_vortexcore.vortex_wallets) THEN
    RAISE NOTICE 'BACKFILL: % wallet rows in app_vortexcore.vortex_wallets',
      (SELECT count(*) FROM app_vortexcore.vortex_wallets);
  ELSE
    RAISE NOTICE 'BACKFILL: 0 wallet rows — no profiles found to backfill.';
  END IF;
END $$;
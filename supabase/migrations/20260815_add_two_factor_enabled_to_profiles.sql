-- Migration: Add two_factor_enabled column to profiles table
-- Stores the 2FA status per user profile

BEGIN;

-- Add two_factor_enabled column if it doesn't exist
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS two_factor_enabled boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.two_factor_enabled IS 'Whether the user has enabled two-factor authentication';

COMMIT;
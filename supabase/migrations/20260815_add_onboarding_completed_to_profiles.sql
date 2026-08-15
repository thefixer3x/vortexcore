-- Migration: Add onboarding_completed column to profiles table
-- Adds a flag to track whether a user has completed their first-time setup

BEGIN;

-- Add onboarding_completed column if it doesn't exist
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;

-- Set existing users who have transactions as "onboarding complete"
UPDATE public.profiles
SET onboarding_completed = true
WHERE id IN (
  SELECT DISTINCT user_id FROM public.transactions WHERE user_id IS NOT NULL
);

COMMENT ON COLUMN public.profiles.onboarding_completed IS 'Whether the user has completed their first-time setup flow';

COMMIT;
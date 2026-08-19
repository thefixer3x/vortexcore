-- Persist the profile fields exposed by the authenticated settings form.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS occupation text,
  ADD COLUMN IF NOT EXISTS income_range text,
  ADD COLUMN IF NOT EXISTS financial_goals text,
  ADD COLUMN IF NOT EXISTS avatar_url text;

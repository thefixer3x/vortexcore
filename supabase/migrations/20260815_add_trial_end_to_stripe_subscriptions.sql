-- Add trial_end column to stripe_subscriptions for free trial tracking
-- Phase 2: Subscription lifecycle fixes

ALTER TABLE public.stripe_subscriptions
  ADD COLUMN IF NOT EXISTS trial_end timestamptz;

-- Update existing subscriptions that have trial_end set in Stripe
DO $$
DECLARE
  rec RECORD;
BEGIN
  -- This is a no-op placeholder; actual trial_end values are synced via Stripe webhooks
  -- when customer.subscription.created or customer.subscription.updated events fire.
  NULL;
END $$;
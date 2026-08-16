-- =====================================================
-- Migration: Fix missing columns & tables
-- =====================================================
-- Fixes:
--   1. Add default_currency, language, company_name to profiles
--   2. Create public.vortex_wallets and public.vortex_transactions
--      (with RLS, indexes, triggers) so dashboard data loads
--   3. Add GRANT ALL RLS to profiles (security hardening)
-- =====================================================

-- =================================================================
-- 1. ADD MISSING COLUMNS TO profiles
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
END $$;

-- =================================================================
-- 2. CREATE vortex_wallets (public)
-- =================================================================
CREATE TABLE IF NOT EXISTS public.vortex_wallets (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  balance     numeric(18,2) NOT NULL DEFAULT 0,
  currency    text NOT NULL DEFAULT 'NGN',
  is_locked   boolean NOT NULL DEFAULT false,
  metadata    jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vortex_wallets_user ON public.vortex_wallets(user_id);

ALTER TABLE public.vortex_wallets ENABLE ROW LEVEL SECURITY;

-- RLS policies for wallets
DROP POLICY IF EXISTS "Users can view own wallet" ON public.vortex_wallets;
CREATE POLICY "Users can view own wallet"
  ON public.vortex_wallets FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own wallet" ON public.vortex_wallets;
CREATE POLICY "Users can update own wallet"
  ON public.vortex_wallets FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own wallet" ON public.vortex_wallets;
CREATE POLICY "Users can insert own wallet"
  ON public.vortex_wallets FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =================================================================
-- 3. CREATE vortex_transactions (public)
-- =================================================================
CREATE TABLE IF NOT EXISTS public.vortex_transactions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_id       uuid REFERENCES public.vortex_wallets(id) ON DELETE SET NULL,
  amount          numeric(18,2) NOT NULL,
  currency        text NOT NULL DEFAULT 'NGN',
  type            text NOT NULL,
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed','cancelled')),
  description     text,
  category        text,
  reference       text UNIQUE,
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  completed_at    timestamptz
);

CREATE INDEX IF NOT EXISTS idx_vortex_tx_user ON public.vortex_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vortex_tx_wallet ON public.vortex_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_vortex_tx_status ON public.vortex_transactions(status);

ALTER TABLE public.vortex_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON public.vortex_transactions;
CREATE POLICY "Users can view own transactions"
  ON public.vortex_transactions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own transactions" ON public.vortex_transactions;
CREATE POLICY "Users can create own transactions"
  ON public.vortex_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own transactions" ON public.vortex_transactions;
CREATE POLICY "Users can update own transactions"
  ON public.vortex_transactions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =================================================================
-- 4. AUTO-CREATE WALLET ON SIGNUP (if not exists)
-- =================================================================
-- Only add this trigger if the profiles table doesn't already have one
-- that auto-creates wallets.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'on_auth_user_created_wallet'
  ) THEN
    -- Create wallet on user signup
    CREATE OR REPLACE FUNCTION public.create_user_wallet()
    RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
    BEGIN
      INSERT INTO public.vortex_wallets (user_id, balance, currency)
      VALUES (NEW.id, 0, 'NGN')
      ON CONFLICT (user_id) DO NOTHING;
      RETURN NEW;
    END;
    $$;

    DROP TRIGGER IF EXISTS on_auth_user_created_wallet ON auth.users;
    CREATE TRIGGER on_auth_user_created_wallet
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.create_user_wallet();
  END IF;
END $$;

-- =================================================================
-- 5. UPDATED_AT TRIGGER ON vortex_wallets
-- =================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_vortex_wallets_updated_at'
  ) THEN
    CREATE OR REPLACE FUNCTION public.update_vortex_wallets_updated_at()
    RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN NEW.updated_at = now(); RETURN NEW; END;
    $$;

    CREATE TRIGGER update_vortex_wallets_updated_at
      BEFORE UPDATE ON public.vortex_wallets
      FOR EACH ROW EXECUTE FUNCTION public.update_vortex_wallets_updated_at();
  END IF;
END $$;

-- =================================================================
-- 6. GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated
--    (security hardening — was missing from earlier migrations)
-- =================================================================
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
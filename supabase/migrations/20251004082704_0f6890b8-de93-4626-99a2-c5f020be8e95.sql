-- Create VortexCore-specific wallet and transaction tables
-- These are separate from eDoc and marketplace tables

-- Create vortex_wallets table for user wallets
CREATE TABLE IF NOT EXISTS public.vortex_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance numeric(15,2) DEFAULT 0.00 NOT NULL,
  currency text DEFAULT 'NGN' NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(user_id, currency)
);

-- Create vortex_transactions table for wallet transactions
CREATE TABLE IF NOT EXISTS public.vortex_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_id uuid REFERENCES public.vortex_wallets(id) ON DELETE SET NULL,
  amount numeric(15,2) NOT NULL,
  currency text DEFAULT 'NGN' NOT NULL,
  type text NOT NULL CHECK (type IN ('transfer', 'payment', 'receive', 'deposit', 'withdrawal')),
  status text DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  reference text,
  description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.vortex_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vortex_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for vortex_wallets
CREATE POLICY "Users can view their own wallet"
  ON public.vortex_wallets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallet"
  ON public.vortex_wallets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wallet"
  ON public.vortex_wallets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS policies for vortex_transactions
CREATE POLICY "Users can view their own transactions"
  ON public.vortex_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
  ON public.vortex_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_vortex_wallets_user_id ON public.vortex_wallets(user_id);
CREATE INDEX idx_vortex_wallets_currency ON public.vortex_wallets(currency);
CREATE INDEX idx_vortex_transactions_user_id ON public.vortex_transactions(user_id);
CREATE INDEX idx_vortex_transactions_wallet_id ON public.vortex_transactions(wallet_id);
CREATE INDEX idx_vortex_transactions_created_at ON public.vortex_transactions(created_at DESC);
CREATE INDEX idx_vortex_transactions_status ON public.vortex_transactions(status);

-- Triggers to update updated_at timestamp
CREATE TRIGGER set_vortex_wallets_updated_at
  BEFORE UPDATE ON public.vortex_wallets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_vortex_transactions_updated_at
  BEFORE UPDATE ON public.vortex_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
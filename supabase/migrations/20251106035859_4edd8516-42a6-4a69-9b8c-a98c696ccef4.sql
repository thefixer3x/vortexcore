-- Clean VortexCore migration: wallets, transactions, and AI chat sessions
-- Remove unrelated tables (child_profiles, old chat tables)

-- Create vortex_wallets table (renamed from wallets for clarity)
CREATE TABLE IF NOT EXISTS public.vortex_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    balance NUMERIC(12,2) DEFAULT 0.00 NOT NULL,
    currency TEXT DEFAULT 'NGN' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT vortex_wallets_user_id_key UNIQUE (user_id)
);

-- Create vortex_transactions table (renamed from transactions for clarity)
CREATE TABLE IF NOT EXISTS public.vortex_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    wallet_id UUID REFERENCES public.vortex_wallets(id) ON DELETE SET NULL,
    amount NUMERIC(12,2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('credit', 'debit', 'transfer', 'payment', 'refund')),
    description TEXT,
    status TEXT DEFAULT 'completed' NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    reference TEXT,
    metadata JSONB DEFAULT '{}',
    currency TEXT DEFAULT 'NGN' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create ai_chat_sessions table for VortexAI chat history
CREATE TABLE IF NOT EXISTS public.ai_chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_name TEXT,
    messages JSONB DEFAULT '[]' NOT NULL,
    ai_model TEXT DEFAULT 'vortex-router' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create virtual_cards table for Stripe virtual cards
CREATE TABLE IF NOT EXISTS public.virtual_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    card_id TEXT NOT NULL UNIQUE, -- Stripe card ID
    cardholder_id TEXT NOT NULL, -- Stripe cardholder ID
    last4 TEXT NOT NULL,
    brand TEXT NOT NULL,
    exp_month INTEGER NOT NULL,
    exp_year INTEGER NOT NULL,
    status TEXT DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'inactive', 'canceled')),
    spending_limit NUMERIC(12,2),
    spending_limit_interval TEXT CHECK (spending_limit_interval IN ('daily', 'weekly', 'monthly', 'yearly', 'all_time')),
    currency TEXT DEFAULT 'usd' NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_vortex_wallets_user_id ON public.vortex_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_vortex_transactions_user_id ON public.vortex_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_vortex_transactions_wallet_id ON public.vortex_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_vortex_transactions_created_at ON public.vortex_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_user_id ON public.ai_chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_updated_at ON public.ai_chat_sessions(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_virtual_cards_user_id ON public.virtual_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_virtual_cards_card_id ON public.virtual_cards(card_id);

-- Enable Row Level Security
ALTER TABLE public.vortex_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vortex_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.virtual_cards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vortex_wallets
CREATE POLICY "Users can view own wallet" 
    ON public.vortex_wallets FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own wallet" 
    ON public.vortex_wallets FOR UPDATE 
    USING (auth.uid() = user_id);

-- RLS Policies for vortex_transactions
CREATE POLICY "Users can view own transactions" 
    ON public.vortex_transactions FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" 
    ON public.vortex_transactions FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- RLS Policies for ai_chat_sessions
CREATE POLICY "Users can view own chat sessions" 
    ON public.ai_chat_sessions FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat sessions" 
    ON public.ai_chat_sessions FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat sessions" 
    ON public.ai_chat_sessions FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat sessions" 
    ON public.ai_chat_sessions FOR DELETE 
    USING (auth.uid() = user_id);

-- RLS Policies for virtual_cards
CREATE POLICY "Users can view own virtual cards" 
    ON public.virtual_cards FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own virtual cards" 
    ON public.virtual_cards FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own virtual cards" 
    ON public.virtual_cards FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own virtual cards" 
    ON public.virtual_cards FOR DELETE 
    USING (auth.uid() = user_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Apply updated_at triggers
CREATE TRIGGER update_vortex_wallets_updated_at
    BEFORE UPDATE ON public.vortex_wallets
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_vortex_transactions_updated_at
    BEFORE UPDATE ON public.vortex_transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_ai_chat_sessions_updated_at
    BEFORE UPDATE ON public.ai_chat_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_virtual_cards_updated_at
    BEFORE UPDATE ON public.virtual_cards
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
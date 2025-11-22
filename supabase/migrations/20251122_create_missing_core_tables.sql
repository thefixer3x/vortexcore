-- Create missing core tables for VortexCore platform
-- Migration: 20251122_create_missing_core_tables
-- Description: Adds wallets, transactions, conversations, ai_chat_sessions, child_profiles, vortex_settings, and stripe_customers tables

-- ============================================================================
-- WALLETS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS "public"."wallets" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "user_id" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "currency" character(3) DEFAULT 'USD'::bpchar NOT NULL,
    "balance" numeric(15,2) DEFAULT 0 NOT NULL CHECK (balance >= 0),
    "is_active" boolean DEFAULT true NOT NULL,
    "is_primary" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_wallets_user_id" ON "public"."wallets"("user_id");
CREATE INDEX IF NOT EXISTS "idx_wallets_currency" ON "public"."wallets"("currency");
CREATE INDEX IF NOT EXISTS "idx_wallets_is_primary" ON "public"."wallets"("user_id", "is_primary") WHERE is_primary = true;

COMMENT ON TABLE "public"."wallets" IS 'User digital wallets for multi-currency support';
COMMENT ON COLUMN "public"."wallets"."is_primary" IS 'Primary wallet for user (one per currency)';

-- ============================================================================
-- TRANSACTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS "public"."transactions" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "user_id" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "wallet_id" uuid REFERENCES "public"."wallets"(id) ON DELETE SET NULL,
    "type" text NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'transfer', 'payment', 'refund')),
    "amount" numeric(15,2) NOT NULL CHECK (amount > 0),
    "currency" character(3) DEFAULT 'USD'::bpchar NOT NULL,
    "status" text DEFAULT 'pending'::text NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'reversed', 'cancelled')),
    "description" text,
    "reference" text UNIQUE,
    "metadata" jsonb DEFAULT '{}'::jsonb,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "completed_at" timestamp with time zone
);

CREATE INDEX IF NOT EXISTS "idx_transactions_user_id" ON "public"."transactions"("user_id");
CREATE INDEX IF NOT EXISTS "idx_transactions_wallet_id" ON "public"."transactions"("wallet_id");
CREATE INDEX IF NOT EXISTS "idx_transactions_status" ON "public"."transactions"("status");
CREATE INDEX IF NOT EXISTS "idx_transactions_type" ON "public"."transactions"("type");
CREATE INDEX IF NOT EXISTS "idx_transactions_created_at" ON "public"."transactions"("created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_transactions_reference" ON "public"."transactions"("reference") WHERE reference IS NOT NULL;

COMMENT ON TABLE "public"."transactions" IS 'All financial transactions across wallets';
COMMENT ON COLUMN "public"."transactions"."metadata" IS 'Additional transaction data (counterparty, category, etc.)';

-- ============================================================================
-- CONVERSATIONS TABLE (AI Chat Conversations)
-- ============================================================================
CREATE TABLE IF NOT EXISTS "public"."conversations" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "user_id" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "title" text NOT NULL,
    "topic" text,
    "context" jsonb DEFAULT '{}'::jsonb,
    "is_archived" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "last_message_at" timestamp with time zone
);

CREATE INDEX IF NOT EXISTS "idx_conversations_user_id" ON "public"."conversations"("user_id");
CREATE INDEX IF NOT EXISTS "idx_conversations_created_at" ON "public"."conversations"("created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_conversations_last_message_at" ON "public"."conversations"("last_message_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_conversations_is_archived" ON "public"."conversations"("user_id", "is_archived");

COMMENT ON TABLE "public"."conversations" IS 'AI chat conversation threads';

-- ============================================================================
-- AI_CHAT_SESSIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS "public"."ai_chat_sessions" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "conversation_id" uuid NOT NULL REFERENCES "public"."conversations"(id) ON DELETE CASCADE,
    "user_id" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "role" text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    "content" text NOT NULL,
    "tokens_used" integer DEFAULT 0,
    "model" text DEFAULT 'gpt-4'::text,
    "metadata" jsonb DEFAULT '{}'::jsonb,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_ai_chat_sessions_conversation_id" ON "public"."ai_chat_sessions"("conversation_id");
CREATE INDEX IF NOT EXISTS "idx_ai_chat_sessions_user_id" ON "public"."ai_chat_sessions"("user_id");
CREATE INDEX IF NOT EXISTS "idx_ai_chat_sessions_created_at" ON "public"."ai_chat_sessions"("created_at" DESC);

COMMENT ON TABLE "public"."ai_chat_sessions" IS 'Individual messages within AI chat conversations';
COMMENT ON COLUMN "public"."ai_chat_sessions"."metadata" IS 'Function calls, attachments, etc.';

-- ============================================================================
-- CHILD_PROFILES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS "public"."child_profiles" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "parent_id" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "name" text NOT NULL,
    "email" text,
    "permissions" jsonb DEFAULT '{"read": true, "write": false, "admin": false}'::jsonb NOT NULL,
    "role" text DEFAULT 'viewer'::text CHECK (role IN ('viewer', 'editor', 'admin')),
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_child_profiles_parent_id" ON "public"."child_profiles"("parent_id");
CREATE INDEX IF NOT EXISTS "idx_child_profiles_is_active" ON "public"."child_profiles"("parent_id", "is_active");

COMMENT ON TABLE "public"."child_profiles" IS 'Sub-users under main account for businesses';
COMMENT ON COLUMN "public"."child_profiles"."permissions" IS 'Granular permission settings';

-- ============================================================================
-- VORTEX_SETTINGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS "public"."vortex_settings" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "user_id" uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    "notifications_enabled" boolean DEFAULT true NOT NULL,
    "email_notifications" boolean DEFAULT true NOT NULL,
    "sms_notifications" boolean DEFAULT false NOT NULL,
    "push_notifications" boolean DEFAULT true NOT NULL,
    "theme" text DEFAULT 'system'::text CHECK (theme IN ('light', 'dark', 'system')),
    "language" character(2) DEFAULT 'en'::bpchar NOT NULL,
    "timezone" text DEFAULT 'UTC'::text NOT NULL,
    "currency_display_format" text DEFAULT 'symbol'::text CHECK (currency_display_format IN ('symbol', 'code', 'name')),
    "date_format" text DEFAULT 'MM/DD/YYYY'::text,
    "two_factor_enabled" boolean DEFAULT false NOT NULL,
    "biometric_enabled" boolean DEFAULT false NOT NULL,
    "session_timeout_minutes" integer DEFAULT 30 CHECK (session_timeout_minutes > 0),
    "preferences" jsonb DEFAULT '{}'::jsonb,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_vortex_settings_user_id" ON "public"."vortex_settings"("user_id");

COMMENT ON TABLE "public"."vortex_settings" IS 'User preferences and settings for VortexCore platform';
COMMENT ON COLUMN "public"."vortex_settings"."preferences" IS 'Additional user preferences as JSON';

-- ============================================================================
-- STRIPE_CUSTOMERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS "public"."stripe_customers" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "user_id" uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    "stripe_customer_id" text NOT NULL UNIQUE,
    "email" text,
    "name" text,
    "payment_methods" jsonb DEFAULT '[]'::jsonb,
    "default_payment_method" text,
    "subscription_status" text CHECK (subscription_status IN ('active', 'inactive', 'cancelled', 'past_due', 'trialing')),
    "subscription_tier" text DEFAULT 'free'::text,
    "subscription_ends_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_stripe_customers_user_id" ON "public"."stripe_customers"("user_id");
CREATE INDEX IF NOT EXISTS "idx_stripe_customers_stripe_customer_id" ON "public"."stripe_customers"("stripe_customer_id");
CREATE INDEX IF NOT EXISTS "idx_stripe_customers_subscription_status" ON "public"."stripe_customers"("subscription_status");

COMMENT ON TABLE "public"."stripe_customers" IS 'Stripe customer data linked to users';
COMMENT ON COLUMN "public"."stripe_customers"."payment_methods" IS 'Array of payment method IDs';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE "public"."wallets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."transactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."conversations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ai_chat_sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."child_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."vortex_settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."stripe_customers" ENABLE ROW LEVEL SECURITY;

-- WALLETS RLS Policies
CREATE POLICY "Users can view their own wallets"
    ON "public"."wallets" FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wallets"
    ON "public"."wallets" FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallets"
    ON "public"."wallets" FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wallets"
    ON "public"."wallets" FOR DELETE
    USING (auth.uid() = user_id);

-- TRANSACTIONS RLS Policies
CREATE POLICY "Users can view their own transactions"
    ON "public"."transactions" FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
    ON "public"."transactions" FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions"
    ON "public"."transactions" FOR UPDATE
    USING (auth.uid() = user_id);

-- CONVERSATIONS RLS Policies
CREATE POLICY "Users can view their own conversations"
    ON "public"."conversations" FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversations"
    ON "public"."conversations" FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
    ON "public"."conversations" FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations"
    ON "public"."conversations" FOR DELETE
    USING (auth.uid() = user_id);

-- AI_CHAT_SESSIONS RLS Policies
CREATE POLICY "Users can view their own chat sessions"
    ON "public"."ai_chat_sessions" FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat sessions"
    ON "public"."ai_chat_sessions" FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat sessions"
    ON "public"."ai_chat_sessions" FOR UPDATE
    USING (auth.uid() = user_id);

-- CHILD_PROFILES RLS Policies
CREATE POLICY "Users can view their own child profiles"
    ON "public"."child_profiles" FOR SELECT
    USING (auth.uid() = parent_id);

CREATE POLICY "Users can insert their own child profiles"
    ON "public"."child_profiles" FOR INSERT
    WITH CHECK (auth.uid() = parent_id);

CREATE POLICY "Users can update their own child profiles"
    ON "public"."child_profiles" FOR UPDATE
    USING (auth.uid() = parent_id);

CREATE POLICY "Users can delete their own child profiles"
    ON "public"."child_profiles" FOR DELETE
    USING (auth.uid() = parent_id);

-- VORTEX_SETTINGS RLS Policies
CREATE POLICY "Users can view their own settings"
    ON "public"."vortex_settings" FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
    ON "public"."vortex_settings" FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
    ON "public"."vortex_settings" FOR UPDATE
    USING (auth.uid() = user_id);

-- STRIPE_CUSTOMERS RLS Policies
CREATE POLICY "Users can view their own stripe customer data"
    ON "public"."stripe_customers" FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stripe customer data"
    ON "public"."stripe_customers" FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stripe customer data"
    ON "public"."stripe_customers" FOR UPDATE
    USING (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON "public"."wallets" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON "public"."transactions" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON "public"."conversations" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_child_profiles_updated_at BEFORE UPDATE ON "public"."child_profiles" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vortex_settings_updated_at BEFORE UPDATE ON "public"."vortex_settings" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stripe_customers_updated_at BEFORE UPDATE ON "public"."stripe_customers" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON "public"."wallets" TO authenticated;
GRANT SELECT, INSERT, UPDATE ON "public"."transactions" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON "public"."conversations" TO authenticated;
GRANT SELECT, INSERT, UPDATE ON "public"."ai_chat_sessions" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON "public"."child_profiles" TO authenticated;
GRANT SELECT, INSERT, UPDATE ON "public"."vortex_settings" TO authenticated;
GRANT SELECT, INSERT, UPDATE ON "public"."stripe_customers" TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

COMMENT ON SCHEMA public IS 'VortexCore platform schema - Updated with core tables';

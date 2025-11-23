-- ============================================================================
-- VORTEXCORE MIGRATIONS - APPLY IN ONE GO
-- ============================================================================
-- Migration 1: Add currency and language to profiles
-- Migration 2: Create wallets and transactions tables
--
-- HOW TO APPLY:
-- 1. Go to: https://supabase.com/dashboard/project/mxtsdgkwzjzlttpotole/sql
-- 2. Copy ALL the SQL below
-- 3. Paste into the SQL Editor
-- 4. Click "Run" (or press Cmd/Ctrl + Enter)
-- 5. Wait for "Success" message
-- ============================================================================

BEGIN;

-- ============================================================================
-- MIGRATION 1: Add currency and language preferences to profiles
-- ============================================================================

ALTER TABLE "public"."profiles"
ADD COLUMN IF NOT EXISTS "default_currency" character(3) DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS "language" character(2) DEFAULT 'en';

COMMENT ON COLUMN "public"."profiles"."default_currency" IS 'User preferred currency code (ISO 4217)';
COMMENT ON COLUMN "public"."profiles"."language" IS 'User preferred language code (ISO 639-1)';

CREATE INDEX IF NOT EXISTS "idx_profiles_default_currency" ON "public"."profiles"("default_currency");

-- ============================================================================
-- MIGRATION 2: Create wallets and transactions tables
-- ============================================================================

-- WALLETS TABLE
CREATE TABLE IF NOT EXISTS "public"."wallets" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "user_id" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "balance" numeric(15,2) DEFAULT 0 NOT NULL CHECK (balance >= 0),
    "currency" text DEFAULT 'USD' NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_wallets_user_id" ON "public"."wallets"("user_id");
CREATE INDEX IF NOT EXISTS "idx_wallets_currency" ON "public"."wallets"("currency");
CREATE INDEX IF NOT EXISTS "idx_wallets_is_active" ON "public"."wallets"("is_active");

COMMENT ON TABLE "public"."wallets" IS 'User digital wallets for multi-currency support';
COMMENT ON COLUMN "public"."wallets"."is_active" IS 'Whether the wallet is currently active';

-- TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS "public"."transactions" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "user_id" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "wallet_id" uuid REFERENCES "public"."wallets"(id) ON DELETE SET NULL,
    "amount" numeric(15,2) NOT NULL,
    "currency" text DEFAULT 'USD' NOT NULL,
    "type" text NOT NULL,
    "status" text DEFAULT 'pending' NOT NULL,
    "description" text,
    "reference" text,
    "metadata" jsonb,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_transactions_user_id" ON "public"."transactions"("user_id");
CREATE INDEX IF NOT EXISTS "idx_transactions_wallet_id" ON "public"."transactions"("wallet_id");
CREATE INDEX IF NOT EXISTS "idx_transactions_status" ON "public"."transactions"("status");
CREATE INDEX IF NOT EXISTS "idx_transactions_type" ON "public"."transactions"("type");
CREATE INDEX IF NOT EXISTS "idx_transactions_created_at" ON "public"."transactions"("created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_transactions_reference" ON "public"."transactions"("reference") WHERE reference IS NOT NULL;

COMMENT ON TABLE "public"."transactions" IS 'All financial transactions across wallets';
COMMENT ON COLUMN "public"."transactions"."wallet_id" IS 'Associated wallet (nullable for transactions not tied to specific wallet)';
COMMENT ON COLUMN "public"."transactions"."reference" IS 'External reference ID (e.g., payment gateway reference)';
COMMENT ON COLUMN "public"."transactions"."metadata" IS 'Additional transaction data as JSON';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE "public"."wallets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."transactions" ENABLE ROW LEVEL SECURITY;

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

CREATE TRIGGER update_wallets_updated_at
    BEFORE UPDATE ON "public"."wallets"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON "public"."transactions"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON "public"."wallets" TO authenticated;
GRANT SELECT, INSERT, UPDATE ON "public"."transactions" TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES (Run these after to verify)
-- ============================================================================
/*
-- Check that new columns were added to profiles
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN ('default_currency', 'language');

-- Check that new tables were created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('wallets', 'transactions')
ORDER BY table_name;

-- Verify RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('wallets', 'transactions');
*/

-- Safe VortexCore Table Addition - NO DATABASE RESET
-- This script ADDS new tables without affecting existing data

-- Step 1: Create nixie schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS "nixie";

-- Step 2: Create handle_new_user function (safe replacement)
CREATE OR REPLACE FUNCTION "public"."handle_new_user"() 
RETURNS "trigger" LANGUAGE "plpgsql" SECURITY DEFINER AS $$
BEGIN
  -- Handle profiles - INSERT with conflict resolution
  INSERT INTO public.profiles (id, full_name, email, created_at, updated_at)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email, NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    email = COALESCE(EXCLUDED.email, profiles.email),
    updated_at = NOW();
  
  -- Create wallet only if it doesn't exist
  INSERT INTO public.wallets (user_id, balance, currency, created_at, updated_at)
  VALUES (NEW.id, 0.00, 'USD', NOW(), NOW())
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Step 3: Create wallets table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS "public"."wallets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "balance" numeric(10,2) DEFAULT 0.00,
    "currency" "text" DEFAULT 'USD'::text,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

-- Add constraints safely
DO $$ 
BEGIN
    -- Primary key for wallets
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wallets_pkey') THEN
        ALTER TABLE ONLY "public"."wallets" ADD CONSTRAINT "wallets_pkey" PRIMARY KEY ("id");
    END IF;
    
    -- Unique constraint on user_id
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wallets_user_id_key') THEN
        ALTER TABLE ONLY "public"."wallets" ADD CONSTRAINT "wallets_user_id_key" UNIQUE ("user_id");
    END IF;
    
    -- Foreign key to profiles
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wallets_user_id_fkey') THEN
        ALTER TABLE ONLY "public"."wallets" ADD CONSTRAINT "wallets_user_id_fkey" 
        FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
    END IF;
END $$;

-- Step 4: Create conversations table
CREATE TABLE IF NOT EXISTS "public"."conversations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text",
    "messages" "jsonb" DEFAULT '[]'::jsonb,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

-- Add conversations constraints
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'conversations_pkey') THEN
        ALTER TABLE ONLY "public"."conversations" ADD CONSTRAINT "conversations_pkey" PRIMARY KEY ("id");
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'conversations_user_id_fkey') THEN
        ALTER TABLE ONLY "public"."conversations" ADD CONSTRAINT "conversations_user_id_fkey" 
        FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
    END IF;
END $$;

-- Step 5: Create child_profiles table
CREATE TABLE IF NOT EXISTS "public"."child_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "parent_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "age" integer,
    "avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

-- Add child_profiles constraints
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'child_profiles_pkey') THEN
        ALTER TABLE ONLY "public"."child_profiles" ADD CONSTRAINT "child_profiles_pkey" PRIMARY KEY ("id");
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'child_profiles_parent_id_fkey') THEN
        ALTER TABLE ONLY "public"."child_profiles" ADD CONSTRAINT "child_profiles_parent_id_fkey" 
        FOREIGN KEY ("parent_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
    END IF;
END $$;

-- Step 6: Create transactions table
CREATE TABLE IF NOT EXISTS "public"."transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "type" "text" NOT NULL,
    "description" "text",
    "status" "text" DEFAULT 'pending'::text,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

-- Add transactions constraints
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transactions_pkey') THEN
        ALTER TABLE ONLY "public"."transactions" ADD CONSTRAINT "transactions_pkey" PRIMARY KEY ("id");
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transactions_user_id_fkey') THEN
        ALTER TABLE ONLY "public"."transactions" ADD CONSTRAINT "transactions_user_id_fkey" 
        FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
    END IF;
END $$;

-- Step 7: Create vortex_settings table (renamed to avoid conflicts)
CREATE TABLE IF NOT EXISTS "public"."vortex_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "key" "text" NOT NULL,
    "value" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

-- Add vortex_settings constraints
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vortex_settings_pkey') THEN
        ALTER TABLE ONLY "public"."vortex_settings" ADD CONSTRAINT "vortex_settings_pkey" PRIMARY KEY ("id");
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vortex_settings_user_id_key_key') THEN
        ALTER TABLE ONLY "public"."vortex_settings" ADD CONSTRAINT "vortex_settings_user_id_key_key" UNIQUE ("user_id", "key");
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vortex_settings_user_id_fkey') THEN
        ALTER TABLE ONLY "public"."vortex_settings" ADD CONSTRAINT "vortex_settings_user_id_fkey" 
        FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
    END IF;
END $$;

-- Enable RLS on new tables
ALTER TABLE "public"."wallets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."conversations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."child_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."transactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."vortex_settings" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (only if they don't exist)
DO $$
BEGIN
    -- Wallets policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own wallet' AND tablename = 'wallets') THEN
        CREATE POLICY "Users can view own wallet" ON "public"."wallets" 
        FOR SELECT USING ("auth"."uid"() = "user_id");
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own wallet' AND tablename = 'wallets') THEN
        CREATE POLICY "Users can update own wallet" ON "public"."wallets" 
        FOR UPDATE USING ("auth"."uid"() = "user_id");
    END IF;
    
    -- Conversations policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own conversations' AND tablename = 'conversations') THEN
        CREATE POLICY "Users can manage own conversations" ON "public"."conversations" 
        FOR ALL USING ("auth"."uid"() = "user_id");
    END IF;
    
    -- Child profiles policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Parents can manage child profiles' AND tablename = 'child_profiles') THEN
        CREATE POLICY "Parents can manage child profiles" ON "public"."child_profiles" 
        FOR ALL USING ("auth"."uid"() = "parent_id");
    END IF;
    
    -- Transactions policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own transactions' AND tablename = 'transactions') THEN
        CREATE POLICY "Users can view own transactions" ON "public"."transactions" 
        FOR SELECT USING ("auth"."uid"() = "user_id");
    END IF;
    
    -- Settings policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own settings' AND tablename = 'vortex_settings') THEN
        CREATE POLICY "Users can manage own settings" ON "public"."vortex_settings" 
        FOR ALL USING ("auth"."uid"() = "user_id");
    END IF;
END $$;

-- Grant permissions
GRANT ALL ON TABLE "public"."wallets" TO "anon";
GRANT ALL ON TABLE "public"."wallets" TO "authenticated";
GRANT ALL ON TABLE "public"."wallets" TO "service_role";

GRANT ALL ON TABLE "public"."conversations" TO "anon";
GRANT ALL ON TABLE "public"."conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."conversations" TO "service_role";

GRANT ALL ON TABLE "public"."child_profiles" TO "anon";
GRANT ALL ON TABLE "public"."child_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."child_profiles" TO "service_role";

GRANT ALL ON TABLE "public"."transactions" TO "anon";
GRANT ALL ON TABLE "public"."transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."transactions" TO "service_role";

GRANT ALL ON TABLE "public"."vortex_settings" TO "anon";
GRANT ALL ON TABLE "public"."vortex_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."vortex_settings" TO "service_role";

-- Create trigger for new user handling
DROP TRIGGER IF EXISTS "on_auth_user_created" ON "auth"."users";
CREATE TRIGGER "on_auth_user_created"
  AFTER INSERT ON "auth"."users"
  FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_user"();

-- Success message
SELECT 'VortexCore tables safely added to existing database - NO DATA LOST!' as status;

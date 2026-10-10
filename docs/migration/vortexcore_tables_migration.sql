-- VortexCore Tables Migration
-- Safe addition of VortexCore tables to existing database
-- Created: 2025-06-09

-- 1. Create handle_new_user function if it doesn't exist
CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Insert into profiles with conflict handling
  INSERT INTO public.profiles (id, full_name, email, created_at, updated_at)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email, NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    email = COALESCE(EXCLUDED.email, profiles.email),
    updated_at = NOW();
  
  -- Insert wallet only if it doesn't exist
  INSERT INTO public.wallets (user_id, balance, currency, created_at, updated_at)
  VALUES (NEW.id, 0.00, 'USD', NOW(), NOW())
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Grant permissions on handle_new_user
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";

-- 2. Create wallets table if it doesn't exist
CREATE TABLE IF NOT EXISTS "public"."wallets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "balance" numeric(10,2) DEFAULT 0.00,
    "currency" "text" DEFAULT 'USD'::text,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "public"."wallets" OWNER TO "postgres";

-- Add constraints for wallets (only if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wallets_pkey') THEN
        ALTER TABLE ONLY "public"."wallets" ADD CONSTRAINT "wallets_pkey" PRIMARY KEY ("id");
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wallets_user_id_key') THEN
        ALTER TABLE ONLY "public"."wallets" ADD CONSTRAINT "wallets_user_id_key" UNIQUE ("user_id");
    END IF;
END $$;

-- 3. Create conversations table if it doesn't exist
CREATE TABLE IF NOT EXISTS "public"."conversations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text",
    "messages" "jsonb" DEFAULT '[]'::jsonb,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "public"."conversations" OWNER TO "postgres";

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'conversations_pkey') THEN
        ALTER TABLE ONLY "public"."conversations" ADD CONSTRAINT "conversations_pkey" PRIMARY KEY ("id");
    END IF;
END $$;

-- 4. Create child_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS "public"."child_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "parent_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "age" integer,
    "avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "public"."child_profiles" OWNER TO "postgres";

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'child_profiles_pkey') THEN
        ALTER TABLE ONLY "public"."child_profiles" ADD CONSTRAINT "child_profiles_pkey" PRIMARY KEY ("id");
    END IF;
END $$;

-- 5. Create transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS "public"."transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "type" "text" NOT NULL CHECK (type IN ('credit', 'debit')),
    "description" "text",
    "reference_id" "text",
    "status" "text" DEFAULT 'pending'::text CHECK (status IN ('pending', 'completed', 'failed')),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "public"."transactions" OWNER TO "postgres";

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transactions_pkey') THEN
        ALTER TABLE ONLY "public"."transactions" ADD CONSTRAINT "transactions_pkey" PRIMARY KEY ("id");
    END IF;
END $$;

-- 6. Create ai_chat_sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS "public"."ai_chat_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "session_name" "text",
    "messages" "jsonb" DEFAULT '[]'::jsonb,
    "ai_model" "text" DEFAULT 'gpt-3.5-turbo'::text,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "public"."ai_chat_sessions" OWNER TO "postgres";

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ai_chat_sessions_pkey') THEN
        ALTER TABLE ONLY "public"."ai_chat_sessions" ADD CONSTRAINT "ai_chat_sessions_pkey" PRIMARY KEY ("id");
    END IF;
END $$;

-- 7. Create vortex_settings table (renamed to avoid conflicts)
CREATE TABLE IF NOT EXISTS "public"."vortex_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "setting_key" "text" NOT NULL,
    "setting_value" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "public"."vortex_settings" OWNER TO "postgres";

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vortex_settings_pkey') THEN
        ALTER TABLE ONLY "public"."vortex_settings" ADD CONSTRAINT "vortex_settings_pkey" PRIMARY KEY ("id");
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vortex_settings_user_key_unique') THEN
        ALTER TABLE ONLY "public"."vortex_settings" ADD CONSTRAINT "vortex_settings_user_key_unique" UNIQUE ("user_id", "setting_key");
    END IF;
END $$;

-- 8. Create Stripe-related tables
CREATE TABLE IF NOT EXISTS "public"."stripe_customers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "stripe_customer_id" "text" NOT NULL,
    "email" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "public"."stripe_customers" OWNER TO "postgres";

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'stripe_customers_pkey') THEN
        ALTER TABLE ONLY "public"."stripe_customers" ADD CONSTRAINT "stripe_customers_pkey" PRIMARY KEY ("id");
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'stripe_customers_user_id_key') THEN
        ALTER TABLE ONLY "public"."stripe_customers" ADD CONSTRAINT "stripe_customers_user_id_key" UNIQUE ("user_id");
    END IF;
END $$;

-- 9. Create foreign key relationships (only if they don't exist)
DO $$
BEGIN
    -- wallets -> profiles
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wallets_user_id_fkey') THEN
        ALTER TABLE "public"."wallets" ADD CONSTRAINT "wallets_user_id_fkey" 
        FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
    END IF;
    
    -- conversations -> profiles  
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'conversations_user_id_fkey') THEN
        ALTER TABLE "public"."conversations" ADD CONSTRAINT "conversations_user_id_fkey" 
        FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
    END IF;
    
    -- child_profiles -> profiles
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'child_profiles_parent_id_fkey') THEN
        ALTER TABLE "public"."child_profiles" ADD CONSTRAINT "child_profiles_parent_id_fkey" 
        FOREIGN KEY ("parent_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
    END IF;
    
    -- transactions -> profiles
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transactions_user_id_fkey') THEN
        ALTER TABLE "public"."transactions" ADD CONSTRAINT "transactions_user_id_fkey" 
        FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
    END IF;
    
    -- ai_chat_sessions -> profiles
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ai_chat_sessions_user_id_fkey') THEN
        ALTER TABLE "public"."ai_chat_sessions" ADD CONSTRAINT "ai_chat_sessions_user_id_fkey" 
        FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
    END IF;
    
    -- vortex_settings -> profiles
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vortex_settings_user_id_fkey') THEN
        ALTER TABLE "public"."vortex_settings" ADD CONSTRAINT "vortex_settings_user_id_fkey" 
        FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
    END IF;
    
    -- stripe_customers -> profiles
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'stripe_customers_user_id_fkey') THEN
        ALTER TABLE "public"."stripe_customers" ADD CONSTRAINT "stripe_customers_user_id_fkey" 
        FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
    END IF;
END $$;

-- 10. Create RLS policies for security
ALTER TABLE "public"."wallets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."conversations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."child_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."transactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ai_chat_sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."vortex_settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."stripe_customers" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (only if they don't exist)
DO $$
BEGIN
    -- Wallets policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'wallets' AND policyname = 'Users can view own wallet') THEN
        CREATE POLICY "Users can view own wallet" ON "public"."wallets" FOR SELECT USING ("auth"."uid"() = "user_id");
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'wallets' AND policyname = 'Users can update own wallet') THEN
        CREATE POLICY "Users can update own wallet" ON "public"."wallets" FOR UPDATE USING ("auth"."uid"() = "user_id");
    END IF;
    
    -- Conversations policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'conversations' AND policyname = 'Users can manage own conversations') THEN
        CREATE POLICY "Users can manage own conversations" ON "public"."conversations" FOR ALL USING ("auth"."uid"() = "user_id");
    END IF;
    
    -- Child profiles policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'child_profiles' AND policyname = 'Parents can manage child profiles') THEN
        CREATE POLICY "Parents can manage child profiles" ON "public"."child_profiles" FOR ALL USING ("auth"."uid"() = "parent_id");
    END IF;
    
    -- Transactions policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transactions' AND policyname = 'Users can view own transactions') THEN
        CREATE POLICY "Users can view own transactions" ON "public"."transactions" FOR SELECT USING ("auth"."uid"() = "user_id");
    END IF;
    
    -- AI chat sessions policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_chat_sessions' AND policyname = 'Users can manage own chat sessions') THEN
        CREATE POLICY "Users can manage own chat sessions" ON "public"."ai_chat_sessions" FOR ALL USING ("auth"."uid"() = "user_id");
    END IF;
    
    -- Settings policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vortex_settings' AND policyname = 'Users can manage own settings') THEN
        CREATE POLICY "Users can manage own settings" ON "public"."vortex_settings" FOR ALL USING ("auth"."uid"() = "user_id");
    END IF;
    
    -- Stripe customers policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stripe_customers' AND policyname = 'Users can view own stripe data') THEN
        CREATE POLICY "Users can view own stripe data" ON "public"."stripe_customers" FOR SELECT USING ("auth"."uid"() = "user_id");
    END IF;
END $$;

-- 11. Grant permissions to roles
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

GRANT ALL ON TABLE "public"."ai_chat_sessions" TO "anon";
GRANT ALL ON TABLE "public"."ai_chat_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_chat_sessions" TO "service_role";

GRANT ALL ON TABLE "public"."vortex_settings" TO "anon";
GRANT ALL ON TABLE "public"."vortex_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."vortex_settings" TO "service_role";

GRANT ALL ON TABLE "public"."stripe_customers" TO "anon";
GRANT ALL ON TABLE "public"."stripe_customers" TO "authenticated";
GRANT ALL ON TABLE "public"."stripe_customers" TO "service_role";

-- 12. Create auth trigger for new users (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
        CREATE TRIGGER "on_auth_user_created" 
        AFTER INSERT ON "auth"."users" 
        FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_user"();
    END IF;
END $$;

-- Migration completed successfully
SELECT 'VortexCore tables migration completed successfully!' as status;

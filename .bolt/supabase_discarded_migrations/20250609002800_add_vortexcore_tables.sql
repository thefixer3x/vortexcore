-- Add VortexCore tables to existing database
-- This migration adds VortexCore functionality without affecting existing data

-- Create nixie schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS "nixie";

-- Create handle_new_user function
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

-- Create wallets table
CREATE TABLE IF NOT EXISTS "public"."wallets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "balance" numeric(10,2) DEFAULT 0.00,
    "currency" "text" DEFAULT 'USD'::text,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

-- Create conversations table
CREATE TABLE IF NOT EXISTS "public"."conversations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text",
    "messages" "jsonb" DEFAULT '[]'::jsonb,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

-- Create child_profiles table
CREATE TABLE IF NOT EXISTS "public"."child_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "parent_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "age" integer,
    "avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

-- Create transactions table
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

-- Create vortex_settings table (renamed to avoid conflicts)
CREATE TABLE IF NOT EXISTS "public"."vortex_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "key" "text" NOT NULL,
    "value" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

-- Add primary keys and constraints
ALTER TABLE "public"."wallets" ADD CONSTRAINT IF NOT EXISTS "wallets_pkey" PRIMARY KEY ("id");
ALTER TABLE "public"."wallets" ADD CONSTRAINT IF NOT EXISTS "wallets_user_id_key" UNIQUE ("user_id");

ALTER TABLE "public"."conversations" ADD CONSTRAINT IF NOT EXISTS "conversations_pkey" PRIMARY KEY ("id");

ALTER TABLE "public"."child_profiles" ADD CONSTRAINT IF NOT EXISTS "child_profiles_pkey" PRIMARY KEY ("id");

ALTER TABLE "public"."transactions" ADD CONSTRAINT IF NOT EXISTS "transactions_pkey" PRIMARY KEY ("id");

ALTER TABLE "public"."vortex_settings" ADD CONSTRAINT IF NOT EXISTS "vortex_settings_pkey" PRIMARY KEY ("id");
ALTER TABLE "public"."vortex_settings" ADD CONSTRAINT IF NOT EXISTS "vortex_settings_user_id_key_key" UNIQUE ("user_id", "key");

-- Add foreign keys
ALTER TABLE "public"."wallets" ADD CONSTRAINT IF NOT EXISTS "wallets_user_id_fkey" 
FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE "public"."conversations" ADD CONSTRAINT IF NOT EXISTS "conversations_user_id_fkey" 
FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE "public"."child_profiles" ADD CONSTRAINT IF NOT EXISTS "child_profiles_parent_id_fkey" 
FOREIGN KEY ("parent_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE "public"."transactions" ADD CONSTRAINT IF NOT EXISTS "transactions_user_id_fkey" 
FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE "public"."vortex_settings" ADD CONSTRAINT IF NOT EXISTS "vortex_settings_user_id_fkey" 
FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE "public"."wallets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."conversations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."child_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."transactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."vortex_settings" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY IF NOT EXISTS "Users can view own wallet" ON "public"."wallets" 
FOR SELECT USING ("auth"."uid"() = "user_id");

CREATE POLICY IF NOT EXISTS "Users can update own wallet" ON "public"."wallets" 
FOR UPDATE USING ("auth"."uid"() = "user_id");

CREATE POLICY IF NOT EXISTS "Users can manage own conversations" ON "public"."conversations" 
FOR ALL USING ("auth"."uid"() = "user_id");

CREATE POLICY IF NOT EXISTS "Parents can manage child profiles" ON "public"."child_profiles" 
FOR ALL USING ("auth"."uid"() = "parent_id");

CREATE POLICY IF NOT EXISTS "Users can view own transactions" ON "public"."transactions" 
FOR SELECT USING ("auth"."uid"() = "user_id");

CREATE POLICY IF NOT EXISTS "Users can manage own settings" ON "public"."vortex_settings" 
FOR ALL USING ("auth"."uid"() = "user_id");

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
DROP TRIGGER IF EXISTS "on_auth_user_created_vortex" ON "auth"."users";
CREATE TRIGGER "on_auth_user_created_vortex"
  AFTER INSERT ON "auth"."users"
  FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_user"();

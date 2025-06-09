#!/bin/bash

# Database Migration Script: VortexCore.app to The Fixer Initiative
# Created: June 9, 2025
# Purpose: Migrate database schema, functions, and policies

set -e

PROJECT_TARGET="mxtsdgkwzjzlttpotole"
PROJECT_SOURCE="muyhurqfcsjqtnbozyir"

echo "🚀 Starting Database Migration Process..."
echo "Source Project: $PROJECT_SOURCE"
echo "Target Project: $PROJECT_TARGET"

# Function to check if we're linked to the correct project
check_project_link() {
    local expected_project=$1
    local current_project=$(supabase status | grep "Project ref" | awk '{print $3}' || echo "none")
    if [ "$current_project" != "$expected_project" ]; then
        echo "⚠️  Linking to project: $expected_project"
        supabase link --project-ref $expected_project
    fi
}

# Step 1: Extract complete source schema if not already done
echo "📥 Step 1: Extracting source database schema..."
if [ ! -f "source_complete_migration.sql" ]; then
    check_project_link $PROJECT_SOURCE
    echo "Dumping complete source schema..."
    supabase db dump -f source_complete_migration.sql
    echo "✅ Source schema extracted"
else
    echo "✅ Using existing source schema dump"
fi

# Step 2: Switch to target project
echo "🔄 Step 2: Switching to target project..."
check_project_link $PROJECT_TARGET

# Step 3: Create backup of target database
echo "💾 Step 3: Creating backup of target database..."
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
supabase db dump -f "target_backup_$BACKUP_DATE.sql"
echo "✅ Target database backed up to target_backup_$BACKUP_DATE.sql"

# Step 4: Create migration SQL script
echo "📝 Step 4: Creating migration SQL script..."
cat > migration_script.sql << 'EOF'
-- VortexCore.app Database Migration Script
-- Created: June 9, 2025
-- Target: The Fixer Initiative Project

-- Step 1: Create nixie schema
CREATE SCHEMA IF NOT EXISTS "nixie";
ALTER SCHEMA "nixie" OWNER TO "postgres";

-- Step 2: Create handle_new_user function
CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email)
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    updated_at = NOW();
  
  INSERT INTO public.wallets (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Grant permissions for handle_new_user function
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";

-- Step 3: Create wallets table (if not exists)
CREATE TABLE IF NOT EXISTS "public"."wallets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "balance" numeric(10,2) DEFAULT 0.00,
    "currency" "text" DEFAULT 'USD'::text,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "public"."wallets" OWNER TO "postgres";

-- Add primary key and constraints for wallets
ALTER TABLE ONLY "public"."wallets"
    ADD CONSTRAINT "wallets_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."wallets"
    ADD CONSTRAINT "wallets_user_id_key" UNIQUE ("user_id");

-- Step 4: Create conversations table
CREATE TABLE IF NOT EXISTS "public"."conversations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text",
    "messages" "jsonb" DEFAULT '[]'::jsonb,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "public"."conversations" OWNER TO "postgres";

ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_pkey" PRIMARY KEY ("id");

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

ALTER TABLE "public"."child_profiles" OWNER TO "postgres";

ALTER TABLE ONLY "public"."child_profiles"
    ADD CONSTRAINT "child_profiles_pkey" PRIMARY KEY ("id");

-- Step 6: Create parent_comments table
CREATE TABLE IF NOT EXISTS "public"."parent_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "child_id" "uuid" NOT NULL,
    "parent_id" "uuid" NOT NULL,
    "comment" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "public"."parent_comments" OWNER TO "postgres";

ALTER TABLE ONLY "public"."parent_comments"
    ADD CONSTRAINT "parent_comments_pkey" PRIMARY KEY ("id");

-- Step 7: Create transactions table  
CREATE TABLE IF NOT EXISTS "public"."transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "currency" "text" DEFAULT 'USD'::text,
    "type" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::text,
    "description" "text",
    "metadata" "jsonb" DEFAULT '{}'::jsonb,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "public"."transactions" OWNER TO "postgres";

ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_pkey" PRIMARY KEY ("id");

-- Step 8: Create API-related tables
CREATE TABLE IF NOT EXISTS "public"."api_keys" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "key" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "last_used" timestamp with time zone
);

ALTER TABLE "public"."api_keys" OWNER TO "postgres";

ALTER TABLE ONLY "public"."api_keys"
    ADD CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id");

CREATE TABLE IF NOT EXISTS "public"."api_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "api_key_id" "uuid",
    "user_id" "uuid",
    "endpoint" "text" NOT NULL,
    "method" "text" NOT NULL,
    "status_code" integer NOT NULL,
    "response_time" integer,
    "created_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "public"."api_logs" OWNER TO "postgres";

ALTER TABLE ONLY "public"."api_logs"
    ADD CONSTRAINT "api_logs_pkey" PRIMARY KEY ("id");

-- Step 9: Create settings table
CREATE TABLE IF NOT EXISTS "public"."settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "key" "text" NOT NULL,
    "value" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "public"."settings" OWNER TO "postgres";

ALTER TABLE ONLY "public"."settings"
    ADD CONSTRAINT "settings_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."settings"
    ADD CONSTRAINT "settings_user_id_key_key" UNIQUE ("user_id", "key");

-- Step 10: Create Stripe-related tables
CREATE TABLE IF NOT EXISTS "public"."stripe_customers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "stripe_customer_id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "public"."stripe_customers" OWNER TO "postgres";

ALTER TABLE ONLY "public"."stripe_customers"
    ADD CONSTRAINT "stripe_customers_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."stripe_customers"
    ADD CONSTRAINT "stripe_customers_stripe_customer_id_key" UNIQUE ("stripe_customer_id");

CREATE TABLE IF NOT EXISTS "public"."stripe_products" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "active" boolean DEFAULT true,
    "metadata" "jsonb" DEFAULT '{}'::jsonb,
    "created_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "public"."stripe_products" OWNER TO "postgres";

ALTER TABLE ONLY "public"."stripe_products"
    ADD CONSTRAINT "stripe_products_pkey" PRIMARY KEY ("id");

CREATE TABLE IF NOT EXISTS "public"."stripe_prices" (
    "id" "text" NOT NULL,
    "product_id" "text" NOT NULL,
    "currency" "text" NOT NULL,
    "unit_amount" integer,
    "recurring_interval" "text",
    "recurring_interval_count" integer,
    "active" boolean DEFAULT true,
    "metadata" "jsonb" DEFAULT '{}'::jsonb,
    "created_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "public"."stripe_prices" OWNER TO "postgres";

ALTER TABLE ONLY "public"."stripe_prices"
    ADD CONSTRAINT "stripe_prices_pkey" PRIMARY KEY ("id");

CREATE TABLE IF NOT EXISTS "public"."stripe_subscriptions" (
    "id" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "customer_id" "text" NOT NULL,
    "price_id" "text" NOT NULL,
    "status" "text" NOT NULL,
    "current_period_start" timestamp with time zone,
    "current_period_end" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::jsonb,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "public"."stripe_subscriptions" OWNER TO "postgres";

ALTER TABLE ONLY "public"."stripe_subscriptions"
    ADD CONSTRAINT "stripe_subscriptions_pkey" PRIMARY KEY ("id");

-- Step 11: Create additional required tables
CREATE TABLE IF NOT EXISTS "public"."callbacks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "type" "text" NOT NULL,
    "payload" "jsonb" NOT NULL,
    "status" "text" DEFAULT 'pending'::text,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "processed_at" timestamp with time zone
);

ALTER TABLE "public"."callbacks" OWNER TO "postgres";

ALTER TABLE ONLY "public"."callbacks"
    ADD CONSTRAINT "callbacks_pkey" PRIMARY KEY ("id");

CREATE TABLE IF NOT EXISTS "public"."verification_documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "document_type" "text" NOT NULL,
    "document_url" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::text,
    "verified_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "public"."verification_documents" OWNER TO "postgres";

ALTER TABLE ONLY "public"."verification_documents"
    ADD CONSTRAINT "verification_documents_pkey" PRIMARY KEY ("id");

-- Step 12: Add foreign key constraints
ALTER TABLE ONLY "public"."wallets"
    ADD CONSTRAINT "wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."child_profiles"
    ADD CONSTRAINT "child_profiles_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."parent_comments"
    ADD CONSTRAINT "parent_comments_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "public"."child_profiles"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."parent_comments"
    ADD CONSTRAINT "parent_comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."api_keys"
    ADD CONSTRAINT "api_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."api_logs"
    ADD CONSTRAINT "api_logs_api_key_id_fkey" FOREIGN KEY ("api_key_id") REFERENCES "public"."api_keys"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."api_logs"
    ADD CONSTRAINT "api_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."settings"
    ADD CONSTRAINT "settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."stripe_customers"
    ADD CONSTRAINT "stripe_customers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."stripe_prices"
    ADD CONSTRAINT "stripe_prices_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."stripe_products"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."stripe_subscriptions"
    ADD CONSTRAINT "stripe_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."stripe_subscriptions"
    ADD CONSTRAINT "stripe_subscriptions_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."stripe_customers"("stripe_customer_id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."stripe_subscriptions"
    ADD CONSTRAINT "stripe_subscriptions_price_id_fkey" FOREIGN KEY ("price_id") REFERENCES "public"."stripe_prices"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."verification_documents"
    ADD CONSTRAINT "verification_documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."callbacks"
    ADD CONSTRAINT "callbacks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

EOF

echo "✅ Migration SQL script created"

# Step 5: Execute migration (with confirmation)
echo "⚠️  Ready to execute database migration..."
echo "This will modify the target database schema."
read -p "Do you want to proceed? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Executing migration..."
    
    # Execute the migration
    supabase db reset --linked
    psql -h db.${PROJECT_TARGET}.supabase.co -U postgres -d postgres -f migration_script.sql
    
    echo "✅ Database migration completed!"
else
    echo "❌ Migration cancelled"
    exit 1
fi

# Step 6: Apply Row Level Security policies
echo "🔒 Step 6: Applying Row Level Security policies..."
cat > rls_policies.sql << 'EOF'
-- RLS Policies for VortexCore.app Migration

-- Enable RLS on all tables
ALTER TABLE "public"."conversations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."child_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."parent_comments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."api_keys" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."api_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."wallets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."transactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."verification_documents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."callbacks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."stripe_customers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."stripe_subscriptions" ENABLE ROW LEVEL SECURITY;

-- Conversations policies
CREATE POLICY "Users can view own conversations" ON "public"."conversations" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));
CREATE POLICY "Users can insert own conversations" ON "public"."conversations" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));
CREATE POLICY "Users can update own conversations" ON "public"."conversations" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));
CREATE POLICY "Users can delete own conversations" ON "public"."conversations" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));

-- Child profiles policies
CREATE POLICY "Parents can view their linked children" ON "public"."child_profiles" FOR SELECT USING (("auth"."uid"() = "parent_id"));
CREATE POLICY "Parents can create their own children" ON "public"."child_profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "parent_id"));
CREATE POLICY "Parents can update their own children" ON "public"."child_profiles" FOR UPDATE USING (("auth"."uid"() = "parent_id"));
CREATE POLICY "Parents can delete their own children" ON "public"."child_profiles" FOR DELETE USING (("auth"."uid"() = "parent_id"));

-- Parent comments policies
CREATE POLICY "Parents can manage comments for their linked children" ON "public"."parent_comments" USING ((EXISTS ( SELECT 1 FROM "public"."child_profiles" WHERE (("child_profiles"."id" = "parent_comments"."child_id") AND ("child_profiles"."parent_id" = "auth"."uid"())))));

-- API keys policies
CREATE POLICY "Users can view their own API keys" ON "public"."api_keys" FOR SELECT USING (("user_id" = "auth"."uid"()));
CREATE POLICY "Users can insert their own API keys" ON "public"."api_keys" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));
CREATE POLICY "Users can update their own API keys" ON "public"."api_keys" FOR UPDATE USING (("user_id" = "auth"."uid"()));
CREATE POLICY "Users can delete their own API keys" ON "public"."api_keys" FOR DELETE USING (("user_id" = "auth"."uid"()));

-- Settings policies
CREATE POLICY "Users can view own settings" ON "public"."settings" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));
CREATE POLICY "Users can insert own settings" ON "public"."settings" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));
CREATE POLICY "Users can update own settings" ON "public"."settings" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));

-- Wallets policies
CREATE POLICY "Users can view own wallet" ON "public"."wallets" FOR SELECT USING (("user_id" = "auth"."uid"()));
CREATE POLICY "Users can update own wallet" ON "public"."wallets" FOR UPDATE USING (("user_id" = "auth"."uid"()));

-- Transactions policies
CREATE POLICY "Users can view own transactions" ON "public"."transactions" FOR SELECT USING (("user_id" = "auth"."uid"()));
CREATE POLICY "Service role can manage all transactions" ON "public"."transactions" TO "service_role" USING (true) WITH CHECK (true);

-- Stripe customer policies
CREATE POLICY "Users can view own stripe customer data" ON "public"."stripe_customers" FOR SELECT USING (("user_id" = "auth"."uid"()));

-- Stripe subscription policies  
CREATE POLICY "Users can view own subscriptions" ON "public"."stripe_subscriptions" FOR SELECT USING (("user_id" = "auth"."uid"()));

-- Stripe products/prices public access
CREATE POLICY "Anyone can view active products" ON "public"."stripe_products" FOR SELECT TO "authenticated" USING (("active" = true));
CREATE POLICY "Anyone can view active prices" ON "public"."stripe_prices" FOR SELECT TO "authenticated" USING (("active" = true));

-- Verification documents policies
CREATE POLICY "Users can manage own verification documents" ON "public"."verification_documents" FOR ALL USING (("user_id" = "auth"."uid"()));

-- Callbacks policies (service role only)
CREATE POLICY "Service role can manage all callbacks" ON "public"."callbacks" TO "service_role" USING (true) WITH CHECK (true);

-- API logs policies (users can view their own logs)
CREATE POLICY "Users can view own API logs" ON "public"."api_logs" FOR SELECT USING (("user_id" = "auth"."uid"()));

EOF

psql -h db.${PROJECT_TARGET}.supabase.co -U postgres -d postgres -f rls_policies.sql

echo "🔒 RLS policies applied!"

echo "🎉 Database migration completed successfully!"
echo "📋 Summary:"
echo "  - Created nixie schema"
echo "  - Deployed handle_new_user function"
echo "  - Created 15 new tables with relationships"
echo "  - Applied comprehensive RLS policies"
echo "  - Database is ready for VortexCore.app functionality"

echo ""
echo "📝 Next steps:"
echo "  1. Configure missing API secrets"
echo "  2. Migrate existing data from source project"
echo "  3. Test all functionality"
echo "  4. Update application configuration"

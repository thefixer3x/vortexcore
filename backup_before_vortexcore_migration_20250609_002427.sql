

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "app_apple";


ALTER SCHEMA "app_apple" OWNER TO "postgres";


CREATE SCHEMA IF NOT EXISTS "app_saas";


ALTER SCHEMA "app_saas" OWNER TO "postgres";


CREATE SCHEMA IF NOT EXISTS "app_seftec";


ALTER SCHEMA "app_seftec" OWNER TO "postgres";


CREATE SCHEMA IF NOT EXISTS "app_vortexcore";


ALTER SCHEMA "app_vortexcore" OWNER TO "postgres";


CREATE SCHEMA IF NOT EXISTS "control_room";


ALTER SCHEMA "control_room" OWNER TO "postgres";


COMMENT ON SCHEMA "control_room" IS 'The Fixer Initiative Control Room - Central monitoring and management';



COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "hypopg" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "index_advisor" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "wrappers" WITH SCHEMA "extensions";






CREATE TYPE "public"."payment_status" AS ENUM (
    'pending',
    'processing',
    'completed',
    'failed',
    'canceled'
);


ALTER TYPE "public"."payment_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "control_room"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "control_room"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_daily_metrics"("p_consent_id" "uuid", "p_date" "date") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_total_inflow NUMERIC := 0;
  v_total_outflow NUMERIC := 0;
  v_txn_count INTEGER := 0;
  v_unique_counterparties INTEGER := 0;
  v_largest_inflow NUMERIC := 0;
  v_largest_outflow NUMERIC := 0;
BEGIN
  -- Calculate metrics from transaction data
  SELECT 
    COALESCE(SUM(CASE WHEN credit THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN NOT credit THEN amount ELSE 0 END), 0),
    COUNT(*),
    COUNT(DISTINCT narration),
    COALESCE(MAX(CASE WHEN credit THEN amount ELSE 0 END), 0),
    COALESCE(MAX(CASE WHEN NOT credit THEN amount ELSE 0 END), 0)
  INTO 
    v_total_inflow,
    v_total_outflow,
    v_txn_count,
    v_unique_counterparties,
    v_largest_inflow,
    v_largest_outflow
  FROM edoc_transactions 
  WHERE consent_id = p_consent_id 
  AND txn_date = p_date;

  -- Upsert the metrics
  INSERT INTO edoc_fin_metrics (
    consent_id, metric_date, total_inflow, total_outflow, 
    net_position, transaction_count, unique_counterparties,
    largest_single_inflow, largest_single_outflow, updated_at
  ) VALUES (
    p_consent_id, p_date, v_total_inflow, v_total_outflow,
    v_total_inflow - v_total_outflow, v_txn_count, v_unique_counterparties,
    v_largest_inflow, v_largest_outflow, now()
  )
  ON CONFLICT (consent_id, metric_date) 
  DO UPDATE SET
    total_inflow = EXCLUDED.total_inflow,
    total_outflow = EXCLUDED.total_outflow,
    net_position = EXCLUDED.net_position,
    transaction_count = EXCLUDED.transaction_count,
    unique_counterparties = EXCLUDED.unique_counterparties,
    largest_single_inflow = EXCLUDED.largest_single_inflow,
    largest_single_outflow = EXCLUDED.largest_single_outflow,
    updated_at = now();
END;
$$;


ALTER FUNCTION "public"."calculate_daily_metrics"("p_consent_id" "uuid", "p_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."detect_risk_patterns"("p_consent_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_avg_daily_txns NUMERIC;
  v_recent_txns NUMERIC;
  v_avg_amount NUMERIC;
  v_max_recent NUMERIC;
BEGIN
  -- Clear existing unresolved flags for this consent
  UPDATE edoc_risk_flags 
  SET resolved_at = now() 
  WHERE consent_id = p_consent_id 
  AND resolved_at IS NULL;

  -- Get average daily transaction count
  SELECT AVG(transaction_count) INTO v_avg_daily_txns
  FROM edoc_fin_metrics 
  WHERE consent_id = p_consent_id 
  AND metric_date >= CURRENT_DATE - INTERVAL '30 days';

  -- Get recent transaction count
  SELECT AVG(transaction_count) INTO v_recent_txns
  FROM edoc_fin_metrics 
  WHERE consent_id = p_consent_id 
  AND metric_date >= CURRENT_DATE - INTERVAL '7 days';

  -- Flag velocity anomalies
  IF v_recent_txns > (COALESCE(v_avg_daily_txns, 0) * 3) THEN
    INSERT INTO edoc_risk_flags (consent_id, flag_type, severity, description, metadata)
    VALUES (
      p_consent_id, 
      'velocity', 
      'high',
      'Transaction velocity significantly above normal patterns',
      jsonb_build_object('avg_daily', v_avg_daily_txns, 'recent_daily', v_recent_txns)
    );
  END IF;

  -- Get average and max amounts
  SELECT AVG(largest_single_outflow) INTO v_avg_amount
  FROM edoc_fin_metrics 
  WHERE consent_id = p_consent_id 
  AND metric_date >= CURRENT_DATE - INTERVAL '90 days';

  SELECT MAX(largest_single_outflow) INTO v_max_recent
  FROM edoc_fin_metrics 
  WHERE consent_id = p_consent_id 
  AND metric_date >= CURRENT_DATE - INTERVAL '7 days';

  -- Flag large amount anomalies
  IF v_max_recent > (COALESCE(v_avg_amount, 0) * 10) THEN
    INSERT INTO edoc_risk_flags (consent_id, flag_type, severity, description, metadata)
    VALUES (
      p_consent_id, 
      'amount', 
      'medium',
      'Unusually large transaction detected',
      jsonb_build_object('avg_amount', v_avg_amount, 'max_recent', v_max_recent)
    );
  END IF;
END;
$$;


ALTER FUNCTION "public"."detect_risk_patterns"("p_consent_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_product_image_url"("image_path" "text") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF image_path IS NULL THEN
    RETURN NULL;
  ELSE
    RETURN 'https://ptnrwrgzrsbocgxlpvhd.supabase.co/storage/v1/object/public/product_images/' || image_path;
  END IF;
END;
$$;


ALTER FUNCTION "public"."get_product_image_url"("image_path" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."initialize_notification_settings"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  INSERT INTO public.notification_settings (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."initialize_notification_settings"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."initialize_user_tier"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    INSERT INTO public.user_tiers (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."initialize_user_tier"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND business_type = 'admin'
  );
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_owner"("bulk_id" "uuid") RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.bulk_payments
    WHERE id = bulk_id AND user_id = auth.uid()
  );
$$;


ALTER FUNCTION "public"."is_owner"("bulk_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."request_password_reset"("email" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- This function handles password reset requests
  -- The actual email sending will be done through an edge function
  RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."request_password_reset"("email" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_modified_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_modified_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "control_room"."apps" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "status" "text" DEFAULT 'active'::"text",
    "schema_name" "text" NOT NULL,
    "original_project_ref" "text",
    "migration_status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "apps_migration_status_check" CHECK (("migration_status" = ANY (ARRAY['pending'::"text", 'in_progress'::"text", 'completed'::"text"]))),
    CONSTRAINT "apps_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text", 'maintenance'::"text"])))
);


ALTER TABLE "control_room"."apps" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "control_room"."audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "app_id" "text",
    "user_id" "uuid",
    "action" "text" NOT NULL,
    "details" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "control_room"."audit_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "control_room"."metrics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "app_id" "text",
    "metric_type" "text" NOT NULL,
    "metric_value" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "control_room"."metrics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "control_room"."user_app_access" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "app_id" "text" NOT NULL,
    "role" "text" DEFAULT 'viewer'::"text",
    "granted_at" timestamp with time zone DEFAULT "now"(),
    "granted_by" "uuid",
    CONSTRAINT "user_app_access_role_check" CHECK (("role" = ANY (ARRAY['viewer'::"text", 'developer'::"text", 'admin'::"text"])))
);


ALTER TABLE "control_room"."user_app_access" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_response_cache" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "prompt_hash" "text" NOT NULL,
    "prompt" "text" NOT NULL,
    "response" "text" NOT NULL,
    "model_used" "text" NOT NULL,
    "tokens_used" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone,
    "hit_count" integer DEFAULT 0
);


ALTER TABLE "public"."ai_response_cache" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_usage_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "prompt" "text" NOT NULL,
    "tokens_used" integer,
    "model_used" "text" NOT NULL,
    "query_complexity" "text" NOT NULL,
    "response_time_ms" integer,
    "estimated_cost" numeric(10,6),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_feedback" integer,
    "feedback_text" "text"
);


ALTER TABLE "public"."ai_usage_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."beneficiaries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "account_number" "text" NOT NULL,
    "bank_code" "text" NOT NULL,
    "category" "text",
    "is_archived" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "valid_account_number" CHECK ((("length"("account_number") >= 8) AND ("length"("account_number") <= 34)))
);


ALTER TABLE "public"."beneficiaries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bulk_payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "total_amount" numeric NOT NULL,
    "status" "public"."payment_status" DEFAULT 'pending'::"public"."payment_status" NOT NULL,
    "currency_code" character(3) DEFAULT 'NGN'::"bpchar" NOT NULL,
    "scheduled_date" timestamp with time zone,
    "processed_at" timestamp with time zone,
    "last_error" "text",
    "modified_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."bulk_payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."edoc_consents" (
    "id" "uuid" NOT NULL,
    "org_id" "uuid",
    "bank" "text",
    "status" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "raw" "jsonb",
    CONSTRAINT "edoc_consents_status_check" CHECK (("status" = ANY (ARRAY['Created'::"text", 'Active'::"text", 'Revoked'::"text", 'Error'::"text"])))
);


ALTER TABLE "public"."edoc_consents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."edoc_fin_metrics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "consent_id" "uuid" NOT NULL,
    "metric_date" "date" NOT NULL,
    "total_inflow" numeric DEFAULT 0,
    "total_outflow" numeric DEFAULT 0,
    "net_position" numeric DEFAULT 0,
    "avg_balance" numeric DEFAULT 0,
    "transaction_count" integer DEFAULT 0,
    "unique_counterparties" integer DEFAULT 0,
    "largest_single_inflow" numeric DEFAULT 0,
    "largest_single_outflow" numeric DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."edoc_fin_metrics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."edoc_risk_flags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "consent_id" "uuid" NOT NULL,
    "flag_type" "text" NOT NULL,
    "severity" "text" NOT NULL,
    "description" "text" NOT NULL,
    "triggered_at" timestamp with time zone DEFAULT "now"(),
    "resolved_at" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "edoc_risk_flags_flag_type_check" CHECK (("flag_type" = ANY (ARRAY['velocity'::"text", 'amount'::"text", 'frequency'::"text", 'pattern'::"text", 'compliance'::"text"]))),
    CONSTRAINT "edoc_risk_flags_severity_check" CHECK (("severity" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text", 'critical'::"text"])))
);


ALTER TABLE "public"."edoc_risk_flags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."edoc_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "consent_id" "uuid",
    "txn_date" "date",
    "amount" numeric,
    "credit" boolean,
    "narration" "text",
    "raw" "jsonb"
);


ALTER TABLE "public"."edoc_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."edoc_usage" (
    "day" "date" NOT NULL,
    "org_id" "uuid",
    "api_calls" integer DEFAULT 0,
    "cost_usd" numeric
);


ALTER TABLE "public"."edoc_usage" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."marketplace_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid",
    "seller_id" "uuid",
    "buyer_id" "uuid",
    "stripe_charge_id" "text",
    "amount" numeric NOT NULL,
    "platform_fee" numeric NOT NULL,
    "seller_amount" numeric NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."marketplace_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notification_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "info_enabled" boolean DEFAULT true NOT NULL,
    "warning_enabled" boolean DEFAULT true NOT NULL,
    "success_enabled" boolean DEFAULT true NOT NULL,
    "error_enabled" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."notification_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "type" character varying(50) DEFAULT 'info'::character varying NOT NULL,
    "is_read" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone,
    "notification_group" "text"
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."order_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "product_id" "uuid" NOT NULL,
    "quantity" integer NOT NULL,
    "unit_price" numeric(10,2) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."order_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "order_date" timestamp with time zone DEFAULT "now"(),
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "total_amount" numeric(10,2) NOT NULL,
    "shipping_address" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."org_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "org_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."org_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."orgs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text",
    "billing_email" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."orgs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_audit" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "payment_id" "uuid" NOT NULL,
    "old_status" "public"."payment_status",
    "new_status" "public"."payment_status",
    "changed_by" "uuid",
    "changed_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."payment_audit" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "bulk_payment_id" "uuid" NOT NULL,
    "beneficiary_id" "uuid" NOT NULL,
    "amount" numeric NOT NULL,
    "status" "public"."payment_status" DEFAULT 'pending'::"public"."payment_status" NOT NULL,
    "currency_code" character(3) DEFAULT 'NGN'::"bpchar" NOT NULL,
    "description" "text",
    "error_message" "text",
    "retry_count" integer DEFAULT 0,
    "processed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "positive_amount" CHECK (("amount" > (0)::numeric))
);


ALTER TABLE "public"."payment_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pricing_insights" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_id" "uuid" NOT NULL,
    "suggested_price" numeric(10,2) NOT NULL,
    "min_viable_price" numeric(10,2),
    "max_viable_price" numeric(10,2),
    "price_elasticity" numeric(5,4),
    "market_trend" "text",
    "confidence_score" numeric(5,4) NOT NULL,
    "reasoning" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone
);


ALTER TABLE "public"."pricing_insights" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_embeddings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_id" "uuid" NOT NULL,
    "embedding" "extensions"."vector"(384),
    "text_content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."product_embeddings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "vendor_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "price" numeric(10,2) NOT NULL,
    "stock_quantity" integer DEFAULT 0 NOT NULL,
    "category" "text",
    "image_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "first_name" "text",
    "last_name" "text",
    "company_name" "text",
    "business_type" "text",
    "is_vendor" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."query_classifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "prompt" "text" NOT NULL,
    "classified_complexity" "text" NOT NULL,
    "actual_complexity" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "was_escalated" boolean DEFAULT false,
    "feedback_score" integer,
    "tokens_used" integer
);


ALTER TABLE "public"."query_classifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."recommendations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "product_id" "uuid" NOT NULL,
    "supplier_id" "uuid" NOT NULL,
    "relevance_score" numeric(5,4) NOT NULL,
    "recommendation_type" "text" NOT NULL,
    "reason" "text",
    "viewed" boolean DEFAULT false,
    "clicked" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."recommendations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."risk_analysis" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid",
    "user_id" "uuid",
    "risk_score" numeric(5,4) NOT NULL,
    "risk_factors" "jsonb",
    "is_flagged" boolean DEFAULT false,
    "review_status" "text" DEFAULT 'pending'::"text",
    "reviewer_id" "uuid",
    "reviewed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."risk_analysis" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."search_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "search_query" "text" NOT NULL,
    "category" "text",
    "filters" "jsonb",
    "results_count" integer,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."search_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stripe_connect_accounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "stripe_account_id" "text",
    "onboarding_complete" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."stripe_connect_accounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "stripe_customer_id" "text",
    "stripe_subscription_id" "text",
    "plan_name" "text" DEFAULT 'free'::"text" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "current_period_start" timestamp with time zone,
    "current_period_end" timestamp with time zone,
    "trial_end" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_preferences" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "industry_focus" "text"[] DEFAULT '{}'::"text"[],
    "regions_of_interest" "text"[] DEFAULT '{}'::"text"[],
    "business_size" "text",
    "risk_tolerance" "text",
    "payment_methods" "text"[] DEFAULT '{}'::"text"[],
    "preferred_currencies" "text"[] DEFAULT '{}'::"text"[],
    "trade_volume" "text",
    "trade_frequency" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_tiers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "tier_name" "text" DEFAULT 'free'::"text" NOT NULL,
    "max_queries_per_day" integer DEFAULT 10 NOT NULL,
    "can_use_advanced_models" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone
);


ALTER TABLE "public"."user_tiers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."virtual_cards" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "cardholder_id" "text",
    "card_id" "text",
    "last4" "text",
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "is_locked" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."virtual_cards" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."webhook_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "provider" "text" NOT NULL,
    "event_type" "text" NOT NULL,
    "payload" "jsonb" NOT NULL,
    "status" "text" DEFAULT 'received'::"text" NOT NULL,
    "processed_at" timestamp with time zone,
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."webhook_log" OWNER TO "postgres";


ALTER TABLE ONLY "control_room"."apps"
    ADD CONSTRAINT "apps_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "control_room"."audit_log"
    ADD CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "control_room"."metrics"
    ADD CONSTRAINT "metrics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "control_room"."user_app_access"
    ADD CONSTRAINT "user_app_access_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "control_room"."user_app_access"
    ADD CONSTRAINT "user_app_access_user_id_app_id_key" UNIQUE ("user_id", "app_id");



ALTER TABLE ONLY "public"."ai_response_cache"
    ADD CONSTRAINT "ai_response_cache_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_response_cache"
    ADD CONSTRAINT "ai_response_cache_prompt_hash_key" UNIQUE ("prompt_hash");



ALTER TABLE ONLY "public"."ai_usage_logs"
    ADD CONSTRAINT "ai_usage_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."beneficiaries"
    ADD CONSTRAINT "beneficiaries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bulk_payments"
    ADD CONSTRAINT "bulk_payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."edoc_consents"
    ADD CONSTRAINT "edoc_consents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."edoc_fin_metrics"
    ADD CONSTRAINT "edoc_fin_metrics_consent_id_metric_date_key" UNIQUE ("consent_id", "metric_date");



ALTER TABLE ONLY "public"."edoc_fin_metrics"
    ADD CONSTRAINT "edoc_fin_metrics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."edoc_risk_flags"
    ADD CONSTRAINT "edoc_risk_flags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."edoc_transactions"
    ADD CONSTRAINT "edoc_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."edoc_usage"
    ADD CONSTRAINT "edoc_usage_pkey" PRIMARY KEY ("day");



ALTER TABLE ONLY "public"."marketplace_transactions"
    ADD CONSTRAINT "marketplace_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_settings"
    ADD CONSTRAINT "notification_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."org_members"
    ADD CONSTRAINT "org_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."org_members"
    ADD CONSTRAINT "org_members_user_id_org_id_key" UNIQUE ("user_id", "org_id");



ALTER TABLE ONLY "public"."orgs"
    ADD CONSTRAINT "orgs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_audit"
    ADD CONSTRAINT "payment_audit_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_items"
    ADD CONSTRAINT "payment_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pricing_insights"
    ADD CONSTRAINT "pricing_insights_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_embeddings"
    ADD CONSTRAINT "product_embeddings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."query_classifications"
    ADD CONSTRAINT "query_classifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."recommendations"
    ADD CONSTRAINT "recommendations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."risk_analysis"
    ADD CONSTRAINT "risk_analysis_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."search_history"
    ADD CONSTRAINT "search_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stripe_connect_accounts"
    ADD CONSTRAINT "stripe_connect_accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stripe_connect_accounts"
    ADD CONSTRAINT "stripe_connect_accounts_stripe_account_id_key" UNIQUE ("stripe_account_id");



ALTER TABLE ONLY "public"."stripe_connect_accounts"
    ADD CONSTRAINT "stripe_connect_accounts_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."user_tiers"
    ADD CONSTRAINT "user_tiers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_tiers"
    ADD CONSTRAINT "user_tiers_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."virtual_cards"
    ADD CONSTRAINT "virtual_cards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."webhook_log"
    ADD CONSTRAINT "webhook_log_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_metrics_app_id" ON "control_room"."metrics" USING "btree" ("app_id");



CREATE INDEX "idx_metrics_created_at" ON "control_room"."metrics" USING "btree" ("created_at");



CREATE INDEX "idx_beneficiaries_user" ON "public"."beneficiaries" USING "btree" ("user_id");



CREATE INDEX "idx_bulk_payments_status" ON "public"."bulk_payments" USING "btree" ("status");



CREATE INDEX "idx_bulk_payments_user" ON "public"."bulk_payments" USING "btree" ("user_id");



CREATE INDEX "idx_notifications_user_id" ON "public"."notifications" USING "btree" ("user_id");



CREATE INDEX "idx_order_items_order_id" ON "public"."order_items" USING "btree" ("order_id");



CREATE INDEX "idx_order_items_product_id" ON "public"."order_items" USING "btree" ("product_id");



CREATE INDEX "idx_orders_customer_id" ON "public"."orders" USING "btree" ("customer_id");



CREATE INDEX "idx_payment_audit_payment" ON "public"."payment_audit" USING "btree" ("payment_id");



CREATE INDEX "idx_payment_items_bulk" ON "public"."payment_items" USING "btree" ("bulk_payment_id");



CREATE INDEX "idx_payment_items_status" ON "public"."payment_items" USING "btree" ("status");



CREATE INDEX "idx_pricing_insights_product_id" ON "public"."pricing_insights" USING "btree" ("product_id");



CREATE INDEX "idx_product_embeddings_product_id" ON "public"."product_embeddings" USING "btree" ("product_id");



CREATE INDEX "idx_products_vendor_id" ON "public"."products" USING "btree" ("vendor_id");



CREATE INDEX "idx_recommendations_product_id" ON "public"."recommendations" USING "btree" ("product_id");



CREATE INDEX "idx_recommendations_supplier_id" ON "public"."recommendations" USING "btree" ("supplier_id");



CREATE INDEX "idx_recommendations_user_id" ON "public"."recommendations" USING "btree" ("user_id");



CREATE INDEX "idx_risk_analysis_order_id" ON "public"."risk_analysis" USING "btree" ("order_id");



CREATE INDEX "idx_risk_analysis_reviewer_id" ON "public"."risk_analysis" USING "btree" ("reviewer_id");



CREATE INDEX "idx_risk_analysis_user_id" ON "public"."risk_analysis" USING "btree" ("user_id");



CREATE INDEX "idx_search_history_user_id" ON "public"."search_history" USING "btree" ("user_id");



CREATE INDEX "product_embeddings_embedding_idx" ON "public"."product_embeddings" USING "ivfflat" ("embedding" "extensions"."vector_cosine_ops") WITH ("lists"='100');



CREATE OR REPLACE TRIGGER "update_apps_updated_at" BEFORE UPDATE ON "control_room"."apps" FOR EACH ROW EXECUTE FUNCTION "control_room"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "after_user_insert" AFTER INSERT ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."initialize_notification_settings"();



CREATE OR REPLACE TRIGGER "beneficiaries_updated" BEFORE UPDATE ON "public"."beneficiaries" FOR EACH ROW EXECUTE FUNCTION "public"."update_modified_column"();



CREATE OR REPLACE TRIGGER "bulk_payments_updated" BEFORE UPDATE ON "public"."bulk_payments" FOR EACH ROW EXECUTE FUNCTION "public"."update_modified_column"();



CREATE OR REPLACE TRIGGER "on_profile_created_set_tier" AFTER INSERT ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."initialize_user_tier"();



CREATE OR REPLACE TRIGGER "set_notification_settings_updated_at" BEFORE UPDATE ON "public"."notification_settings" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "set_notifications_updated_at" BEFORE UPDATE ON "public"."notifications" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "set_orders_updated_at" BEFORE UPDATE ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "set_pricing_insights_updated_at" BEFORE UPDATE ON "public"."pricing_insights" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "set_product_embeddings_updated_at" BEFORE UPDATE ON "public"."product_embeddings" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "set_products_updated_at" BEFORE UPDATE ON "public"."products" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "set_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "set_recommendations_updated_at" BEFORE UPDATE ON "public"."recommendations" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "set_risk_analysis_updated_at" BEFORE UPDATE ON "public"."risk_analysis" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at_marketplace_transactions" BEFORE UPDATE ON "public"."marketplace_transactions" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at_stripe_connect_accounts" BEFORE UPDATE ON "public"."stripe_connect_accounts" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at_subscriptions" BEFORE UPDATE ON "public"."subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at_virtual_cards" BEFORE UPDATE ON "public"."virtual_cards" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_user_preferences_updated_at" BEFORE UPDATE ON "public"."user_preferences" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



ALTER TABLE ONLY "control_room"."audit_log"
    ADD CONSTRAINT "audit_log_app_id_fkey" FOREIGN KEY ("app_id") REFERENCES "control_room"."apps"("id");



ALTER TABLE ONLY "control_room"."audit_log"
    ADD CONSTRAINT "audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "control_room"."metrics"
    ADD CONSTRAINT "metrics_app_id_fkey" FOREIGN KEY ("app_id") REFERENCES "control_room"."apps"("id");



ALTER TABLE ONLY "control_room"."user_app_access"
    ADD CONSTRAINT "user_app_access_app_id_fkey" FOREIGN KEY ("app_id") REFERENCES "control_room"."apps"("id");



ALTER TABLE ONLY "control_room"."user_app_access"
    ADD CONSTRAINT "user_app_access_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "control_room"."user_app_access"
    ADD CONSTRAINT "user_app_access_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."ai_usage_logs"
    ADD CONSTRAINT "ai_usage_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."beneficiaries"
    ADD CONSTRAINT "beneficiaries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."bulk_payments"
    ADD CONSTRAINT "bulk_payments_modified_by_fkey" FOREIGN KEY ("modified_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."bulk_payments"
    ADD CONSTRAINT "bulk_payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."edoc_consents"
    ADD CONSTRAINT "edoc_consents_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id");



ALTER TABLE ONLY "public"."edoc_transactions"
    ADD CONSTRAINT "edoc_transactions_consent_id_fkey" FOREIGN KEY ("consent_id") REFERENCES "public"."edoc_consents"("id");



ALTER TABLE ONLY "public"."edoc_usage"
    ADD CONSTRAINT "edoc_usage_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id");



ALTER TABLE ONLY "public"."marketplace_transactions"
    ADD CONSTRAINT "marketplace_transactions_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."marketplace_transactions"
    ADD CONSTRAINT "marketplace_transactions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."marketplace_transactions"
    ADD CONSTRAINT "marketplace_transactions_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notification_settings"
    ADD CONSTRAINT "notification_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_members"
    ADD CONSTRAINT "org_members_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_members"
    ADD CONSTRAINT "org_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payment_audit"
    ADD CONSTRAINT "payment_audit_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."payment_items"
    ADD CONSTRAINT "payment_items_beneficiary_id_fkey" FOREIGN KEY ("beneficiary_id") REFERENCES "public"."beneficiaries"("id");



ALTER TABLE ONLY "public"."payment_items"
    ADD CONSTRAINT "payment_items_bulk_payment_id_fkey" FOREIGN KEY ("bulk_payment_id") REFERENCES "public"."bulk_payments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pricing_insights"
    ADD CONSTRAINT "pricing_insights_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_embeddings"
    ADD CONSTRAINT "product_embeddings_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."recommendations"
    ADD CONSTRAINT "recommendations_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."recommendations"
    ADD CONSTRAINT "recommendations_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."recommendations"
    ADD CONSTRAINT "recommendations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."risk_analysis"
    ADD CONSTRAINT "risk_analysis_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."risk_analysis"
    ADD CONSTRAINT "risk_analysis_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."risk_analysis"
    ADD CONSTRAINT "risk_analysis_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."search_history"
    ADD CONSTRAINT "search_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stripe_connect_accounts"
    ADD CONSTRAINT "stripe_connect_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_tiers"
    ADD CONSTRAINT "user_tiers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."virtual_cards"
    ADD CONSTRAINT "virtual_cards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Users can view apps they have access to" ON "control_room"."apps" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "control_room"."user_app_access"
  WHERE (("user_app_access"."app_id" = "apps"."id") AND ("user_app_access"."user_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "control_room"."user_app_access"
  WHERE (("user_app_access"."user_id" = "auth"."uid"()) AND ("user_app_access"."role" = 'admin'::"text"))))));



CREATE POLICY "Users can view their own access" ON "control_room"."user_app_access" FOR SELECT USING (("user_id" = "auth"."uid"()));



ALTER TABLE "control_room"."apps" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "control_room"."audit_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "control_room"."metrics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "control_room"."user_app_access" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Admins can manage all AI usage" ON "public"."ai_usage_logs" USING ("public"."is_admin"());



CREATE POLICY "Admins can manage all tiers" ON "public"."user_tiers" USING ("public"."is_admin"());



CREATE POLICY "Allow read access to fin metrics" ON "public"."edoc_fin_metrics" FOR SELECT USING (true);



CREATE POLICY "Allow read access to risk flags" ON "public"."edoc_risk_flags" FOR SELECT USING (true);



CREATE POLICY "Anyone can view product embeddings" ON "public"."product_embeddings" FOR SELECT USING (true);



CREATE POLICY "Authenticated users can delete their own risk analyses" ON "public"."risk_analysis" FOR DELETE USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Authenticated users can insert their own risk analyses" ON "public"."risk_analysis" FOR INSERT WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Buyers can view their own purchases" ON "public"."marketplace_transactions" FOR SELECT USING (("auth"."uid"() = "buyer_id"));



CREATE POLICY "Customers can create orders" ON "public"."orders" FOR INSERT WITH CHECK (("customer_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Customers can view their own orders" ON "public"."orders" FOR SELECT USING (("customer_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Hide expired notifications" ON "public"."notifications" FOR SELECT USING ((("expires_at" IS NULL) OR ("expires_at" > "now"())));



CREATE POLICY "Product viewing policy" ON "public"."products" FOR SELECT USING (true);



CREATE POLICY "Sellers can view their own transactions" ON "public"."marketplace_transactions" FOR SELECT USING (("auth"."uid"() = "seller_id"));



CREATE POLICY "Users can archive beneficiaries" ON "public"."beneficiaries" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("is_archived" = true));



CREATE POLICY "Users can create their own beneficiaries" ON "public"."beneficiaries" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create their own bulk payments" ON "public"."bulk_payments" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create their own payment items" ON "public"."payment_items" FOR INSERT WITH CHECK ("public"."is_owner"("bulk_payment_id"));



CREATE POLICY "Users can delete their own beneficiaries" ON "public"."beneficiaries" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own bulk payments" ON "public"."bulk_payments" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own notification settings" ON "public"."notification_settings" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own preferences" ON "public"."user_preferences" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own search history" ON "public"."search_history" FOR INSERT WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can read own profile" ON "public"."profiles" FOR SELECT USING (("id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can update risk analyses" ON "public"."risk_analysis" FOR UPDATE USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR ("reviewer_id" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Users can update their own beneficiaries" ON "public"."beneficiaries" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own bulk payments" ON "public"."bulk_payments" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own notification settings" ON "public"."notification_settings" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own notifications" ON "public"."notifications" FOR UPDATE USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can update their own payment items" ON "public"."payment_items" FOR UPDATE USING ("public"."is_owner"("bulk_payment_id"));



CREATE POLICY "Users can update their own preferences" ON "public"."user_preferences" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view risk analyses" ON "public"."risk_analysis" FOR SELECT USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR (( SELECT "profiles"."business_type"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = ( SELECT "auth"."uid"() AS "uid"))) = 'admin'::"text")));



CREATE POLICY "Users can view their own AI usage" ON "public"."ai_usage_logs" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own Stripe Connect account" ON "public"."stripe_connect_accounts" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own beneficiaries" ON "public"."beneficiaries" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own bulk payments" ON "public"."bulk_payments" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own notification settings" ON "public"."notification_settings" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own notifications" ON "public"."notifications" FOR SELECT USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can view their own order items" ON "public"."order_items" FOR SELECT USING (("order_id" IN ( SELECT "orders"."id"
   FROM "public"."orders"
  WHERE ("orders"."customer_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can view their own payment audit records" ON "public"."payment_audit" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."bulk_payments"
  WHERE (("bulk_payments"."id" = "payment_audit"."payment_id") AND ("bulk_payments"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own payment items" ON "public"."payment_items" FOR SELECT USING ("public"."is_owner"("bulk_payment_id"));



CREATE POLICY "Users can view their own preferences" ON "public"."user_preferences" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own recommendations" ON "public"."recommendations" FOR SELECT USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can view their own search history" ON "public"."search_history" FOR SELECT USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can view their own subscriptions" ON "public"."subscriptions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own tier" ON "public"."user_tiers" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own virtual cards" ON "public"."virtual_cards" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Vendors can delete their own products" ON "public"."products" FOR DELETE USING (("vendor_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Vendors can manage their own products" ON "public"."products" FOR INSERT WITH CHECK (("vendor_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Vendors can update their own products" ON "public"."products" FOR UPDATE USING (("vendor_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Vendors can view pricing insights for their products" ON "public"."pricing_insights" FOR SELECT USING (("product_id" IN ( SELECT "products"."id"
   FROM "public"."products"
  WHERE ("products"."vendor_id" = ( SELECT "auth"."uid"() AS "uid")))));



ALTER TABLE "public"."ai_response_cache" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_usage_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."beneficiaries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bulk_payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."edoc_consents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."edoc_fin_metrics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."edoc_risk_flags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."edoc_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."edoc_usage" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."marketplace_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notification_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."order_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "org_can_manage_consents" ON "public"."edoc_consents" FOR SELECT USING (("org_id" IN ( SELECT "org_members"."org_id"
   FROM "public"."org_members"
  WHERE ("org_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "org_can_manage_transactions" ON "public"."edoc_transactions" FOR SELECT USING (("consent_id" IN ( SELECT "edoc_consents"."id"
   FROM "public"."edoc_consents"
  WHERE ("edoc_consents"."org_id" IN ( SELECT "org_members"."org_id"
           FROM "public"."org_members"
          WHERE ("org_members"."user_id" = "auth"."uid"()))))));



ALTER TABLE "public"."org_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payment_audit" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payment_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pricing_insights" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."product_embeddings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."query_classifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."recommendations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."risk_analysis" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."search_history" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "service_role_can_insert_consents" ON "public"."edoc_consents" FOR INSERT WITH CHECK (true);



CREATE POLICY "service_role_can_insert_transactions" ON "public"."edoc_transactions" FOR INSERT WITH CHECK (true);



CREATE POLICY "service_role_can_update_consents" ON "public"."edoc_consents" FOR UPDATE USING (true);



CREATE POLICY "service_role_can_update_transactions" ON "public"."edoc_transactions" FOR UPDATE USING (true);



ALTER TABLE "public"."stripe_connect_accounts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_tiers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users_can_view_own_memberships" ON "public"."org_members" FOR SELECT USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."virtual_cards" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "app_apple" TO "authenticated";



GRANT USAGE ON SCHEMA "app_saas" TO "authenticated";



GRANT USAGE ON SCHEMA "app_seftec" TO "authenticated";



GRANT USAGE ON SCHEMA "app_vortexcore" TO "authenticated";



GRANT USAGE ON SCHEMA "control_room" TO "authenticated";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";


























































































































































































































































































































































































































































































































































































































































































GRANT ALL ON FUNCTION "public"."calculate_daily_metrics"("p_consent_id" "uuid", "p_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_daily_metrics"("p_consent_id" "uuid", "p_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_daily_metrics"("p_consent_id" "uuid", "p_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."detect_risk_patterns"("p_consent_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."detect_risk_patterns"("p_consent_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."detect_risk_patterns"("p_consent_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_product_image_url"("image_path" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_product_image_url"("image_path" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_product_image_url"("image_path" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."initialize_notification_settings"() TO "anon";
GRANT ALL ON FUNCTION "public"."initialize_notification_settings"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."initialize_notification_settings"() TO "service_role";



GRANT ALL ON FUNCTION "public"."initialize_user_tier"() TO "anon";
GRANT ALL ON FUNCTION "public"."initialize_user_tier"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."initialize_user_tier"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_owner"("bulk_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_owner"("bulk_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_owner"("bulk_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."request_password_reset"("email" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."request_password_reset"("email" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."request_password_reset"("email" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_modified_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_modified_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_modified_column"() TO "service_role";







































GRANT ALL ON TABLE "public"."ai_response_cache" TO "anon";
GRANT ALL ON TABLE "public"."ai_response_cache" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_response_cache" TO "service_role";



GRANT ALL ON TABLE "public"."ai_usage_logs" TO "anon";
GRANT ALL ON TABLE "public"."ai_usage_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_usage_logs" TO "service_role";



GRANT ALL ON TABLE "public"."beneficiaries" TO "anon";
GRANT ALL ON TABLE "public"."beneficiaries" TO "authenticated";
GRANT ALL ON TABLE "public"."beneficiaries" TO "service_role";



GRANT ALL ON TABLE "public"."bulk_payments" TO "anon";
GRANT ALL ON TABLE "public"."bulk_payments" TO "authenticated";
GRANT ALL ON TABLE "public"."bulk_payments" TO "service_role";



GRANT ALL ON TABLE "public"."edoc_consents" TO "anon";
GRANT ALL ON TABLE "public"."edoc_consents" TO "authenticated";
GRANT ALL ON TABLE "public"."edoc_consents" TO "service_role";



GRANT ALL ON TABLE "public"."edoc_fin_metrics" TO "anon";
GRANT ALL ON TABLE "public"."edoc_fin_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."edoc_fin_metrics" TO "service_role";



GRANT ALL ON TABLE "public"."edoc_risk_flags" TO "anon";
GRANT ALL ON TABLE "public"."edoc_risk_flags" TO "authenticated";
GRANT ALL ON TABLE "public"."edoc_risk_flags" TO "service_role";



GRANT ALL ON TABLE "public"."edoc_transactions" TO "anon";
GRANT ALL ON TABLE "public"."edoc_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."edoc_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."edoc_usage" TO "anon";
GRANT ALL ON TABLE "public"."edoc_usage" TO "authenticated";
GRANT ALL ON TABLE "public"."edoc_usage" TO "service_role";



GRANT ALL ON TABLE "public"."marketplace_transactions" TO "anon";
GRANT ALL ON TABLE "public"."marketplace_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."marketplace_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."notification_settings" TO "anon";
GRANT ALL ON TABLE "public"."notification_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_settings" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."order_items" TO "anon";
GRANT ALL ON TABLE "public"."order_items" TO "authenticated";
GRANT ALL ON TABLE "public"."order_items" TO "service_role";



GRANT ALL ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";



GRANT ALL ON TABLE "public"."org_members" TO "anon";
GRANT ALL ON TABLE "public"."org_members" TO "authenticated";
GRANT ALL ON TABLE "public"."org_members" TO "service_role";



GRANT ALL ON TABLE "public"."orgs" TO "anon";
GRANT ALL ON TABLE "public"."orgs" TO "authenticated";
GRANT ALL ON TABLE "public"."orgs" TO "service_role";



GRANT ALL ON TABLE "public"."payment_audit" TO "anon";
GRANT ALL ON TABLE "public"."payment_audit" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_audit" TO "service_role";



GRANT ALL ON TABLE "public"."payment_items" TO "anon";
GRANT ALL ON TABLE "public"."payment_items" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_items" TO "service_role";



GRANT ALL ON TABLE "public"."pricing_insights" TO "anon";
GRANT ALL ON TABLE "public"."pricing_insights" TO "authenticated";
GRANT ALL ON TABLE "public"."pricing_insights" TO "service_role";



GRANT ALL ON TABLE "public"."product_embeddings" TO "anon";
GRANT ALL ON TABLE "public"."product_embeddings" TO "authenticated";
GRANT ALL ON TABLE "public"."product_embeddings" TO "service_role";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."query_classifications" TO "anon";
GRANT ALL ON TABLE "public"."query_classifications" TO "authenticated";
GRANT ALL ON TABLE "public"."query_classifications" TO "service_role";



GRANT ALL ON TABLE "public"."recommendations" TO "anon";
GRANT ALL ON TABLE "public"."recommendations" TO "authenticated";
GRANT ALL ON TABLE "public"."recommendations" TO "service_role";



GRANT ALL ON TABLE "public"."risk_analysis" TO "anon";
GRANT ALL ON TABLE "public"."risk_analysis" TO "authenticated";
GRANT ALL ON TABLE "public"."risk_analysis" TO "service_role";



GRANT ALL ON TABLE "public"."search_history" TO "anon";
GRANT ALL ON TABLE "public"."search_history" TO "authenticated";
GRANT ALL ON TABLE "public"."search_history" TO "service_role";



GRANT ALL ON TABLE "public"."stripe_connect_accounts" TO "anon";
GRANT ALL ON TABLE "public"."stripe_connect_accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."stripe_connect_accounts" TO "service_role";



GRANT ALL ON TABLE "public"."subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."user_preferences" TO "anon";
GRANT ALL ON TABLE "public"."user_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."user_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."user_tiers" TO "anon";
GRANT ALL ON TABLE "public"."user_tiers" TO "authenticated";
GRANT ALL ON TABLE "public"."user_tiers" TO "service_role";



GRANT ALL ON TABLE "public"."virtual_cards" TO "anon";
GRANT ALL ON TABLE "public"."virtual_cards" TO "authenticated";
GRANT ALL ON TABLE "public"."virtual_cards" TO "service_role";



GRANT ALL ON TABLE "public"."webhook_log" TO "anon";
GRANT ALL ON TABLE "public"."webhook_log" TO "authenticated";
GRANT ALL ON TABLE "public"."webhook_log" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;

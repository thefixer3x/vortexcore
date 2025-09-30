-- Fix RLS policy inefficiencies to improve query performance
-- Addresses auth_rls_initplan warnings by using (select auth.<function>()) syntax
-- Addresses multiple_permissive_policies warnings by consolidating policies where possible

-- Fix RLS policies for public.profiles table
-- Remove duplicate policies and optimize function calls
DROP POLICY IF EXISTS "Profiles can be inserted by owner" ON public.profiles;
DROP POLICY IF EXISTS "Users can create own profile" ON public.profiles;

CREATE POLICY "Users can manage own profile" ON public.profiles
  FOR ALL USING (
    (select auth.uid()) = id
  );

-- Fix RLS policies for public.memory_entries table
DROP POLICY IF EXISTS "Users can view own memory entries" ON public.memory_entries;
DROP POLICY IF EXISTS "Users can manage own memory entries" ON public.memory_entries;

CREATE POLICY "Users can manage own memory entries" ON public.memory_entries
 FOR ALL USING (
    (select auth.uid()) = user_id
  );

-- Fix RLS policies for public.api_keys table
DROP POLICY IF EXISTS "Users can create their own API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can update their own API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Service role can manage api_keys" ON public.api_keys;

CREATE POLICY "Users can manage own api_keys" ON public.api_keys
  FOR ALL USING (
    (select auth.uid()) = user_id
  );

-- Fix RLS policies for public.user_consents table
DROP POLICY IF EXISTS "Users can manage their own consents" ON public.user_consents;

CREATE POLICY "Users can manage own consents" ON public.user_consents
  FOR ALL USING (
    (select auth.uid()) = user_id
  );

-- Fix RLS policies for public.user_roles table
DROP POLICY IF EXISTS "Users can view their assigned roles" ON public.user_roles;

CREATE POLICY "Users can manage own roles" ON public.user_roles
  FOR ALL USING (
    (select auth.uid()) = user_id
  );

-- Fix RLS policies for public.ai_recommendations table
DROP POLICY IF EXISTS "Users can view AI recommendations" ON public.ai_recommendations;

CREATE POLICY "Users can view own AI recommendations" ON public.ai_recommendations
  FOR SELECT USING (
    (select auth.uid()) = user_id
  );

-- Fix RLS policies for public.business_financial_insights table
DROP POLICY IF EXISTS "Users can view their own business insights" ON public.business_financial_insights;

CREATE POLICY "Users can view own business insights" ON public.business_financial_insights
  FOR SELECT USING (
    (select auth.uid()) = user_id
  );

-- Fix RLS policies for public.edoc_financial_analysis table
DROP POLICY IF EXISTS "Users can view their own financial analysis" ON public.edoc_financial_analysis;

CREATE POLICY "Users can view own financial analysis" ON public.edoc_financial_analysis
  FOR SELECT USING (
    (select auth.uid()) = user_id
  );

-- Fix RLS policies for public.feature_flags table
DROP POLICY IF EXISTS "Authenticated users can view feature flags" ON public.feature_flags;

CREATE POLICY "Authenticated users can view feature flags" ON public.feature_flags
  FOR SELECT USING (
    (select auth.role()) = 'authenticated'
  );

-- Fix RLS policies for public.system_error_logs table
DROP POLICY IF EXISTS "System admins can view error logs" ON public.system_error_logs;

CREATE POLICY "Service role can manage error logs" ON public.system_error_logs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Fix RLS policies for public.edoc_consents table
DROP POLICY IF EXISTS "Users can manage their own consents" ON public.edoc_consents;

CREATE POLICY "Users can manage own edoc consents" ON public.edoc_consents
  FOR ALL USING (
    (select auth.uid()) = user_id
 );

-- Fix RLS policies for public.simple_users table
DROP POLICY IF EXISTS "Simple users can view own record" ON public.simple_users;
DROP POLICY IF EXISTS "Simple users can update own record" ON public.simple_users;

CREATE POLICY "Simple users can manage own record" ON public.simple_users
  FOR ALL USING (
    (select auth.uid()) = id
 );

-- Fix RLS policies for public.webhook_logs table
DROP POLICY IF EXISTS "System access for webhook logs" ON public.webhook_logs;

CREATE POLICY "Service role can manage webhook logs" ON public.webhook_logs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Fix RLS policies for public.topics table
DROP POLICY IF EXISTS "Users can manage own topics" ON public.topics;

CREATE POLICY "Users can manage own topics" ON public.topics
  FOR ALL USING (
    (select auth.uid()) = user_id
  );

-- Fix RLS policies for public.say_bills table
DROP POLICY IF EXISTS "Users can manage their own bills" ON public.say_bills;

CREATE POLICY "Users can manage own bills" ON public.say_bills
 FOR ALL USING (
    (select auth.uid()) = user_id
  );

-- Fix RLS policies for public.business_profiles table
DROP POLICY IF EXISTS "Users can manage their own business profiles" ON public.business_profiles;

CREATE POLICY "Users can manage own business profiles" ON public.business_profiles
 FOR ALL USING (
    (select auth.uid()) = user_id
  );

-- Fix RLS policies for public.say_orders table
DROP POLICY IF EXISTS "Users can manage their own orders" ON public.say_orders;

CREATE POLICY "Users can manage own orders" ON public.say_orders
  FOR ALL USING (
    (select auth.uid()) = user_id
  );

-- Fix RLS policies for public.user_sessions table
DROP POLICY IF EXISTS "Users can manage their own sessions" ON public.user_sessions;

CREATE POLICY "Users can manage own sessions" ON public.user_sessions
 FOR ALL USING (
    (select auth.uid()) = user_id
  );

-- Fix RLS policies for public.say_transfers table
DROP POLICY IF EXISTS "Users can manage their own transfers" ON public.say_transfers;

CREATE POLICY "Users can manage own transfers" ON public.say_transfers
  FOR ALL USING (
    (select auth.uid()) = user_id
 );

-- Fix RLS policies for public.users table
DROP POLICY IF EXISTS "Users can view own record" ON public.users;
DROP POLICY IF EXISTS "Users can update own record" ON public.users;

CREATE POLICY "Users can manage own record" ON public.users
  FOR ALL USING (
    (select auth.uid()) = id
  );

-- Fix RLS policies for public.user_activity_logs table
DROP POLICY IF EXISTS "Users can view their own activity logs" ON public.user_activity_logs;

CREATE POLICY "Users can view own activity logs" ON public.user_activity_logs
  FOR SELECT USING (
    (select auth.uid()) = user_id
  );

-- Fix RLS policies for public.agent_banks_memories table
DROP POLICY IF EXISTS "Users can view their own agent memories" ON public.agent_banks_memories;

CREATE POLICY "Users can view own agent memories" ON public.agent_banks_memories
  FOR SELECT USING (
    (select auth.uid()) = user_id
  );

-- Fix RLS policies for public.agent_banks_sessions table
DROP POLICY IF EXISTS "Users can view their own agent sessions" ON public.agent_banks_sessions;

CREATE POLICY "Users can view own agent sessions" ON public.agent_banks_sessions
  FOR SELECT USING (
    (select auth.uid()) = user_id
  );

-- Fix RLS policies for public.user_product_interactions table
DROP POLICY IF EXISTS "Users can view their own interactions" ON public.user_product_interactions;

CREATE POLICY "Users can view own interactions" ON public.user_product_interactions
  FOR SELECT USING (
    (select auth.uid()) = user_id
  );

-- Fix RLS policies for public.agent_banks_memory_search_logs table
DROP POLICY IF EXISTS "Users can view their own memory search logs" ON public.agent_banks_memory_search_logs;

CREATE POLICY "Users can view own memory search logs" ON public.agent_banks_memory_search_logs
  FOR SELECT USING (
    (select auth.uid()) = user_id
 );

-- Fix RLS policies for public.user_payments table
DROP POLICY IF EXISTS "Users can view their own payments" ON public.user_payments;

CREATE POLICY "Users can view own payments" ON public.user_payments
  FOR SELECT USING (
    (select auth.uid()) = user_id
 );

-- Fix RLS policies for public.edoc_transactions table
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.edoc_transactions;

CREATE POLICY "Users can view own transactions" ON public.edoc_transactions
  FOR SELECT USING (
    (select auth.uid()) = user_id
 );

-- Fix RLS policies for public.edoc_usage_logs table
DROP POLICY IF EXISTS "Users can view their own usage logs" ON public.edoc_usage_logs;

CREATE POLICY "Users can view own usage logs" ON public.edoc_usage_logs
  FOR SELECT USING (
    (select auth.uid()) = user_id
 );

-- Fix RLS policies for credit.applications table
DROP POLICY IF EXISTS "Users can create own applications" ON credit.applications;
DROP POLICY IF EXISTS "Users can update own applications" ON credit.applications;
DROP POLICY IF EXISTS "Users can view own applications" ON credit.applications;

CREATE POLICY "Users can manage credit applications" ON credit.applications
  FOR ALL USING (
    (select auth.uid()) = user_id
  );

-- Fix RLS policies for credit.credit_scores table
DROP POLICY IF EXISTS "Users can view own credit scores" ON credit.credit_scores;

CREATE POLICY "Users can view own credit scores" ON credit.credit_scores
  FOR SELECT USING (
    (select auth.uid()) = user_id
  );

-- Update the handle_new_user function to use optimized auth calls
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, profiles.email),
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    updated_at = NOW();

  -- Create wallet
  INSERT INTO public.wallets (user_id, balance, currency, created_at, updated_at)
  VALUES (NEW.id, 0.00, 'USD', NOW(), NOW())
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Ensure proper permissions are maintained
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;
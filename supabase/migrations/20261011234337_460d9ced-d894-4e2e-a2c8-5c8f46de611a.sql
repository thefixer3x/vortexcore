-- Pin search_path on SECURITY DEFINER functions
ALTER FUNCTION public.handle_new_user() SET search_path = public, pg_temp;
ALTER FUNCTION public.trigger_sync_user() SET search_path = public, pg_temp;
ALTER FUNCTION public.get_user_tier_info(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.log_intelligence_usage(uuid,text,int4,numeric,int4,bool,bool,text) SET search_path = public, pg_temp;
ALTER FUNCTION public.sm_update_feature_flag(varchar,bool) SET search_path = public, pg_temp;
ALTER FUNCTION public.check_intelligence_access(uuid,text) SET search_path = public, pg_temp;

-- Owner-scope policies that only checked "signed in"
DROP POLICY IF EXISTS "Users can manage their own consents" ON public.user_consents;
CREATE POLICY "Users can manage their own consents" ON public.user_consents FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS "Users can manage their own consents" ON public.edoc_consents;
CREATE POLICY "Users can manage their own consents" ON public.edoc_consents FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS "Users can view their own financial analysis" ON public.edoc_financial_analysis;
CREATE POLICY "Users can view their own financial analysis" ON public.edoc_financial_analysis FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS "Users can view their own business insights" ON public.business_financial_insights;
CREATE POLICY "Users can view their own business insights" ON public.business_financial_insights FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));

-- Wallet balances can only be changed by the server (service role), never by users directly
CREATE OR REPLACE FUNCTION app_vortexcore.protect_wallet_balance()
RETURNS trigger LANGUAGE plpgsql SET search_path = app_vortexcore, pg_temp AS $$
BEGIN
  IF current_user IN ('authenticated','anon') OR coalesce(auth.role(),'') IN ('authenticated','anon') THEN
    IF TG_OP = 'INSERT' THEN
      NEW.balance := 0;
    ELSIF NEW.balance IS DISTINCT FROM OLD.balance THEN
      RAISE EXCEPTION 'Wallet balance cannot be changed directly';
    END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS protect_wallet_balance ON app_vortexcore.vortex_wallets;
CREATE TRIGGER protect_wallet_balance BEFORE INSERT OR UPDATE ON app_vortexcore.vortex_wallets
  FOR EACH ROW EXECUTE FUNCTION app_vortexcore.protect_wallet_balance();
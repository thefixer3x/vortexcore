DO $$ DECLARE r record; BEGIN
FOR r IN SELECT tablename, policyname FROM pg_policies WHERE schemaname='public' AND tablename IN ('sm_feature_flags','feature_flags','intelligence_cost_reference') AND cmd IN ('SELECT','ALL') LOOP
EXECUTE format('DROP POLICY %I ON public.%I', r.policyname, r.tablename); END LOOP; END $$;
REVOKE SELECT ON public.sm_feature_flags FROM anon;
CREATE POLICY "Signed-in users can read sm feature flags" ON public.sm_feature_flags FOR SELECT TO authenticated USING ((SELECT auth.uid()) IS NOT NULL);
CREATE POLICY "Admins can read feature flags" ON public.feature_flags FOR SELECT TO authenticated USING (public.is_admin());
REVOKE ALL ON public.intelligence_cost_reference FROM anon, authenticated;
GRANT ALL ON public.sm_feature_flags, public.feature_flags, public.intelligence_cost_reference TO service_role;
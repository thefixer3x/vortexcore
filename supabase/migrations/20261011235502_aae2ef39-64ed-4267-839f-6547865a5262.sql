DROP POLICY IF EXISTS "ai_response_cache_select_policy" ON public.ai_response_cache;
REVOKE SELECT ON public.ai_response_cache FROM anon, authenticated;
GRANT ALL ON public.ai_response_cache TO service_role;

DROP POLICY IF EXISTS "Authenticated read access" ON public.company_projects;
CREATE POLICY "Admins can read company projects" ON public.company_projects
  FOR SELECT TO authenticated USING (public.is_admin());
REVOKE ALL ON public.ai_response_cache FROM anon, authenticated;
GRANT ALL ON public.ai_response_cache TO service_role;

REVOKE ALL ON public.company_projects FROM anon, authenticated;
GRANT SELECT ON public.company_projects TO authenticated;
GRANT ALL ON public.company_projects TO service_role;
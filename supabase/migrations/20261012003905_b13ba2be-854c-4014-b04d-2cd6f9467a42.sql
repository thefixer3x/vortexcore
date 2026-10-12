BEGIN;
ALTER TABLE public.company_endpoints ADD COLUMN IF NOT EXISTS user_id uuid, ADD COLUMN IF NOT EXISTS organization_id uuid;
ALTER TABLE public.query_classifications ADD COLUMN IF NOT EXISTS user_id uuid, ADD COLUMN IF NOT EXISTS organization_id uuid;
COMMENT ON COLUMN public.company_endpoints.organization_id IS 'Trusted service assigns organization; access compares server-controlled app_metadata.org_id.';
COMMENT ON COLUMN public.query_classifications.organization_id IS 'Trusted service assigns organization; never infer ownership of legacy rows.';
CREATE INDEX IF NOT EXISTS vortex_company_endpoints_owner_idx ON public.company_endpoints(user_id);
CREATE INDEX IF NOT EXISTS vortex_company_endpoints_org_idx ON public.company_endpoints(organization_id);
CREATE INDEX IF NOT EXISTS vortex_query_classifications_owner_idx ON public.query_classifications(user_id);
CREATE INDEX IF NOT EXISTS vortex_query_classifications_org_idx ON public.query_classifications(organization_id);
ALTER POLICY "Authenticated read access" ON public.company_endpoints TO authenticated USING (
 user_id = (SELECT auth.uid()) OR
 (organization_id IS NOT NULL AND organization_id::text = NULLIF((SELECT auth.jwt())->'app_metadata'->>'org_id', ''))
);
ALTER POLICY query_classifications_select_policy ON public.query_classifications TO authenticated USING (
 user_id = (SELECT auth.uid()) OR
 (organization_id IS NOT NULL AND organization_id::text = NULLIF((SELECT auth.jwt())->'app_metadata'->>'org_id', ''))
);
ALTER POLICY "Tenant access to clients" ON client_services.clients TO authenticated USING (
 metadata->>'user_id' = (SELECT auth.uid())::text OR
 (metadata->>'org_id' IS NOT NULL AND metadata->>'org_id' = NULLIF((SELECT auth.jwt())->'app_metadata'->>'org_id', ''))
) WITH CHECK (
 metadata->>'user_id' = (SELECT auth.uid())::text OR
 (metadata->>'org_id' IS NOT NULL AND metadata->>'org_id' = NULLIF((SELECT auth.jwt())->'app_metadata'->>'org_id', ''))
);
REVOKE ALL ON public.company_endpoints, public.query_classifications FROM anon, authenticated;
GRANT SELECT ON public.company_endpoints, public.query_classifications TO authenticated;
GRANT ALL ON public.company_endpoints, public.query_classifications TO service_role;
ALTER TABLE public.company_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.query_classifications ENABLE ROW LEVEL SECURITY;
COMMIT;
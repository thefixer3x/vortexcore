-- Applied migration 20260108033541 (enable_rls_provider_tables_v2), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.


-- ============================================================================
-- ENABLE ROW LEVEL SECURITY ON PROVIDER/WEBHOOK TABLES (public schema)
-- Uses service_role for backend API access
-- ============================================================================

-- Enable RLS
ALTER TABLE public.provider_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_capabilities ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROVIDER ACCOUNTS POLICIES (service role access - used by facade API)
-- ============================================================================

CREATE POLICY provider_accounts_service_select ON public.provider_accounts
    FOR SELECT USING (auth.role() = 'service_role');

CREATE POLICY provider_accounts_service_insert ON public.provider_accounts
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY provider_accounts_service_update ON public.provider_accounts
    FOR UPDATE USING (auth.role() = 'service_role');

CREATE POLICY provider_accounts_service_delete ON public.provider_accounts
    FOR DELETE USING (auth.role() = 'service_role');

-- ============================================================================
-- PROVIDER REFERENCES POLICIES
-- ============================================================================

CREATE POLICY provider_references_service_select ON public.provider_references
    FOR SELECT USING (auth.role() = 'service_role');

CREATE POLICY provider_references_service_insert ON public.provider_references
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY provider_references_service_update ON public.provider_references
    FOR UPDATE USING (auth.role() = 'service_role');

-- ============================================================================
-- WEBHOOK ENDPOINTS POLICIES
-- ============================================================================

CREATE POLICY webhook_endpoints_service_select ON public.webhook_endpoints
    FOR SELECT USING (auth.role() = 'service_role');

CREATE POLICY webhook_endpoints_service_insert ON public.webhook_endpoints
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY webhook_endpoints_service_update ON public.webhook_endpoints
    FOR UPDATE USING (auth.role() = 'service_role');

CREATE POLICY webhook_endpoints_service_delete ON public.webhook_endpoints
    FOR DELETE USING (auth.role() = 'service_role');

-- ============================================================================
-- WEBHOOK EVENTS POLICIES
-- ============================================================================

CREATE POLICY webhook_events_service_select ON public.webhook_events
    FOR SELECT USING (auth.role() = 'service_role');

CREATE POLICY webhook_events_service_insert ON public.webhook_events
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- WEBHOOK DELIVERIES POLICIES
-- ============================================================================

CREATE POLICY webhook_deliveries_service_select ON public.webhook_deliveries
    FOR SELECT USING (auth.role() = 'service_role');

CREATE POLICY webhook_deliveries_service_insert ON public.webhook_deliveries
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY webhook_deliveries_service_update ON public.webhook_deliveries
    FOR UPDATE USING (auth.role() = 'service_role');

-- ============================================================================
-- PROJECT CAPABILITIES POLICIES
-- ============================================================================

CREATE POLICY project_capabilities_service_select ON public.project_capabilities
    FOR SELECT USING (auth.role() = 'service_role');

CREATE POLICY project_capabilities_service_insert ON public.project_capabilities
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY project_capabilities_service_update ON public.project_capabilities
    FOR UPDATE USING (auth.role() = 'service_role');

CREATE POLICY project_capabilities_service_delete ON public.project_capabilities
    FOR DELETE USING (auth.role() = 'service_role');

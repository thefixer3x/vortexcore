-- Applied migration 20260212010745 (secure_gcp_facade_views), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.

-- Secure GCP facade views (these are SECURITY DEFINER, so grants are the security boundary)

-- 1. Revoke public access
REVOKE ALL ON public.gcp_service_account_keys FROM PUBLIC, anon;
REVOKE ALL ON public.gcp_service_status FROM PUBLIC, anon;
REVOKE ALL ON public.gcp_billing_alerts FROM PUBLIC, anon;
REVOKE ALL ON public.gcp_billing_history FROM PUBLIC, anon;
REVOKE ALL ON public.behavior_patterns FROM PUBLIC, anon;

-- 2. Grant access to service_role (for system operations)
GRANT SELECT ON public.gcp_service_account_keys TO service_role;
GRANT SELECT ON public.gcp_service_status TO service_role;
GRANT SELECT ON public.gcp_billing_alerts TO service_role;
GRANT SELECT ON public.gcp_billing_history TO service_role;
GRANT SELECT ON public.behavior_patterns TO service_role;

-- 3. Grant read access to authenticated users (adjust as needed for your use case)
-- If these views should be admin-only, remove these grants
GRANT SELECT ON public.gcp_service_account_keys TO authenticated;
GRANT SELECT ON public.gcp_service_status TO authenticated;
GRANT SELECT ON public.gcp_billing_alerts TO authenticated;
GRANT SELECT ON public.gcp_billing_history TO authenticated;
GRANT SELECT ON public.behavior_patterns TO authenticated;
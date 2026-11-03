-- Applied migration 20260108033650 (fix_project_capabilities_view_v2), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.


-- Fix pre-existing view to use SECURITY INVOKER with correct join
DROP VIEW IF EXISTS public.project_capabilities_with_tier CASCADE;

CREATE VIEW public.project_capabilities_with_tier 
WITH (security_invoker = true) AS
SELECT 
    pc.*,
    ct.display_name as tier_display_name,
    ct.daily_transfer_limit as tier_daily_transfer_limit,
    ct.monthly_volume_limit as tier_monthly_volume_limit,
    ct.requests_per_minute as tier_requests_per_minute
FROM public.project_capabilities pc
LEFT JOIN public.capability_tiers ct ON pc.tier = ct.tier_name;

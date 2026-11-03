-- Applied migration 20260108033615 (fix_view_security_invoker), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.


-- ============================================================================
-- FIX VIEWS TO USE SECURITY INVOKER (respects RLS of calling user)
-- ============================================================================

-- Drop and recreate verification views with SECURITY INVOKER
DROP VIEW IF EXISTS public.v_verification_records CASCADE;
DROP VIEW IF EXISTS public.v_verification_requests CASCADE;
DROP VIEW IF EXISTS public.v_identity_verifications CASCADE;
DROP VIEW IF EXISTS public.v_business_verifications CASCADE;
DROP VIEW IF EXISTS public.v_phone_verifications CASCADE;
DROP VIEW IF EXISTS public.v_address_verifications CASCADE;
DROP VIEW IF EXISTS public.v_biometric_verifications CASCADE;
DROP VIEW IF EXISTS public.v_background_checks CASCADE;
DROP VIEW IF EXISTS public.v_user_verification_status CASCADE;
DROP VIEW IF EXISTS public.v_verification_audit_log CASCADE;
DROP VIEW IF EXISTS public.v_verification_metrics CASCADE;
DROP VIEW IF EXISTS public.v_verification_requirements CASCADE;

-- Drop and recreate credit views with SECURITY INVOKER
DROP VIEW IF EXISTS public.v_credit_providers CASCADE;
DROP VIEW IF EXISTS public.v_credit_applications CASCADE;
DROP VIEW IF EXISTS public.v_credit_status_history CASCADE;
DROP VIEW IF EXISTS public.v_credit_bids CASCADE;
DROP VIEW IF EXISTS public.v_credit_scores CASCADE;
DROP VIEW IF EXISTS public.v_credit_transactions CASCADE;
DROP VIEW IF EXISTS public.v_credit_repayment_schedules CASCADE;
DROP VIEW IF EXISTS public.v_credit_limits CASCADE;

-- ============================================================================
-- RECREATE VERIFICATION VIEWS WITH SECURITY INVOKER
-- ============================================================================

CREATE VIEW public.v_verification_records 
WITH (security_invoker = true) AS
SELECT * FROM verification.verification_records;

CREATE VIEW public.v_verification_requests 
WITH (security_invoker = true) AS
SELECT * FROM verification.verification_requests;

CREATE VIEW public.v_identity_verifications 
WITH (security_invoker = true) AS
SELECT * FROM verification.identity_verifications;

CREATE VIEW public.v_business_verifications 
WITH (security_invoker = true) AS
SELECT * FROM verification.business_verifications;

CREATE VIEW public.v_phone_verifications 
WITH (security_invoker = true) AS
SELECT * FROM verification.phone_verifications;

CREATE VIEW public.v_address_verifications 
WITH (security_invoker = true) AS
SELECT * FROM verification.address_verifications;

CREATE VIEW public.v_biometric_verifications 
WITH (security_invoker = true) AS
SELECT * FROM verification.biometric_verifications;

CREATE VIEW public.v_background_checks 
WITH (security_invoker = true) AS
SELECT * FROM verification.background_checks;

CREATE VIEW public.v_user_verification_status 
WITH (security_invoker = true) AS
SELECT * FROM verification.user_verification_status;

CREATE VIEW public.v_verification_audit_log 
WITH (security_invoker = true) AS
SELECT * FROM verification.verification_audit_log;

CREATE VIEW public.v_verification_metrics 
WITH (security_invoker = true) AS
SELECT * FROM verification.verification_metrics;

CREATE VIEW public.v_verification_requirements 
WITH (security_invoker = true) AS
SELECT * FROM verification.verification_requirements;

-- ============================================================================
-- RECREATE CREDIT VIEWS WITH SECURITY INVOKER
-- ============================================================================

CREATE VIEW public.v_credit_providers 
WITH (security_invoker = true) AS
SELECT * FROM credit.providers;

CREATE VIEW public.v_credit_applications 
WITH (security_invoker = true) AS
SELECT * FROM credit.applications;

CREATE VIEW public.v_credit_status_history 
WITH (security_invoker = true) AS
SELECT * FROM credit.status_history;

CREATE VIEW public.v_credit_bids 
WITH (security_invoker = true) AS
SELECT * FROM credit.bids;

CREATE VIEW public.v_credit_scores 
WITH (security_invoker = true) AS
SELECT * FROM credit.credit_scores;

CREATE VIEW public.v_credit_transactions 
WITH (security_invoker = true) AS
SELECT * FROM credit.transactions;

CREATE VIEW public.v_credit_repayment_schedules 
WITH (security_invoker = true) AS
SELECT * FROM credit.repayment_schedules;

CREATE VIEW public.v_credit_limits 
WITH (security_invoker = true) AS
SELECT * FROM credit.credit_limits;

-- ============================================================================
-- ENABLE RLS ON capability_tiers
-- ============================================================================

ALTER TABLE public.capability_tiers ENABLE ROW LEVEL SECURITY;

-- Public read access for capability_tiers (reference data)
CREATE POLICY capability_tiers_public_read ON public.capability_tiers
    FOR SELECT USING (true);

CREATE POLICY capability_tiers_service_insert ON public.capability_tiers
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY capability_tiers_service_update ON public.capability_tiers
    FOR UPDATE USING (auth.role() = 'service_role');

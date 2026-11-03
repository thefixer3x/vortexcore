-- Applied migration 20260108033417 (enable_rls_verification_v2), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.


-- ============================================================================
-- ENABLE ROW LEVEL SECURITY ON VERIFICATION SCHEMA TABLES
-- ============================================================================

-- Enable RLS on all verification tables
ALTER TABLE verification.verification_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification.verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification.identity_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification.business_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification.phone_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification.address_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification.biometric_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification.background_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification.user_verification_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification.verification_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification.verification_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification.verification_requirements ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE RLS POLICIES FOR VERIFICATION TABLES
-- ============================================================================

-- verification_records: Users can SELECT their own records
CREATE POLICY verification_records_user_select ON verification.verification_records
    FOR SELECT USING (auth.uid() = user_id);

-- verification_records: Service role has full access
CREATE POLICY verification_records_service_select ON verification.verification_records
    FOR SELECT USING (auth.role() = 'service_role');

CREATE POLICY verification_records_service_insert ON verification.verification_records
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY verification_records_service_update ON verification.verification_records
    FOR UPDATE USING (auth.role() = 'service_role');

CREATE POLICY verification_records_service_delete ON verification.verification_records
    FOR DELETE USING (auth.role() = 'service_role');

-- user_verification_status: Users can SELECT their own status
CREATE POLICY user_verification_status_user_select ON verification.user_verification_status
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY user_verification_status_service_all ON verification.user_verification_status
    FOR SELECT USING (auth.role() = 'service_role');

CREATE POLICY user_verification_status_service_insert ON verification.user_verification_status
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY user_verification_status_service_update ON verification.user_verification_status
    FOR UPDATE USING (auth.role() = 'service_role');

-- verification_audit_log: Users can view their own audit logs
CREATE POLICY verification_audit_log_user_select ON verification.verification_audit_log
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY verification_audit_log_service_select ON verification.verification_audit_log
    FOR SELECT USING (auth.role() = 'service_role');

CREATE POLICY verification_audit_log_service_insert ON verification.verification_audit_log
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- verification_metrics: Read for authenticated, write for service
CREATE POLICY verification_metrics_read ON verification.verification_metrics
    FOR SELECT USING (true);

CREATE POLICY verification_metrics_service_insert ON verification.verification_metrics
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY verification_metrics_service_update ON verification.verification_metrics
    FOR UPDATE USING (auth.role() = 'service_role');

-- verification_requirements: Public read (reference data)
CREATE POLICY verification_requirements_public_read ON verification.verification_requirements
    FOR SELECT USING (true);

CREATE POLICY verification_requirements_service_insert ON verification.verification_requirements
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY verification_requirements_service_update ON verification.verification_requirements
    FOR UPDATE USING (auth.role() = 'service_role');

-- verification_requests: Service role only
CREATE POLICY verification_requests_service_select ON verification.verification_requests
    FOR SELECT USING (auth.role() = 'service_role');

CREATE POLICY verification_requests_service_insert ON verification.verification_requests
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY verification_requests_service_update ON verification.verification_requests
    FOR UPDATE USING (auth.role() = 'service_role');

-- Child tables: Service role access (data accessed via parent joins)
-- identity_verifications
CREATE POLICY identity_verifications_service_select ON verification.identity_verifications
    FOR SELECT USING (auth.role() = 'service_role');

CREATE POLICY identity_verifications_service_insert ON verification.identity_verifications
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- business_verifications
CREATE POLICY business_verifications_service_select ON verification.business_verifications
    FOR SELECT USING (auth.role() = 'service_role');

CREATE POLICY business_verifications_service_insert ON verification.business_verifications
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- phone_verifications
CREATE POLICY phone_verifications_service_select ON verification.phone_verifications
    FOR SELECT USING (auth.role() = 'service_role');

CREATE POLICY phone_verifications_service_insert ON verification.phone_verifications
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- address_verifications
CREATE POLICY address_verifications_service_select ON verification.address_verifications
    FOR SELECT USING (auth.role() = 'service_role');

CREATE POLICY address_verifications_service_insert ON verification.address_verifications
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- biometric_verifications
CREATE POLICY biometric_verifications_service_select ON verification.biometric_verifications
    FOR SELECT USING (auth.role() = 'service_role');

CREATE POLICY biometric_verifications_service_insert ON verification.biometric_verifications
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- background_checks
CREATE POLICY background_checks_service_select ON verification.background_checks
    FOR SELECT USING (auth.role() = 'service_role');

CREATE POLICY background_checks_service_insert ON verification.background_checks
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

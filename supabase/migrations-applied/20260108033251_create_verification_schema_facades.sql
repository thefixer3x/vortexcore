-- Applied migration 20260108033251 (create_verification_schema_facades), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.


-- ============================================================================
-- PUBLIC SCHEMA FACADES FOR VERIFICATION SCHEMA
-- Read-only views that expose verification tables through public schema
-- References source ENUM types directly (no duplication)
-- ============================================================================

-- Verification Records View (main verification records)
CREATE OR REPLACE VIEW public.v_verification_records AS
SELECT 
    id,
    user_id,
    project_id,
    verification_type,
    service_category,
    country_code,
    status,
    request_id,
    provider_request_id,
    request_data,
    response_data,
    confidence_score,
    created_at,
    completed_at,
    expires_at,
    error_code,
    error_message,
    retry_count,
    ip_address,
    user_agent,
    reference_number,
    metadata
FROM verification.verification_records;

COMMENT ON VIEW public.v_verification_records IS 'Public facade for verification.verification_records - Core verification records';

-- Verification Requests View
CREATE OR REPLACE VIEW public.v_verification_requests AS
SELECT 
    id,
    country,
    endpoint,
    request_payload,
    response_payload,
    status,
    created_at,
    updated_at
FROM verification.verification_requests;

COMMENT ON VIEW public.v_verification_requests IS 'Public facade for verification.verification_requests';

-- Identity Verifications View (BVN, NIN, Passport, etc.)
CREATE OR REPLACE VIEW public.v_identity_verifications AS
SELECT 
    id,
    verification_record_id,
    document_type,
    document_number,
    document_image_url,
    first_name,
    last_name,
    middle_name,
    date_of_birth,
    gender,
    nationality,
    issuing_authority,
    issue_date,
    expiry_date,
    place_of_birth,
    phone_number,
    email,
    address,
    photo_url,
    document_valid,
    person_exists,
    data_match_score,
    face_match_score,
    created_at
FROM verification.identity_verifications;

COMMENT ON VIEW public.v_identity_verifications IS 'Public facade for verification.identity_verifications - BVN, NIN, Passport, etc.';

-- Business Verifications View (CAC, TIN)
CREATE OR REPLACE VIEW public.v_business_verifications AS
SELECT 
    id,
    verification_record_id,
    business_type,
    business_name,
    registration_number,
    tax_id,
    incorporation_date,
    business_address,
    phone_number,
    email_address,
    website_url,
    registrar,
    business_status,
    industry_code,
    business_exists,
    registration_valid,
    status_active,
    directors,
    directors_verified,
    shareholders,
    created_at
FROM verification.business_verifications;

COMMENT ON VIEW public.v_business_verifications IS 'Public facade for verification.business_verifications - CAC, TIN';

-- Phone Verifications View (OTP, SMS)
CREATE OR REPLACE VIEW public.v_phone_verifications AS
SELECT 
    id,
    verification_record_id,
    phone_number,
    country_code,
    verification_method,
    verification_code,
    code_sent_at,
    code_verified_at,
    code_expires_at,
    attempts_count,
    max_attempts,
    carrier_name,
    line_type,
    is_mobile,
    is_ported,
    is_active,
    is_valid,
    created_at
FROM verification.phone_verifications;

COMMENT ON VIEW public.v_phone_verifications IS 'Public facade for verification.phone_verifications - OTP, SMS verification';

-- Address Verifications View
CREATE OR REPLACE VIEW public.v_address_verifications AS
SELECT 
    id,
    verification_record_id,
    verification_type,
    full_address,
    street_address,
    city,
    state_province,
    postal_code,
    country,
    lga,
    document_url,
    document_date,
    issuer,
    address_valid,
    document_authentic,
    resident_confirmed,
    geo_coordinates,
    created_at
FROM verification.address_verifications;

COMMENT ON VIEW public.v_address_verifications IS 'Public facade for verification.address_verifications';

-- Biometric Verifications View (Face match, Liveness)
CREATE OR REPLACE VIEW public.v_biometric_verifications AS
SELECT 
    id,
    verification_record_id,
    biometric_type,
    reference_image_url,
    verification_image_url,
    biometric_template,
    match_score,
    liveness_score,
    quality_score,
    is_match,
    is_live,
    template_encrypted,
    metadata,
    created_at
FROM verification.biometric_verifications;

COMMENT ON VIEW public.v_biometric_verifications IS 'Public facade for verification.biometric_verifications - Face match, Liveness';

-- Background Checks View
CREATE OR REPLACE VIEW public.v_background_checks AS
SELECT 
    id,
    verification_record_id,
    check_type,
    search_criteria,
    data_sources,
    coverage_period_months,
    records_found,
    risk_level,
    summary_report,
    detailed_report,
    is_clean,
    flags,
    created_at
FROM verification.background_checks;

COMMENT ON VIEW public.v_background_checks IS 'Public facade for verification.background_checks';

-- User Verification Status View (aggregated status per user)
CREATE OR REPLACE VIEW public.v_user_verification_status AS
SELECT 
    id,
    user_id,
    project_id,
    identity_verified,
    identity_verification_id,
    business_verified,
    business_verification_id,
    phone_verified,
    phone_verification_id,
    address_verified,
    address_verification_id,
    biometric_verified,
    biometric_verification_id,
    background_check_passed,
    background_check_id,
    verification_level,
    trust_score,
    last_verification_date,
    verification_expires_at,
    created_at,
    updated_at
FROM verification.user_verification_status;

COMMENT ON VIEW public.v_user_verification_status IS 'Public facade for verification.user_verification_status - Aggregated user verification status';

-- Verification Audit Log View
CREATE OR REPLACE VIEW public.v_verification_audit_log AS
SELECT 
    id,
    verification_record_id,
    user_id,
    action,
    old_status,
    new_status,
    details,
    ip_address,
    user_agent,
    created_at
FROM verification.verification_audit_log;

COMMENT ON VIEW public.v_verification_audit_log IS 'Public facade for verification.verification_audit_log';

-- Verification Metrics View (analytics)
CREATE OR REPLACE VIEW public.v_verification_metrics AS
SELECT 
    id,
    date_recorded,
    country_code,
    verification_type,
    service_category,
    total_attempts,
    successful_verifications,
    failed_verifications,
    pending_verifications,
    average_response_time_ms,
    average_confidence_score,
    created_at
FROM verification.verification_metrics;

COMMENT ON VIEW public.v_verification_metrics IS 'Public facade for verification.verification_metrics - Analytics';

-- Verification Requirements View (country requirements)
CREATE OR REPLACE VIEW public.v_verification_requirements AS
SELECT 
    id,
    country_code,
    verification_type,
    service_category,
    is_required,
    is_available,
    minimum_age,
    required_documents,
    optional_documents,
    estimated_processing_time_seconds,
    cost_ngn,
    cost_usd,
    confidence_threshold,
    provider_name,
    provider_endpoint,
    created_at,
    updated_at
FROM verification.verification_requirements;

COMMENT ON VIEW public.v_verification_requirements IS 'Public facade for verification.verification_requirements - Country requirements';

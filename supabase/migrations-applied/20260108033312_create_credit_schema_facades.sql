-- Applied migration 20260108033312 (create_credit_schema_facades), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.


-- ============================================================================
-- PUBLIC SCHEMA FACADES FOR CREDIT SCHEMA
-- Read-only views that expose credit tables through public schema
-- ============================================================================

-- Credit Providers View
CREATE OR REPLACE VIEW public.v_credit_providers AS
SELECT 
    id,
    provider_code,
    company_name,
    registration_number,
    contact_email,
    contact_phone,
    address,
    minimum_loan_amount,
    maximum_loan_amount,
    supported_currencies,
    interest_rate_range,
    processing_fee_percentage,
    api_endpoint,
    webhook_url,
    status,
    metadata,
    created_at,
    updated_at
FROM credit.providers;

COMMENT ON VIEW public.v_credit_providers IS 'Public facade for credit.providers - Lending providers/partners';

-- Credit Applications View
CREATE OR REPLACE VIEW public.v_credit_applications AS
SELECT 
    id,
    user_id,
    business_id,
    amount_requested,
    currency,
    purpose,
    loan_term_months,
    status,
    metadata,
    created_at,
    updated_at
FROM credit.applications;

COMMENT ON VIEW public.v_credit_applications IS 'Public facade for credit.applications - Loan applications';

-- Credit Application Status History View
CREATE OR REPLACE VIEW public.v_credit_status_history AS
SELECT 
    id,
    application_id,
    old_status,
    new_status,
    changed_by,
    notes,
    created_at
FROM credit.status_history;

COMMENT ON VIEW public.v_credit_status_history IS 'Public facade for credit.status_history - Application status changes';

-- Credit Bids View (provider offers)
CREATE OR REPLACE VIEW public.v_credit_bids AS
SELECT 
    id,
    application_id,
    provider_id,
    offered_amount,
    interest_rate,
    loan_term_months,
    processing_fee,
    total_repayment,
    monthly_repayment,
    special_conditions,
    valid_until,
    status,
    created_at,
    updated_at
FROM credit.bids;

COMMENT ON VIEW public.v_credit_bids IS 'Public facade for credit.bids - Provider loan offers';

-- Credit Scores View
CREATE OR REPLACE VIEW public.v_credit_scores AS
SELECT 
    id,
    user_id,
    business_id,
    score,
    bureau,
    report_data,
    created_at
FROM credit.credit_scores;

COMMENT ON VIEW public.v_credit_scores IS 'Public facade for credit.credit_scores - Credit bureau scores';

-- Credit Transactions View (disbursements, repayments)
CREATE OR REPLACE VIEW public.v_credit_transactions AS
SELECT 
    id,
    bid_id,
    application_id,
    provider_id,
    transaction_type,
    amount,
    currency,
    payment_method,
    reference_number,
    status,
    metadata,
    created_at,
    processed_at
FROM credit.transactions;

COMMENT ON VIEW public.v_credit_transactions IS 'Public facade for credit.transactions - Disbursements and repayments';

-- Repayment Schedules View
CREATE OR REPLACE VIEW public.v_credit_repayment_schedules AS
SELECT 
    id,
    bid_id,
    application_id,
    installment_number,
    due_date,
    principal_amount,
    interest_amount,
    total_amount,
    paid_amount,
    outstanding_amount,
    status,
    paid_at,
    days_overdue,
    penalty_amount,
    created_at,
    updated_at
FROM credit.repayment_schedules;

COMMENT ON VIEW public.v_credit_repayment_schedules IS 'Public facade for credit.repayment_schedules - Loan installments';

-- Credit Limits View
CREATE OR REPLACE VIEW public.v_credit_limits AS
SELECT 
    id,
    user_id,
    business_id,
    project_id,
    total_limit,
    available_limit,
    used_limit,
    currency,
    limit_type,
    valid_from,
    valid_until,
    status,
    created_at,
    updated_at
FROM credit.credit_limits;

COMMENT ON VIEW public.v_credit_limits IS 'Public facade for credit.credit_limits - Pre-approved credit limits';

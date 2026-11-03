-- Applied migration 20260108033441 (enable_rls_credit_schema), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.


-- ============================================================================
-- ENABLE ROW LEVEL SECURITY ON CREDIT SCHEMA TABLES
-- ============================================================================

-- Enable RLS on all credit tables
ALTER TABLE credit.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit.status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit.bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit.credit_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit.repayment_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit.credit_limits ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE RLS POLICIES FOR CREDIT TABLES
-- ============================================================================

-- credit.providers: Public read (marketplace data)
CREATE POLICY credit_providers_public_read ON credit.providers
    FOR SELECT USING (status = 'active');

CREATE POLICY credit_providers_service_all ON credit.providers
    FOR SELECT USING (auth.role() = 'service_role');

CREATE POLICY credit_providers_service_insert ON credit.providers
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY credit_providers_service_update ON credit.providers
    FOR UPDATE USING (auth.role() = 'service_role');

-- credit.applications: Users can view their own applications
CREATE POLICY credit_applications_user_select ON credit.applications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY credit_applications_user_insert ON credit.applications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY credit_applications_service_select ON credit.applications
    FOR SELECT USING (auth.role() = 'service_role');

CREATE POLICY credit_applications_service_insert ON credit.applications
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY credit_applications_service_update ON credit.applications
    FOR UPDATE USING (auth.role() = 'service_role');

-- credit.status_history: Users can view history for their applications
CREATE POLICY credit_status_history_user_select ON credit.status_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM credit.applications a
            WHERE a.id = application_id AND a.user_id = auth.uid()
        )
    );

CREATE POLICY credit_status_history_service_select ON credit.status_history
    FOR SELECT USING (auth.role() = 'service_role');

CREATE POLICY credit_status_history_service_insert ON credit.status_history
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- credit.bids: Users can view bids on their applications
CREATE POLICY credit_bids_user_select ON credit.bids
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM credit.applications a
            WHERE a.id = application_id AND a.user_id = auth.uid()
        )
    );

CREATE POLICY credit_bids_service_select ON credit.bids
    FOR SELECT USING (auth.role() = 'service_role');

CREATE POLICY credit_bids_service_insert ON credit.bids
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY credit_bids_service_update ON credit.bids
    FOR UPDATE USING (auth.role() = 'service_role');

-- credit.credit_scores: Users can view their own scores
CREATE POLICY credit_scores_user_select ON credit.credit_scores
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY credit_scores_service_select ON credit.credit_scores
    FOR SELECT USING (auth.role() = 'service_role');

CREATE POLICY credit_scores_service_insert ON credit.credit_scores
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- credit.transactions: Users can view transactions for their applications
CREATE POLICY credit_transactions_user_select ON credit.transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM credit.applications a
            WHERE a.id = application_id AND a.user_id = auth.uid()
        )
    );

CREATE POLICY credit_transactions_service_select ON credit.transactions
    FOR SELECT USING (auth.role() = 'service_role');

CREATE POLICY credit_transactions_service_insert ON credit.transactions
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY credit_transactions_service_update ON credit.transactions
    FOR UPDATE USING (auth.role() = 'service_role');

-- credit.repayment_schedules: Users can view their repayment schedules
CREATE POLICY credit_repayment_schedules_user_select ON credit.repayment_schedules
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM credit.applications a
            WHERE a.id = application_id AND a.user_id = auth.uid()
        )
    );

CREATE POLICY credit_repayment_schedules_service_select ON credit.repayment_schedules
    FOR SELECT USING (auth.role() = 'service_role');

CREATE POLICY credit_repayment_schedules_service_insert ON credit.repayment_schedules
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY credit_repayment_schedules_service_update ON credit.repayment_schedules
    FOR UPDATE USING (auth.role() = 'service_role');

-- credit.credit_limits: Users can view their own limits
CREATE POLICY credit_limits_user_select ON credit.credit_limits
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY credit_limits_service_select ON credit.credit_limits
    FOR SELECT USING (auth.role() = 'service_role');

CREATE POLICY credit_limits_service_insert ON credit.credit_limits
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY credit_limits_service_update ON credit.credit_limits
    FOR UPDATE USING (auth.role() = 'service_role');

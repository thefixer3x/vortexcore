-- Applied migration 20260108042539 (grant_facade_view_permissions), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.


-- ============================================================================
-- GRANT PERMISSIONS ON PUBLIC FACADE VIEWS
-- Allows anon and authenticated users to access views (RLS still enforced)
-- ============================================================================

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT USAGE ON SCHEMA verification TO anon, authenticated;
GRANT USAGE ON SCHEMA credit TO anon, authenticated;

-- Grant SELECT on all verification facade views
GRANT SELECT ON
  public.v_verification_records,
  public.v_verification_requests,
  public.v_identity_verifications,
  public.v_business_verifications,
  public.v_phone_verifications,
  public.v_address_verifications,
  public.v_biometric_verifications,
  public.v_background_checks,
  public.v_user_verification_status,
  public.v_verification_audit_log,
  public.v_verification_metrics,
  public.v_verification_requirements
TO anon, authenticated;

-- Grant SELECT on all credit facade views
GRANT SELECT ON
  public.v_credit_providers,
  public.v_credit_applications,
  public.v_credit_status_history,
  public.v_credit_bids,
  public.v_credit_scores,
  public.v_credit_transactions,
  public.v_credit_repayment_schedules,
  public.v_credit_limits
TO anon, authenticated;

-- Grant SELECT on provider/webhook tables (accessed via service role primarily)
GRANT SELECT ON
  public.provider_accounts,
  public.provider_references,
  public.webhook_endpoints,
  public.webhook_events,
  public.webhook_deliveries,
  public.project_capabilities,
  public.capability_tiers
TO anon, authenticated;

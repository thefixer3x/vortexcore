-- Applied migration 20260108032904 (create_credit_bids_table), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.

-- Credit bids from providers
CREATE TABLE IF NOT EXISTS credit.bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES credit.applications(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES credit.providers(id) ON DELETE CASCADE,
  offered_amount NUMERIC(15, 2) NOT NULL,
  interest_rate NUMERIC(5, 2) NOT NULL,
  loan_term_months INTEGER NOT NULL,
  processing_fee NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_repayment NUMERIC(15, 2) NOT NULL,
  monthly_repayment NUMERIC(15, 2) NOT NULL,
  special_conditions JSONB DEFAULT '{}',
  valid_until TIMESTAMPTZ NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' NOT NULL,
  accepted_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT check_bid_amount CHECK (offered_amount > 0),
  CONSTRAINT check_bid_interest CHECK (interest_rate >= 0),
  CONSTRAINT check_bid_status CHECK (status IN ('pending', 'accepted', 'rejected', 'expired', 'withdrawn'))
);

CREATE INDEX IF NOT EXISTS idx_credit_bids_application ON credit.bids(application_id);
CREATE INDEX IF NOT EXISTS idx_credit_bids_provider ON credit.bids(provider_id);
CREATE INDEX IF NOT EXISTS idx_credit_bids_status ON credit.bids(status);
CREATE INDEX IF NOT EXISTS idx_credit_bids_valid_until ON credit.bids(valid_until);
-- Applied migration 20260108032906 (create_credit_repayment_schedule), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.

-- Repayment schedules
CREATE TABLE IF NOT EXISTS credit.repayment_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bid_id UUID NOT NULL REFERENCES credit.bids(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES credit.applications(id) ON DELETE CASCADE,
  installment_number INTEGER NOT NULL,
  due_date DATE NOT NULL,
  principal_amount NUMERIC(15, 2) NOT NULL,
  interest_amount NUMERIC(15, 2) NOT NULL,
  total_amount NUMERIC(15, 2) NOT NULL,
  paid_amount NUMERIC(15, 2) DEFAULT 0,
  outstanding_amount NUMERIC(15, 2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
  status VARCHAR(50) DEFAULT 'pending' NOT NULL,
  paid_at TIMESTAMPTZ,
  days_overdue INTEGER DEFAULT 0,
  penalty_amount NUMERIC(15, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT check_schedule_status CHECK (status IN ('pending', 'partial', 'paid', 'overdue', 'waived'))
);

CREATE INDEX IF NOT EXISTS idx_repayment_schedule_bid ON credit.repayment_schedules(bid_id);
CREATE INDEX IF NOT EXISTS idx_repayment_schedule_app ON credit.repayment_schedules(application_id);
CREATE INDEX IF NOT EXISTS idx_repayment_schedule_due ON credit.repayment_schedules(due_date);
CREATE INDEX IF NOT EXISTS idx_repayment_schedule_status ON credit.repayment_schedules(status);

-- Credit limits per user/business
CREATE TABLE IF NOT EXISTS credit.credit_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  business_id UUID,
  project_id UUID,
  total_limit NUMERIC(15, 2) NOT NULL,
  available_limit NUMERIC(15, 2) NOT NULL,
  used_limit NUMERIC(15, 2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'NGN',
  limit_type VARCHAR(50) DEFAULT 'personal',
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT check_limit_entity CHECK (user_id IS NOT NULL OR business_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_credit_limits_user ON credit.credit_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_limits_business ON credit.credit_limits(business_id);
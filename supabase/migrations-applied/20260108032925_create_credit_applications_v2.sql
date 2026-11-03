-- Applied migration 20260108032925 (create_credit_applications_v2), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.

-- Credit applications (fixed)
CREATE TABLE IF NOT EXISTS credit.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  project_id UUID,
  business_id UUID,
  amount_requested NUMERIC(15, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'NGN',
  purpose TEXT NOT NULL,
  loan_term_months INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' NOT NULL,
  risk_score INTEGER,
  credit_score INTEGER,
  decision VARCHAR(50),
  decision_reason TEXT,
  approved_amount NUMERIC(15, 2),
  approved_rate NUMERIC(5, 2),
  disbursed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_applications_user ON credit.applications(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_applications_status ON credit.applications(status);
CREATE INDEX IF NOT EXISTS idx_credit_applications_created ON credit.applications(created_at DESC);

-- Application status history
CREATE TABLE IF NOT EXISTS credit.status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES credit.applications(id) ON DELETE CASCADE,
  old_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  changed_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_status_history_app ON credit.status_history(application_id);
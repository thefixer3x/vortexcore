-- Applied migration 20260108032926 (create_credit_transactions_v2), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.

-- Credit transactions (if not exists)
CREATE TABLE IF NOT EXISTS credit.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bid_id UUID REFERENCES credit.bids(id),
  application_id UUID NOT NULL REFERENCES credit.applications(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES credit.providers(id),
  transaction_type VARCHAR(50) NOT NULL,
  amount NUMERIC(15, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'NGN',
  payment_method VARCHAR(100),
  payment_channel VARCHAR(100),
  reference_number VARCHAR(200) UNIQUE,
  provider_reference VARCHAR(200),
  status VARCHAR(50) DEFAULT 'pending' NOT NULL,
  failure_reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_application ON credit.transactions(application_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_provider ON credit.transactions(provider_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_reference ON credit.transactions(reference_number);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_status ON credit.transactions(status);
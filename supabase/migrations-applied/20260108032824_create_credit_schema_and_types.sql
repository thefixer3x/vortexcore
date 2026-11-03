-- Applied migration 20260108032824 (create_credit_schema_and_types), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.

-- Credit-as-a-Service Schema
CREATE SCHEMA IF NOT EXISTS credit;

-- Credit providers (lenders)
CREATE TABLE IF NOT EXISTS credit.providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_code VARCHAR(50) NOT NULL UNIQUE,
  company_name VARCHAR(200) NOT NULL,
  registration_number VARCHAR(100),
  contact_email VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(50),
  address JSONB NOT NULL DEFAULT '{}',
  minimum_loan_amount NUMERIC(15, 2) NOT NULL,
  maximum_loan_amount NUMERIC(15, 2) NOT NULL,
  supported_currencies TEXT[] DEFAULT ARRAY['NGN'],
  interest_rate_range JSONB NOT NULL DEFAULT '{"min": 0, "max": 100}',
  processing_fee_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0,
  api_endpoint VARCHAR(500),
  webhook_url VARCHAR(500),
  api_credentials JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'pending_verification' NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT check_loan_amounts CHECK (maximum_loan_amount > minimum_loan_amount),
  CONSTRAINT check_provider_status CHECK (status IN ('pending_verification', 'active', 'suspended', 'inactive'))
);

CREATE INDEX IF NOT EXISTS idx_credit_providers_code ON credit.providers(provider_code);
CREATE INDEX IF NOT EXISTS idx_credit_providers_status ON credit.providers(status);
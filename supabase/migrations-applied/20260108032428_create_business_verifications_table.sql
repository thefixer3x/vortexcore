-- Applied migration 20260108032428 (create_business_verifications_table), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.

-- Business verifications (CAC, TIN, etc.)
CREATE TABLE IF NOT EXISTS verification.business_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_record_id UUID REFERENCES verification.verification_records(id) ON DELETE CASCADE,
  business_type verification.business_type NOT NULL,
  business_name VARCHAR(255),
  registration_number VARCHAR(100),
  tax_id VARCHAR(100),
  incorporation_date DATE,
  business_address TEXT,
  phone_number VARCHAR(20),
  email_address VARCHAR(255),
  website_url TEXT,
  registrar VARCHAR(200),
  business_status VARCHAR(100),
  industry_code VARCHAR(50),
  business_exists BOOLEAN,
  registration_valid BOOLEAN,
  status_active BOOLEAN,
  directors JSONB,  -- Array of directors info
  directors_verified BOOLEAN,
  shareholders JSONB,  -- Array of shareholders
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_business_verifications_record_id ON verification.business_verifications(verification_record_id);
CREATE INDEX IF NOT EXISTS idx_business_verifications_reg_number ON verification.business_verifications(registration_number);
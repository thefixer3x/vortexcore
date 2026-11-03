-- Applied migration 20260108032356 (create_verification_records_table), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.

-- Main verification records table
CREATE TABLE IF NOT EXISTS verification.verification_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,  -- References auth.users if needed
  project_id UUID,  -- For multi-tenant support
  verification_type verification.verification_type NOT NULL,
  service_category VARCHAR(100) NOT NULL,
  country_code VARCHAR(3) NOT NULL,
  status verification.verification_status DEFAULT 'pending',
  request_id VARCHAR(255) NOT NULL UNIQUE,
  provider_request_id VARCHAR(255),  -- External provider reference (e.g., Prembly)
  request_data JSONB NOT NULL,
  response_data JSONB,
  confidence_score NUMERIC(5, 4),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  error_code VARCHAR(50),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  ip_address INET,
  user_agent TEXT,
  reference_number VARCHAR(100),
  metadata JSONB DEFAULT '{}'
);

-- Indexes for verification_records
CREATE INDEX IF NOT EXISTS idx_verification_records_user_id ON verification.verification_records(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_records_project_id ON verification.verification_records(project_id);
CREATE INDEX IF NOT EXISTS idx_verification_records_type ON verification.verification_records(verification_type);
CREATE INDEX IF NOT EXISTS idx_verification_records_status ON verification.verification_records(status);
CREATE INDEX IF NOT EXISTS idx_verification_records_country ON verification.verification_records(country_code);
CREATE INDEX IF NOT EXISTS idx_verification_records_created_at ON verification.verification_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_verification_records_request_id ON verification.verification_records(request_id);

-- Simple verification requests table (for quick lookups)
CREATE TABLE IF NOT EXISTS verification.verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country VARCHAR(3) NOT NULL,
  endpoint VARCHAR(100) NOT NULL,
  request_payload JSONB NOT NULL,
  response_payload JSONB,
  status VARCHAR(20) DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verification_requests_country ON verification.verification_requests(country);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON verification.verification_requests(status);
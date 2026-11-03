-- Applied migration 20260108032502 (create_verification_metrics_and_requirements), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.

-- Verification metrics for analytics
CREATE TABLE IF NOT EXISTS verification.verification_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date_recorded DATE DEFAULT CURRENT_DATE,
  country_code VARCHAR(3) NOT NULL,
  verification_type VARCHAR(50) NOT NULL,
  service_category VARCHAR(50) NOT NULL,
  total_attempts INTEGER DEFAULT 0,
  successful_verifications INTEGER DEFAULT 0,
  failed_verifications INTEGER DEFAULT 0,
  pending_verifications INTEGER DEFAULT 0,
  average_response_time_ms INTEGER DEFAULT 0,
  average_confidence_score NUMERIC(5, 4) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date_recorded, country_code, verification_type, service_category)
);

CREATE INDEX IF NOT EXISTS idx_verification_metrics_date ON verification.verification_metrics(date_recorded DESC);
CREATE INDEX IF NOT EXISTS idx_verification_metrics_country ON verification.verification_metrics(country_code);

-- Verification requirements per country/type
CREATE TABLE IF NOT EXISTS verification.verification_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code VARCHAR(3) NOT NULL,
  verification_type VARCHAR(50) NOT NULL,
  service_category VARCHAR(50) NOT NULL,
  is_required BOOLEAN DEFAULT FALSE,
  is_available BOOLEAN DEFAULT TRUE,
  minimum_age INTEGER DEFAULT 18,
  required_documents TEXT[],
  optional_documents TEXT[],
  estimated_processing_time_seconds INTEGER,
  cost_ngn NUMERIC(10, 2),
  cost_usd NUMERIC(10, 2),
  confidence_threshold NUMERIC(5, 4) DEFAULT 0.80,
  provider_name VARCHAR(100),
  provider_endpoint VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(country_code, verification_type, service_category)
);

CREATE INDEX IF NOT EXISTS idx_verification_requirements_country ON verification.verification_requirements(country_code);

-- Insert default Nigerian verification requirements
INSERT INTO verification.verification_requirements (country_code, verification_type, service_category, is_required, is_available, provider_name)
VALUES
  ('NG', 'identity', 'bvn', TRUE, TRUE, 'prembly'),
  ('NG', 'identity', 'nin', TRUE, TRUE, 'prembly'),
  ('NG', 'identity', 'passport', FALSE, TRUE, 'prembly'),
  ('NG', 'identity', 'drivers_license', FALSE, TRUE, 'prembly'),
  ('NG', 'identity', 'voters_card', FALSE, TRUE, 'prembly'),
  ('NG', 'phone', 'otp', TRUE, TRUE, 'termii'),
  ('NG', 'business', 'cac', FALSE, TRUE, 'prembly'),
  ('NG', 'business', 'tin', FALSE, TRUE, 'prembly'),
  ('NG', 'address', 'utility_bill', FALSE, TRUE, 'prembly'),
  ('NG', 'biometric', 'face_match', FALSE, TRUE, 'prembly'),
  ('NG', 'biometric', 'liveness_check', FALSE, TRUE, 'prembly')
ON CONFLICT (country_code, verification_type, service_category) DO NOTHING;
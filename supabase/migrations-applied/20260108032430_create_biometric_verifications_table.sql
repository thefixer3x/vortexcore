-- Applied migration 20260108032430 (create_biometric_verifications_table), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.

-- Biometric verifications (face match, liveness)
CREATE TABLE IF NOT EXISTS verification.biometric_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_record_id UUID REFERENCES verification.verification_records(id) ON DELETE CASCADE,
  biometric_type verification.biometric_type NOT NULL,
  reference_image_url TEXT,
  verification_image_url TEXT,
  biometric_template TEXT,  -- Encrypted template
  match_score NUMERIC(5, 4),
  liveness_score NUMERIC(5, 4),
  quality_score NUMERIC(5, 4),
  is_match BOOLEAN,
  is_live BOOLEAN,
  template_encrypted BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_biometric_verifications_record_id ON verification.biometric_verifications(verification_record_id);

-- Background checks
CREATE TABLE IF NOT EXISTS verification.background_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_record_id UUID REFERENCES verification.verification_records(id) ON DELETE CASCADE,
  check_type verification.background_check_type NOT NULL,
  search_criteria JSONB,
  data_sources TEXT[],
  coverage_period_months INTEGER,
  records_found INTEGER DEFAULT 0,
  risk_level VARCHAR(20),
  summary_report TEXT,
  detailed_report JSONB,
  is_clean BOOLEAN,
  flags JSONB,  -- Any warning flags
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_background_checks_record_id ON verification.background_checks(verification_record_id);
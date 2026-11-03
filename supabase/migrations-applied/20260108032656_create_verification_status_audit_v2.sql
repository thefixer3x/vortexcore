-- Applied migration 20260108032656 (create_verification_status_audit_v2), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.

-- User verification status (if not exists)
CREATE TABLE IF NOT EXISTS verification.user_verification_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  project_id UUID,
  identity_verified BOOLEAN DEFAULT FALSE,
  identity_verification_id UUID,
  business_verified BOOLEAN DEFAULT FALSE,
  business_verification_id UUID,
  phone_verified BOOLEAN DEFAULT FALSE,
  phone_verification_id UUID,
  address_verified BOOLEAN DEFAULT FALSE,
  address_verification_id UUID,
  biometric_verified BOOLEAN DEFAULT FALSE,
  biometric_verification_id UUID,
  background_check_passed BOOLEAN DEFAULT FALSE,
  background_check_id UUID,
  verification_level INTEGER DEFAULT 0,
  trust_score NUMERIC(5, 4) DEFAULT 0.0000,
  last_verification_date TIMESTAMPTZ,
  verification_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, project_id)
);

CREATE INDEX IF NOT EXISTS idx_user_verification_status_user_id ON verification.user_verification_status(user_id);
CREATE INDEX IF NOT EXISTS idx_user_verification_status_project_id ON verification.user_verification_status(project_id);

-- Verification audit log (if not exists)
CREATE TABLE IF NOT EXISTS verification.verification_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_record_id UUID REFERENCES verification.verification_records(id) ON DELETE CASCADE,
  user_id UUID,
  action VARCHAR(100) NOT NULL,
  old_status VARCHAR(50),
  new_status VARCHAR(50),
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verification_audit_log_record_id ON verification.verification_audit_log(verification_record_id);
CREATE INDEX IF NOT EXISTS idx_verification_audit_log_user_id ON verification.verification_audit_log(user_id);
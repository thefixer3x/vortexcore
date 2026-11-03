-- Applied migration 20260108032501 (create_phone_verifications_v2), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.

-- Phone verifications (if not already created)
CREATE TABLE IF NOT EXISTS verification.phone_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_record_id UUID REFERENCES verification.verification_records(id) ON DELETE CASCADE,
  phone_number VARCHAR(20) NOT NULL,
  country_code VARCHAR(5),
  verification_method verification.phone_verification_method NOT NULL,
  verification_code VARCHAR(10),
  code_sent_at TIMESTAMPTZ,
  code_verified_at TIMESTAMPTZ,
  code_expires_at TIMESTAMPTZ,
  attempts_count INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  carrier_name VARCHAR(100),
  line_type VARCHAR(50),
  is_mobile BOOLEAN,
  is_ported BOOLEAN,
  is_active BOOLEAN,
  is_valid BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_phone_verifications_record_id ON verification.phone_verifications(verification_record_id);
CREATE INDEX IF NOT EXISTS idx_phone_verifications_phone ON verification.phone_verifications(phone_number);
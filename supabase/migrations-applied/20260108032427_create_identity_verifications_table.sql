-- Applied migration 20260108032427 (create_identity_verifications_table), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.

-- Identity verifications (BVN, NIN, Passport, etc.)
CREATE TABLE IF NOT EXISTS verification.identity_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_record_id UUID REFERENCES verification.verification_records(id) ON DELETE CASCADE,
  document_type verification.identity_document_type NOT NULL,
  document_number VARCHAR(100),
  document_image_url TEXT,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  middle_name VARCHAR(100),
  date_of_birth DATE,
  gender VARCHAR(20),
  nationality VARCHAR(100),
  issuing_authority VARCHAR(200),
  issue_date DATE,
  expiry_date DATE,
  place_of_birth VARCHAR(200),
  phone_number VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  photo_url TEXT,
  document_valid BOOLEAN,
  person_exists BOOLEAN,
  data_match_score NUMERIC(5, 4),
  face_match_score NUMERIC(5, 4),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_identity_verifications_record_id ON verification.identity_verifications(verification_record_id);
CREATE INDEX IF NOT EXISTS idx_identity_verifications_document_type ON verification.identity_verifications(document_type);
CREATE INDEX IF NOT EXISTS idx_identity_verifications_document_number ON verification.identity_verifications(document_number);
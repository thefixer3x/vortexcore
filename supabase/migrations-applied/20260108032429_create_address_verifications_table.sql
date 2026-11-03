-- Applied migration 20260108032429 (create_address_verifications_table), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.

-- Address verifications
CREATE TABLE IF NOT EXISTS verification.address_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_record_id UUID REFERENCES verification.verification_records(id) ON DELETE CASCADE,
  verification_type verification.address_verification_type NOT NULL,
  full_address TEXT NOT NULL,
  street_address VARCHAR(255),
  city VARCHAR(100),
  state_province VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100),
  lga VARCHAR(100),  -- Local Government Area (for Nigeria)
  document_url TEXT,
  document_date DATE,
  issuer VARCHAR(200),
  address_valid BOOLEAN,
  document_authentic BOOLEAN,
  resident_confirmed BOOLEAN,
  geo_coordinates JSONB,  -- {lat, lng}
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_address_verifications_record_id ON verification.address_verifications(verification_record_id);
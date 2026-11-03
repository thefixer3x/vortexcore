-- Applied migration 20260108032313 (create_provider_references), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.

-- Provider reference mapping for reconciliation

CREATE TABLE IF NOT EXISTS provider_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  internal_ref VARCHAR(50) NOT NULL UNIQUE,
  internal_type VARCHAR(30) NOT NULL,
  provider_name VARCHAR(50) NOT NULL,
  provider_ref VARCHAR(100),
  provider_session_id VARCHAR(100),
  raw_request JSONB,
  raw_response JSONB,
  provider_status VARCHAR(30),
  normalized_status VARCHAR(20) NOT NULL,
  status_reason TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  response_at TIMESTAMPTZ,
  settled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_provider_refs_internal ON provider_references(internal_ref);
CREATE INDEX IF NOT EXISTS idx_provider_refs_provider ON provider_references(provider_name, provider_ref);
CREATE INDEX IF NOT EXISTS idx_provider_refs_status ON provider_references(normalized_status);
CREATE INDEX IF NOT EXISTS idx_provider_refs_pending ON provider_references(normalized_status) WHERE normalized_status IN ('pending', 'processing');
CREATE INDEX IF NOT EXISTS idx_provider_refs_created ON provider_references(created_at DESC);

COMMENT ON TABLE provider_references IS 'Maps internal transaction references to provider-specific references for reconciliation';
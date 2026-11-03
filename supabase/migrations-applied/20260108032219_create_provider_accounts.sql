-- Applied migration 20260108032219 (create_provider_accounts), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.

-- Provider configuration for vendor abstraction

-- Create enum types
DO $$ BEGIN
  CREATE TYPE provider_type AS ENUM (
    'wallet',
    'payment_gateway',
    'card_issuer',
    'verification',
    'transfer'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE provider_status AS ENUM ('active', 'disabled', 'maintenance', 'deprecated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE environment_type AS ENUM ('sandbox', 'live');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create provider_accounts table
CREATE TABLE IF NOT EXISTS provider_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  provider_name VARCHAR(50) NOT NULL,
  provider_type provider_type NOT NULL,
  environment environment_type NOT NULL DEFAULT 'sandbox',
  config JSONB NOT NULL DEFAULT '{}',
  base_url VARCHAR(255),
  priority INTEGER DEFAULT 0,
  weight INTEGER DEFAULT 100,
  supported_currencies TEXT[] DEFAULT '{}',
  supported_countries TEXT[] DEFAULT '{}',
  daily_limit_amount DECIMAL(18,2),
  per_transaction_limit DECIMAL(18,2),
  status provider_status NOT NULL DEFAULT 'active',
  health_check_url VARCHAR(255),
  last_health_check_at TIMESTAMPTZ,
  last_health_status VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  UNIQUE(project_id, provider_name, environment)
);

CREATE INDEX IF NOT EXISTS idx_provider_accounts_project ON provider_accounts(project_id);
CREATE INDEX IF NOT EXISTS idx_provider_accounts_type ON provider_accounts(provider_type, status);
CREATE INDEX IF NOT EXISTS idx_provider_accounts_routing ON provider_accounts(provider_type, status, priority DESC);

COMMENT ON TABLE provider_accounts IS 'Stores provider configurations per project for vendor abstraction';
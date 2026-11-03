-- Applied migration 20260108032315 (create_project_capabilities), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.

-- Project capabilities and tier configuration

CREATE TABLE IF NOT EXISTS project_capabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL UNIQUE,
  wallet_enabled BOOLEAN DEFAULT FALSE,
  transfers_enabled BOOLEAN DEFAULT FALSE,
  payments_enabled BOOLEAN DEFAULT FALSE,
  cards_enabled BOOLEAN DEFAULT FALSE,
  kyc_enabled BOOLEAN DEFAULT FALSE,
  webhooks_enabled BOOLEAN DEFAULT TRUE,
  allowed_currencies TEXT[] DEFAULT '{NGN}',
  daily_transfer_limit DECIMAL(18,2) DEFAULT 1000000,
  per_transfer_limit DECIMAL(18,2) DEFAULT 100000,
  daily_payment_limit DECIMAL(18,2) DEFAULT 5000000,
  per_payment_limit DECIMAL(18,2) DEFAULT 500000,
  monthly_volume_limit DECIMAL(18,2),
  kyc_types TEXT[] DEFAULT '{bvn,phone}',
  requests_per_minute INTEGER DEFAULT 100,
  requests_per_hour INTEGER DEFAULT 1000,
  tier VARCHAR(20) DEFAULT 'starter',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_capabilities_project ON project_capabilities(project_id);

-- Default tier configurations
CREATE TABLE IF NOT EXISTS capability_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_name VARCHAR(20) NOT NULL UNIQUE,
  display_name VARCHAR(50) NOT NULL,
  wallet_enabled BOOLEAN DEFAULT FALSE,
  transfers_enabled BOOLEAN DEFAULT FALSE,
  payments_enabled BOOLEAN DEFAULT FALSE,
  cards_enabled BOOLEAN DEFAULT FALSE,
  kyc_enabled BOOLEAN DEFAULT FALSE,
  daily_transfer_limit DECIMAL(18,2),
  per_transfer_limit DECIMAL(18,2),
  monthly_volume_limit DECIMAL(18,2),
  requests_per_minute INTEGER,
  requests_per_hour INTEGER,
  monthly_fee DECIMAL(10,2) DEFAULT 0,
  transaction_fee_percent DECIMAL(5,4) DEFAULT 0,
  transaction_fee_cap DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default tiers
INSERT INTO capability_tiers (tier_name, display_name, wallet_enabled, transfers_enabled, payments_enabled, kyc_enabled, daily_transfer_limit, per_transfer_limit, requests_per_minute, requests_per_hour)
VALUES
  ('starter', 'Starter', TRUE, TRUE, TRUE, TRUE, 1000000, 100000, 60, 500),
  ('growth', 'Growth', TRUE, TRUE, TRUE, TRUE, 10000000, 1000000, 120, 2000),
  ('business', 'Business', TRUE, TRUE, TRUE, TRUE, 50000000, 5000000, 300, 10000),
  ('enterprise', 'Enterprise', TRUE, TRUE, TRUE, TRUE, NULL, NULL, 1000, 50000)
ON CONFLICT (tier_name) DO NOTHING;

-- View for capabilities with tier defaults
CREATE OR REPLACE VIEW project_capabilities_with_tier AS
SELECT
  pc.*,
  ct.display_name as tier_display_name,
  COALESCE(pc.daily_transfer_limit, ct.daily_transfer_limit) as effective_daily_transfer_limit,
  COALESCE(pc.per_transfer_limit, ct.per_transfer_limit) as effective_per_transfer_limit,
  COALESCE(pc.requests_per_minute, ct.requests_per_minute) as effective_requests_per_minute,
  COALESCE(pc.requests_per_hour, ct.requests_per_hour) as effective_requests_per_hour
FROM project_capabilities pc
LEFT JOIN capability_tiers ct ON pc.tier = ct.tier_name;

COMMENT ON TABLE project_capabilities IS 'Feature flags and limits per project';
COMMENT ON TABLE capability_tiers IS 'Default configurations for each pricing tier';
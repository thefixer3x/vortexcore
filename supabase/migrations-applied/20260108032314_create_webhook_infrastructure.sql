-- Applied migration 20260108032314 (create_webhook_infrastructure), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.

-- Webhook infrastructure for reliable event delivery

DO $$ BEGIN
  CREATE TYPE webhook_status AS ENUM ('active', 'paused', 'disabled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Webhook endpoints table
CREATE TABLE IF NOT EXISTS webhook_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  url VARCHAR(500) NOT NULL,
  description VARCHAR(255),
  events TEXT[] DEFAULT '{}',
  secret VARCHAR(100) NOT NULL,
  signature_header VARCHAR(50) DEFAULT 'X-Webhook-Signature',
  status webhook_status NOT NULL DEFAULT 'active',
  retry_count INTEGER DEFAULT 3,
  timeout_seconds INTEGER DEFAULT 30,
  total_deliveries INTEGER DEFAULT 0,
  successful_deliveries INTEGER DEFAULT 0,
  failed_deliveries INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  UNIQUE(project_id, url)
);

-- Webhook events table (outbox pattern)
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(50) NOT NULL,
  payload JSONB NOT NULL,
  source_type VARCHAR(30),
  source_id UUID,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhook deliveries table
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_id UUID NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES webhook_events(id) ON DELETE CASCADE,
  attempt_count INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 5,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  last_attempt_at TIMESTAMPTZ,
  last_status_code INTEGER,
  last_response_body TEXT,
  last_error TEXT,
  next_retry_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_project ON webhook_endpoints(project_id);
CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_status ON webhook_endpoints(status);
CREATE INDEX IF NOT EXISTS idx_webhook_events_unprocessed ON webhook_events(processed, created_at) WHERE processed = FALSE;
CREATE INDEX IF NOT EXISTS idx_webhook_events_type ON webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_pending ON webhook_deliveries(next_retry_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_endpoint ON webhook_deliveries(endpoint_id, status);

COMMENT ON TABLE webhook_endpoints IS 'Registered webhook endpoints per project';
COMMENT ON TABLE webhook_events IS 'Event outbox for reliable webhook delivery';
COMMENT ON TABLE webhook_deliveries IS 'Tracks delivery attempts and retries';
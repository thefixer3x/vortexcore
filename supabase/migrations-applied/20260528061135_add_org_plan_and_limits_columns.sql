-- Applied migration 20260528061135 (add_org_plan_and_limits_columns), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.

-- Add plan and limit columns to public.organizations
-- These were defined in mcp-core's intended schema (migrations/00_admin_setup.sql)
-- but were never applied to the live shared public.organizations table.
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS plan VARCHAR(50) DEFAULT 'free'
    CHECK (plan IN ('free', 'pro', 'enterprise')),
  ADD COLUMN IF NOT EXISTS max_memories INTEGER DEFAULT 1000,
  ADD COLUMN IF NOT EXISTS max_api_calls_per_month INTEGER DEFAULT 10000,
  ADD COLUMN IF NOT EXISTS max_users INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS storage_limit_mb INTEGER DEFAULT 100,
  ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '["vector_search"]'::jsonb;

-- Backfill existing rows to pro-tier defaults
UPDATE public.organizations
SET
  plan = COALESCE(plan, 'pro'),
  max_memories = COALESCE(max_memories, 10000),
  max_api_calls_per_month = COALESCE(max_api_calls_per_month, 100000),
  max_users = COALESCE(max_users, 10),
  storage_limit_mb = COALESCE(storage_limit_mb, 1000),
  features = COALESCE(features, '["vector_search","api_keys","multi_user","advanced_analytics"]'::jsonb)
WHERE plan IS NULL OR max_memories IS NULL;
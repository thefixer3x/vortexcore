-- Applied migration 20260218065536 (fix_security_definer_views), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.


-- Fix: Recreate all SECURITY DEFINER views as SECURITY INVOKER
-- This ensures views respect the querying user's RLS policies, not the view creator's

-- 1. gcp_service_account_keys
DROP VIEW IF EXISTS public.gcp_service_account_keys;
CREATE VIEW public.gcp_service_account_keys
WITH (security_invoker = true)
AS
  SELECT id, created_at, vendor_id, project_id, service_account_email,
         key_id, key_type, expires_at, has_ai_permissions, last_checked_at, deleted_at
  FROM vendors.gcp_service_account_keys;

-- 2. gcp_service_status
DROP VIEW IF EXISTS public.gcp_service_status;
CREATE VIEW public.gcp_service_status
WITH (security_invoker = true)
AS
  SELECT id, updated_at, vendor_id, project_id, service_name,
         enabled, is_ai_service, last_checked_at
  FROM vendors.gcp_service_status;

-- 3. gcp_billing_alerts
DROP VIEW IF EXISTS public.gcp_billing_alerts;
CREATE VIEW public.gcp_billing_alerts
WITH (security_invoker = true)
AS
  SELECT id, created_at, vendor_id, alert_type, severity, title, message,
         details, resolved, resolved_at, resolved_by, resolution_notes
  FROM vendors.gcp_billing_alerts;

-- 4. gcp_billing_history
DROP VIEW IF EXISTS public.gcp_billing_history;
CREATE VIEW public.gcp_billing_history
WITH (security_invoker = true)
AS
  SELECT id, created_at, vendor_id, billing_account, total_cost, ai_services_cost,
         storage_cost, compute_cost, other_cost, services_enabled, ai_services_enabled,
         user_managed_keys, running_vms, snapshot_data, notes, alert_triggered
  FROM vendors.gcp_billing_history;

-- 5. behavior_patterns
DROP VIEW IF EXISTS public.behavior_patterns;
CREATE VIEW public.behavior_patterns
WITH (security_invoker = true)
AS
  SELECT id, user_id, trigger, trigger_embedding, voyage_trigger_embedding,
         context, actions, final_outcome, confidence, use_count,
         last_used_at, created_at, updated_at
  FROM security_service.behavior_patterns;

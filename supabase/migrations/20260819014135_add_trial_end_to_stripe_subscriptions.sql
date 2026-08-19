-- Captured verbatim from supabase_migrations.schema_migrations (applied
-- remotely 2026-08-19; no local file existed until now). Duplicates the
-- intent of 20260815_add_trial_end_to_stripe_subscriptions.sql under a
-- different version — both are idempotent (IF NOT EXISTS), so this is a
-- harmless no-op wherever the Aug 15 migration already ran. Already applied
-- to mxtsdgkwzjzlttpotole; committed here for reproducibility only, not to
-- be pushed against that project again.

alter table public.stripe_subscriptions add column if not exists trial_end timestamp with time zone;

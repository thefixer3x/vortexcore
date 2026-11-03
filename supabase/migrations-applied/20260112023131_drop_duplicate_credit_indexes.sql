-- Applied migration 20260112023131 (drop_duplicate_credit_indexes), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.

drop index if exists credit.idx_applications_created;
drop index if exists credit.idx_applications_status;
drop index if exists credit.idx_bids_application;
drop index if exists credit.idx_bids_provider;
drop index if exists credit.idx_bids_status;
drop index if exists credit.idx_providers_code;
drop index if exists credit.idx_providers_status;
drop index if exists credit.idx_status_history_application_id;
drop index if exists credit.idx_transactions_application;
drop index if exists credit.idx_transactions_provider;
drop index if exists credit.idx_transactions_status;
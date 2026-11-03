-- Applied migration 20260112060537 (fix_audit_log_insert_and_api_keys_updated_at), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.

-- Ensure api_keys has updated_at to satisfy update trigger
alter table public.api_keys
  add column if not exists updated_at timestamp with time zone default now();

update public.api_keys
set updated_at = coalesce(updated_at, created_at, now())
where updated_at is null;

-- Fix audit_log insert redirect to honor defaults instead of inserting NULL id
create or replace function public.audit_log_insert_redirect()
returns trigger
language plpgsql
security definer
set search_path to 'pg_catalog', 'analytics', 'public'
as $$
begin
  insert into analytics.audit_log (
    id,
    user_id,
    organization_id,
    action,
    resource_type,
    resource_id,
    metadata,
    ip_address,
    user_agent,
    created_at
  )
  values (
    coalesce(new.id, gen_random_uuid()),
    new.user_id,
    new.organization_id,
    new.action,
    new.resource_type,
    new.resource_id,
    coalesce(new.metadata, '{}'::jsonb),
    new.ip_address,
    new.user_agent,
    coalesce(new.created_at, now())
  );

  return new;
end;
$$;
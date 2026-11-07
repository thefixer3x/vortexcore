-- Local fixture for the wallet-funding test: the live app_vortexcore wallet and
-- transaction tables (columns, constraints, grants, RLS, triggers) as read on
-- 2026-11-07, plus minimal auth helpers. Only for a throwaway local database.

do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin bypassrls; end if;
end $$;

-- auth helpers reading the JWT claims GUC, as on Supabase
create schema auth;
create table auth.users (id uuid primary key);
create function auth.uid() returns uuid language sql stable as
  $$ select nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'sub', '')::uuid $$;
create function auth.role() returns text language sql stable as
  $$ select coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'role', '') $$;
grant usage on schema auth to anon, authenticated, service_role;

create schema app_vortexcore;
grant usage on schema app_vortexcore to anon, authenticated, service_role;

create function app_vortexcore.touch_updated_at() returns trigger language plpgsql set search_path to '' as $$
begin new.updated_at = now(); return new; end; $$;

create table app_vortexcore.vortex_wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  balance numeric not null default 0,
  currency text not null default 'USD',
  is_locked boolean not null default false,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vortex_wallets_user_id_key unique (user_id)
);
create table app_vortexcore.vortex_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  wallet_id uuid,
  amount numeric not null,
  currency text not null default 'USD',
  type text not null check (type = any (array['credit','debit','transfer','refund','fee','reversal'])),
  status text not null default 'pending' check (status = any (array['pending','processing','completed','failed','cancelled'])),
  description text, category text,
  reference text unique,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);
create table app_vortexcore.vortex_obligation_feed (
  id uuid primary key default gen_random_uuid(), user_id uuid not null, kind text not null, message text not null,
  obligation_id uuid, transaction_id uuid, amount numeric, currency text, created_at timestamptz not null default now()
);

-- live protect_wallet_balance trigger
create function app_vortexcore.protect_wallet_balance() returns trigger language plpgsql
set search_path to 'app_vortexcore', 'pg_temp' as $$
begin
  if current_user in ('authenticated','anon') or coalesce(auth.role(),'') in ('authenticated','anon') then
    if tg_op = 'INSERT' then new.balance := 0;
    elsif new.balance is distinct from old.balance then raise exception 'Wallet balance cannot be changed directly';
    end if;
  end if;
  return new;
end $$;
create trigger protect_wallet_balance before insert or update on app_vortexcore.vortex_wallets
  for each row execute function app_vortexcore.protect_wallet_balance();
create trigger trg_touch_updated_at before update on app_vortexcore.vortex_wallets
  for each row execute function app_vortexcore.touch_updated_at();

-- live transaction feed trigger (simplified: feed row only)
create function public.vortex_on_transaction_inserted() returns trigger language plpgsql security definer
set search_path to 'app_vortexcore', 'public' as $$
begin
  insert into app_vortexcore.vortex_obligation_feed (user_id, kind, message, transaction_id, amount, currency)
  values (new.user_id, 'transaction', 'New transaction: ' || coalesce(nullif(new.description,''), new.type), new.id, new.amount, new.currency);
  return new;
end $$;
create trigger vortex_transaction_obligation_feed after insert on app_vortexcore.vortex_transactions
  for each row execute function public.vortex_on_transaction_inserted();

-- live RLS and grants
alter table app_vortexcore.vortex_wallets enable row level security;
alter table app_vortexcore.vortex_transactions enable row level security;
create policy owner_select on app_vortexcore.vortex_wallets for select to authenticated using (auth.uid() = user_id);
create policy owner_insert on app_vortexcore.vortex_wallets for insert to authenticated with check (auth.uid() = user_id);
create policy owner_update on app_vortexcore.vortex_wallets for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy owner_select on app_vortexcore.vortex_transactions for select to authenticated using (auth.uid() = user_id);
create policy owner_insert on app_vortexcore.vortex_transactions for insert to authenticated with check (auth.uid() = user_id);
grant select, insert, update, delete on app_vortexcore.vortex_wallets, app_vortexcore.vortex_transactions to authenticated, service_role;

-- Supabase's default privileges: new objects in public are granted to the
-- client roles. Reproduced so the test proves the script revokes them.
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;

-- two users with one USD wallet each, as live
insert into auth.users values ('00000000-0000-0000-0000-00000000000a'), ('00000000-0000-0000-0000-00000000000b');
insert into app_vortexcore.vortex_wallets (user_id, currency, balance) values
  ('00000000-0000-0000-0000-00000000000a', 'USD', 10),
  ('00000000-0000-0000-0000-00000000000b', 'USD', 20);

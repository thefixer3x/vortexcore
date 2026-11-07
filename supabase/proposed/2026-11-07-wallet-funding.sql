-- =============================================================================
-- Wallet funding: per-currency wallets, saved cards, top-up credit
--
-- STATUS: PROPOSED. Not applied. The owner reviews and applies it (SQL editor,
-- or `psql -1 -f`). Everything below runs in one transaction.
-- Owner decisions (2026-11-07): one wallet per currency; card top-ups in scope.
--
-- Live state read on 2026-11-07:
--   * app_vortexcore.vortex_wallets: UNIQUE (user_id) (vortex_wallets_user_id_key),
--     18 wallets, all USD, one per user. Balance changes by client roles are
--     already blocked by the protect_wallet_balance trigger.
--   * vortex_transactions.reference is UNIQUE; type CHECK allows 'credit'.
--   * No payment-method table exists.
--   * New objects in public get anon/authenticated grants by default on
--     Supabase, so every object below revokes them explicitly.
--
-- What this adds:
--   1. One wallet per (user, currency) instead of one per user. Existing rows
--      already satisfy it.
--   2. app_vortexcore.vortex_payment_methods (+ public view): saved Stripe
--      payment-method ids and display details. Owners can read their own rows;
--      only the service role (edge functions) writes.
--   3. public.vortex_credit_wallet_topup(): credits a wallet for a succeeded
--      Stripe PaymentIntent, in one transaction, idempotent on the
--      PaymentIntent id. Service role only.
--
-- Rollback: 2026-11-07-wallet-funding.rollback.sql.
-- Test: supabase/proposed/test/run-wallet-funding.sh (local Postgres).
-- =============================================================================

begin;

-- 1. One wallet per currency ---------------------------------------------------
alter table app_vortexcore.vortex_wallets
  drop constraint vortex_wallets_user_id_key;
alter table app_vortexcore.vortex_wallets
  add constraint vortex_wallets_user_currency_key unique (user_id, currency);
alter table app_vortexcore.vortex_wallets
  add constraint vortex_wallets_currency_format check (currency ~ '^[A-Z]{3}$');

-- 2. Saved payment methods -----------------------------------------------------
create table app_vortexcore.vortex_payment_methods (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  provider    text not null default 'stripe' check (provider = 'stripe'),
  source_id   text not null unique check (source_id ~ '^pm_'),  -- Stripe PaymentMethod id, never card data
  type        text not null default 'card',
  brand       text,
  last4       text check (last4 is null or last4 ~ '^[0-9]{4}$'),
  exp_month   smallint check (exp_month is null or exp_month between 1 and 12),
  exp_year    smallint,
  is_default  boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index vortex_payment_methods_user_idx on app_vortexcore.vortex_payment_methods (user_id);
-- At most one default card per user.
create unique index vortex_payment_methods_one_default
  on app_vortexcore.vortex_payment_methods (user_id) where is_default;

create trigger trg_touch_updated_at
  before update on app_vortexcore.vortex_payment_methods
  for each row execute function app_vortexcore.touch_updated_at();

alter table app_vortexcore.vortex_payment_methods enable row level security;
create policy owner_select on app_vortexcore.vortex_payment_methods
  for select to authenticated
  using ((select auth.uid()) = user_id);

revoke all on table app_vortexcore.vortex_payment_methods from public, anon, authenticated;
grant select on table app_vortexcore.vortex_payment_methods to authenticated;
grant select, insert, update, delete on table app_vortexcore.vortex_payment_methods to service_role;

create view public.vortex_payment_methods with (security_invoker = on) as
  select id, user_id, provider, source_id, type, brand, last4, exp_month, exp_year,
         is_default, created_at, updated_at
  from app_vortexcore.vortex_payment_methods;

revoke all on table public.vortex_payment_methods from public, anon, authenticated;
grant select on table public.vortex_payment_methods to authenticated;
grant select, insert, update, delete on table public.vortex_payment_methods to service_role;

-- 3. Top-up credit -------------------------------------------------------------
-- Called by the fund-wallet edge function after a PaymentIntent succeeded.
-- p_amount is in major units (the wallet's unit), already derived server-side
-- from the PaymentIntent's amount_received. Replaying the same PaymentIntent
-- returns the original result and never credits twice.
create or replace function public.vortex_credit_wallet_topup(
  p_user_id           uuid,
  p_amount            numeric,
  p_currency          text,
  p_payment_intent_id text
) returns jsonb
language plpgsql
security definer
set search_path = app_vortexcore, pg_temp
as $$
declare
  v_ref     text := 'topup_' || p_payment_intent_id;
  v_wallet  app_vortexcore.vortex_wallets%rowtype;
  v_tx_id   uuid;
  v_prev    app_vortexcore.vortex_transactions%rowtype;
begin
  if p_user_id is null then raise exception 'USER_REQUIRED'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'INVALID_AMOUNT'; end if;
  if p_currency is null or p_currency !~ '^[A-Z]{3}$' then raise exception 'INVALID_CURRENCY'; end if;
  if p_payment_intent_id is null or p_payment_intent_id !~ '^pi_' then raise exception 'INVALID_PAYMENT_INTENT'; end if;

  -- The wallet for this currency, created on first top-up. Locked for the rest
  -- of the transaction so concurrent top-ups serialise on it.
  insert into app_vortexcore.vortex_wallets (user_id, currency, balance)
  values (p_user_id, p_currency, 0)
  on conflict (user_id, currency) do nothing;

  select * into v_wallet from app_vortexcore.vortex_wallets
  where user_id = p_user_id and currency = p_currency
  for update;

  -- Idempotency: the same PaymentIntent was already credited.
  select * into v_prev from app_vortexcore.vortex_transactions where reference = v_ref;
  if found then
    if v_prev.user_id <> p_user_id or v_prev.amount <> p_amount or v_prev.currency <> p_currency then
      raise exception 'REFERENCE_CONFLICT';
    end if;
    return jsonb_build_object('idempotent', true, 'transaction_id', v_prev.id,
      'wallet_id', v_prev.wallet_id, 'amount', v_prev.amount, 'currency', v_prev.currency);
  end if;

  if coalesce(v_wallet.is_locked, false) then raise exception 'WALLET_LOCKED'; end if;

  insert into app_vortexcore.vortex_transactions (
    user_id, wallet_id, type, status, amount, currency, reference, description, category, metadata, completed_at
  ) values (
    p_user_id, v_wallet.id, 'credit', 'completed', p_amount, p_currency, v_ref,
    'Wallet top-up', 'wallet_topup',
    jsonb_build_object('source', 'card_topup', 'payment_intent_id', p_payment_intent_id),
    now()
  ) returning id into v_tx_id;

  update app_vortexcore.vortex_wallets
  set balance = balance + p_amount
  where id = v_wallet.id;

  return jsonb_build_object('idempotent', false, 'transaction_id', v_tx_id,
    'wallet_id', v_wallet.id, 'amount', p_amount, 'currency', p_currency,
    'new_balance', v_wallet.balance + p_amount);
end;
$$;

revoke all on function public.vortex_credit_wallet_topup(uuid, numeric, text, text) from public, anon, authenticated;
grant execute on function public.vortex_credit_wallet_topup(uuid, numeric, text, text) to service_role;

commit;

-- =============================================================================
-- Checks after applying (read-only)
-- =============================================================================
--   select conname, pg_get_constraintdef(oid) from pg_constraint
--   where conrelid = 'app_vortexcore.vortex_wallets'::regclass and contype in ('u','c');
--   select proacl from pg_proc where proname = 'vortex_credit_wallet_topup';      -- postgres + service_role only
--   select relname, relacl from pg_class where relname = 'vortex_payment_methods';  -- authenticated=r only

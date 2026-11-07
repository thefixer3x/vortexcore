-- Checks for 2026-11-07-wallet-funding.sql. Each check prints "ok <name>" or
-- raises. Run after the script on wallet-fixture.sql.
\set ON_ERROR_STOP 1
\set A '''00000000-0000-0000-0000-00000000000a'''
\set B '''00000000-0000-0000-0000-00000000000b'''

create function pg_temp.expect_error(p_label text, p_sql text, p_like text) returns text language plpgsql as $$
begin
  begin execute p_sql; exception when others then
    if sqlerrm like p_like or sqlstate = p_like then return 'ok ' || p_label; end if;
    raise exception '% failed with the wrong error: % (%)', p_label, sqlerrm, sqlstate;
  end;
  raise exception '% unexpectedly succeeded', p_label;
end $$;
grant execute on function pg_temp.expect_error(text, text, text) to anon, authenticated, service_role;

-- ---- service role (the edge functions) ----
set role service_role;
select set_config('request.jwt.claims', '{"role":"service_role"}', false);

-- top-up into an existing USD wallet
select case when (public.vortex_credit_wallet_topup(:A, 25, 'USD', 'pi_1') ->> 'idempotent')::boolean = false
  then 'ok first credit' end;
select case when balance = 35 then 'ok USD balance 10 + 25' else 'BAD ' || balance end
  from app_vortexcore.vortex_wallets where user_id = :A and currency = 'USD';

-- replaying the same PaymentIntent credits nothing more
select case when (public.vortex_credit_wallet_topup(:A, 25, 'USD', 'pi_1') ->> 'idempotent')::boolean
  then 'ok replay is idempotent' end;
select case when balance = 35 then 'ok balance unchanged after replay' else 'BAD ' || balance end
  from app_vortexcore.vortex_wallets where user_id = :A and currency = 'USD';
select case when count(*) = 1 then 'ok one ledger row for pi_1' end
  from app_vortexcore.vortex_transactions where reference = 'topup_pi_1';

-- the same PaymentIntent id with a different amount or user is refused
select pg_temp.expect_error('replay with other amount', $q$select public.vortex_credit_wallet_topup('00000000-0000-0000-0000-00000000000a', 99, 'USD', 'pi_1')$q$, 'REFERENCE_CONFLICT');
select pg_temp.expect_error('replay for other user', $q$select public.vortex_credit_wallet_topup('00000000-0000-0000-0000-00000000000b', 25, 'USD', 'pi_1')$q$, 'REFERENCE_CONFLICT');

-- a top-up in a new currency creates that wallet; the USD wallet is untouched
select case when (public.vortex_credit_wallet_topup(:A, 5000, 'NGN', 'pi_2') ->> 'new_balance')::numeric = 5000
  then 'ok NGN wallet created and credited' end;
select case when count(*) = 2 and sum(balance) filter (where currency = 'USD') = 35
  then 'ok user A has USD and NGN wallets, USD unchanged' end
  from app_vortexcore.vortex_wallets where user_id = :A;

-- bad input
select pg_temp.expect_error('zero amount', $q$select public.vortex_credit_wallet_topup('00000000-0000-0000-0000-00000000000a', 0, 'USD', 'pi_3')$q$, 'INVALID_AMOUNT');
select pg_temp.expect_error('negative amount', $q$select public.vortex_credit_wallet_topup('00000000-0000-0000-0000-00000000000a', -5, 'USD', 'pi_3')$q$, 'INVALID_AMOUNT');
select pg_temp.expect_error('lower-case currency', $q$select public.vortex_credit_wallet_topup('00000000-0000-0000-0000-00000000000a', 5, 'usd', 'pi_3')$q$, 'INVALID_CURRENCY');
select pg_temp.expect_error('not a PaymentIntent', $q$select public.vortex_credit_wallet_topup('00000000-0000-0000-0000-00000000000a', 5, 'USD', 'ch_3')$q$, 'INVALID_PAYMENT_INTENT');

-- a locked wallet is not credited
update app_vortexcore.vortex_wallets set is_locked = true where user_id = :B;
select pg_temp.expect_error('locked wallet', $q$select public.vortex_credit_wallet_topup('00000000-0000-0000-0000-00000000000b', 5, 'USD', 'pi_4')$q$, 'WALLET_LOCKED');
update app_vortexcore.vortex_wallets set is_locked = false where user_id = :B;

-- one wallet per (user, currency)
select pg_temp.expect_error('second USD wallet', $q$insert into app_vortexcore.vortex_wallets (user_id, currency) values ('00000000-0000-0000-0000-00000000000a', 'USD')$q$, '23505');

-- payment methods written by the service role
insert into public.vortex_payment_methods (user_id, source_id, brand, last4, exp_month, exp_year, is_default)
values (:A, 'pm_a1', 'visa', '4242', 12, 2030, true), (:B, 'pm_b1', 'visa', '1881', 1, 2031, true);
select pg_temp.expect_error('two defaults for one user', $q$insert into public.vortex_payment_methods (user_id, source_id, is_default) values ('00000000-0000-0000-0000-00000000000a', 'pm_a2', true)$q$, '23505');
select pg_temp.expect_error('card data instead of a pm id', $q$insert into public.vortex_payment_methods (user_id, source_id) values ('00000000-0000-0000-0000-00000000000a', '4242424242424242')$q$, '23514');
reset role;

-- ---- signed-in user A ----
set role authenticated;
select set_config('request.jwt.claims', '{"role":"authenticated","sub":"00000000-0000-0000-0000-00000000000a"}', false);
select case when count(*) = 1 and min(source_id) = 'pm_a1' then 'ok user sees only own cards' end from public.vortex_payment_methods;
select pg_temp.expect_error('user inserts a card row', $q$insert into public.vortex_payment_methods (user_id, source_id) values ('00000000-0000-0000-0000-00000000000a', 'pm_x')$q$, '42501');
select pg_temp.expect_error('user edits a card row', $q$update public.vortex_payment_methods set is_default = false$q$, '42501');
select pg_temp.expect_error('user deletes a card row', $q$delete from public.vortex_payment_methods$q$, '42501');
select pg_temp.expect_error('user calls the credit function', $q$select public.vortex_credit_wallet_topup('00000000-0000-0000-0000-00000000000a', 1000000, 'USD', 'pi_9')$q$, '42501');
select pg_temp.expect_error('user raises own balance', $q$update app_vortexcore.vortex_wallets set balance = 1000000 where currency = 'USD'$q$, 'Wallet balance cannot be changed directly');
-- a user may still open a wallet in a new currency themselves, at zero
insert into app_vortexcore.vortex_wallets (user_id, currency, balance) values ('00000000-0000-0000-0000-00000000000a', 'GBP', 500);
reset role;
select case when balance = 0 then 'ok client-created wallet starts at 0' else 'BAD ' || balance end
  from app_vortexcore.vortex_wallets where user_id = :A and currency = 'GBP';

-- ---- anonymous ----
set role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', false);
select pg_temp.expect_error('anon reads cards', $q$select * from public.vortex_payment_methods$q$, '42501');
select pg_temp.expect_error('anon calls the credit function', $q$select public.vortex_credit_wallet_topup('00000000-0000-0000-0000-00000000000a', 1, 'USD', 'pi_8')$q$, '42501');
reset role;

select 'ALL WALLET CHECKS PASSED';

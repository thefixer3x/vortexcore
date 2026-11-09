-- Rollback for 2026-11-07-wallet-funding.sql
--
-- Restoring UNIQUE (user_id) fails if any user already has wallets in two
-- currencies; that is intended: resolve those wallets (and their balances)
-- by hand before going back to one wallet per user.
-- Saved payment-method rows are dropped; the cards stay attached to the
-- Stripe customers and can be re-listed from Stripe.

begin;

drop function if exists public.vortex_credit_wallet_topup(uuid, numeric, text, text);
drop view if exists public.vortex_payment_methods;
drop table if exists app_vortexcore.vortex_payment_methods;

alter table app_vortexcore.vortex_wallets drop constraint if exists vortex_wallets_currency_format;
alter table app_vortexcore.vortex_wallets drop constraint if exists vortex_wallets_user_currency_key;
alter table app_vortexcore.vortex_wallets add constraint vortex_wallets_user_id_key unique (user_id);

commit;

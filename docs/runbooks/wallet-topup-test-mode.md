# Runbook: testing wallet top-ups in Stripe test mode

Covers saving a card (`stripe-payment-methods`) and topping up a wallet (`fund-wallet`) end to end, before top-ups are switched on for real users.

The database side (`supabase/proposed/2026-11-07-wallet-funding.sql`) is applied in production as of 2026-11-07. It is also covered locally by `supabase/proposed/test/run-wallet-funding.sh`.

## 1. Environment

Both edge functions use the project's `STRIPE_SECRET_KEY`. In production that key is probably the live one, and a test-mode run must never use it. Pick one of these:

- **A. Supabase preview branch (recommended).** Create a branch of the project and set its Edge Function secrets:
  - `STRIPE_SECRET_KEY`: a Stripe **test** secret key (`sk_test_…`).
  - `WALLET_TOPUP_ENABLED=true`.
  - The branch's own `VORTEX_SUPABASE_SECRET_KEY` and `SUPABASE_URL`.

  Then apply the wallet-funding SQL to the branch, deploy `stripe-payment-methods` and `fund-wallet` there, and point a preview build of the app at the branch.
- **B. Local.** Run `supabase functions serve stripe-payment-methods fund-wallet --env-file <local file with the test key>` against a local database that has the wallet-funding SQL applied.

Never set `WALLET_TOPUP_ENABLED=true` on the production project until the checks below pass and the owner signs off.

Set secrets in the Supabase dashboard (Edge Functions → Secrets) or with `supabase secrets set`. Never commit them or paste them into a chat.

## 2. Test cards (Stripe test mode)

| Card | What it tests | Expected result |
| --- | --- | --- |
| `4242 4242 4242 4242` | Card saved and top-up succeeds | Card listed (Visa •••• 4242, default if first); wallet credited; one `topup_pi_…` ledger row |
| `4000 0025 0000 3155` | Card needs 3-D Secure | Setup page asks for authentication; an off-session top-up returns 402 "Your bank needs to confirm this payment" and nothing is credited |
| `4000 0000 0000 9995` | Declined (insufficient funds) | 402 "Your card was declined."; nothing credited |
| `4000 0000 0000 0341` | Card saves, but every charge fails | Card saved; top-up returns 402; nothing credited |

Use any future expiry date, any CVC and any postcode.

## 3. Cases to run

1. **Save a card:** Settings → Payment Methods → Add card. You're sent to Stripe's hosted page and back to `/settings?card_setup=…`. The card appears, and only one card is the default.
2. **Top up in USD:** wallet balance rises by exactly the amount, and the toast says "Wallet funded".
3. **Retry the same top-up:** repeat the request with the same amount, currency and card, for example after a timeout. You get "Already added", and the balance and ledger don't change.
4. **New currency:** a top-up in NGN creates an NGN wallet; the USD wallet is unchanged.
5. **Limits:** an amount below the minimum or above the maximum (`TOPUP_LIMITS` in `_shared/wallet-topup.ts`) is refused with 400 before any charge.
6. **Credit fails after the charge:** temporarily make the credit fail, for example by locking the wallet with `update … set is_locked = true` on the test database. The charge is refunded in Stripe, and the response carries `code: topup_refunded`.
7. **Retry after a refund:** after case 6, retry with the same key. It returns 409 `topup_refunded` and nothing is credited. The next attempt uses a new key.
8. **Remove cards:** removing the default promotes another card. Removing the only card works. Removing a card already detached in the Stripe dashboard still removes it from the list.
9. **Switch off:** with `WALLET_TOPUP_ENABLED` unset, `fund-wallet` returns 503.

## 4. Checks on the test database

```sql
-- One ledger row per PaymentIntent, and wallet balance = sum of its top-ups
select w.currency, w.balance, coalesce(sum(t.amount), 0) as topups
from app_vortexcore.vortex_wallets w
left join app_vortexcore.vortex_transactions t
  on t.wallet_id = w.id and t.category = 'wallet_topup'
where w.user_id = '<test user id>'
group by w.currency, w.balance;

select reference, count(*) from app_vortexcore.vortex_transactions
where reference like 'topup_pi_%' group by 1 having count(*) > 1;   -- expect no rows

select user_id, count(*) from app_vortexcore.vortex_payment_methods
where is_default group by 1 having count(*) > 1;                     -- expect no rows
```

In the Stripe test dashboard, compare each succeeded PaymentIntent with a ledger row, and each refunded one with **no** ledger row.

## 5. Before switching on for real users

- Every case above passes in test mode, with screenshots in the PR (`WALLET_FUNDING_PLAN.md`, section 4).
- Owner sign-off on stored value (W1 in `WALLET_FUNDING_PLAN.md`): a top-up balance is customer money held by VortexCore.
- Then set `WALLET_TOPUP_ENABLED=true` on production, and run one low-value live top-up and refund.

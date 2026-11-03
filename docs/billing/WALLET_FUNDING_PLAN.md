# Plan: real wallet funding, saved cards and a default payment source

Status: proposed (2026-11-03). Nothing in this plan is built yet. Owner decisions in section 2 come first, because this feature moves real money and changes what VortexCore is legally.

## 1. Where things are today

| Piece | Today |
|---|---|
| Deposit / Add Funds (`DashboardActionDialog.tsx`, `action-config.ts`) | Inserts a `vortex_transactions` row with type `deposit` or `payment`. The table only allows `credit, debit, transfer, refund, fee, reversal`, so these inserts are rejected. No money moves and no gateway is called. |
| Saved cards | None. Stripe is used only for subscriptions (`create-checkout-session`) and Issuing authorizations (`stripe-issuing-authorization`). There is no SetupIntent or payment-method vault. |
| Paying an obligation (`vortex_pay_obligation`) | Wallet only. It raises `INSUFFICIENT_FUNDS` when the wallet is short; nothing falls back to a card. |
| Wallet balance | `protect_wallet_balance` stops signed-in users from changing `balance` directly. Only server code (secret key) can credit or debit it. Keep this. |

## 2. Owner decisions (block everything below)

| ID | Decision | Why it matters |
|---|---|---|
| W1 | **Stored value or pay-through?** (a) Card top-ups credit a VortexCore wallet balance that users spend later, or (b) no stored balance from cards: when a wallet is short, the card is charged for that one payment only. | (a) is holding customer funds: e-money / money-transmission rules (for Nigeria, CBN licensing; Stripe also restricts "stored value" use without approval). (b) avoids holding funds. **Recommended: (b) first.** |
| W2 | **Gateway per currency.** Stripe for USD/EUR/GBP cards; Paystack (or SaySwitch) for NGN cards and bank transfers? | NGN acceptance and settlement depend on each gateway account's configuration and activation. Verify each candidate's NGN acceptance and payout for VortexCore's merchant account before choosing. Section 3 is written for Stripe; a second gateway gets its own adapter (vault, charge, webhook contract) behind the same table and interface before it is enabled. |
| W3 | **Who is the merchant of record** for obligation payments (VortexCore, or the biller)? | Decides whether a card charge goes to VortexCore's account (and then out to the biller) or is a direct payout. |
| W4 | **Limits.** Per-transaction and daily caps, and whether a re-auth (OTP or biometric) is needed above a threshold. | Fraud exposure and chargebacks. |

## 3. Build order once W1–W4 are answered (test mode only until the owner signs off)

1. **Saved cards (any W1 choice).**
   - Edge function `payment-methods`: `POST /setup` creates a Stripe Customer (one per user, stored server-side) and a SetupIntent. `GET` lists the user's cards (brand, last4, expiry only). `DELETE /:id` detaches one.
   - Card details are entered only in Stripe Elements; card numbers never reach VortexCore code or the database.
   - Every endpoint authenticates the caller and scopes each read, delete and default assignment to that caller's `user_id`; detaching the default card clears `default_payment_source`. A test proves one user cannot read, delete or default another user's card.
   - New `app_vortexcore.vortex_payment_methods` (user_id, gateway, gateway_customer_id, gateway_method_id, brand, last4, exp_month, exp_year, is_default, created_at). RLS: owner select only; writes by the secret key only. Public `security_invoker` view per the house layout.
2. **Default payment source.**
   - Setting `default_payment_source` in `vortex_settings`: `wallet` (default) or a `vortex_payment_methods.id`.
   - Settings screen toggle: Wallet / Primary card.
3. **Pay-through (W1 = b).**
   - Extend `pay-obligation`: if the wallet is short and the user allows card fallback, claim a row in a new `vortex_payment_attempts` table (unique on obligation id while an attempt is open) and create the PaymentIntent with that row's id as the idempotency key. Retries and concurrent requests reuse the open attempt until it reaches a terminal state, so one obligation can never get two charges.
   - Handle every outcome: `requires_action` returns the client secret so the app can ask the user to authenticate; `processing` keeps the obligation pending; `payment_failed` closes the attempt and leaves the obligation unpaid. Tests cover an authentication-required test card.
   - Mark the obligation paid only from a signature-verified `payment_intent.succeeded` webhook whose PaymentIntent matches the stored attempt (obligation, user, amount, currency, expected state), never from the browser and never on event type alone. Tests cover forged, duplicate, out-of-order and cross-obligation events.
4. **Wallet top-up (only if W1 = a, after compliance sign-off).**
   - Edge function `fund-wallet` creates a PaymentIntent.
   - The webhook credits `vortex_wallets` through a `SECURITY DEFINER` function with schema-qualified names and a fixed `search_path` (as `protect_wallet_balance` does), `EXECUTE` revoked from `PUBLIC`, `anon` and `authenticated` and granted to `service_role` only. Duplicate detection, the wallet credit and the `credit` transaction row happen in one transaction, guarded by a unique constraint on the gateway object id, so replayed or concurrent deliveries cannot credit twice.
5. **Replace the fake dialog.** Deposit and Add Funds call the real flow, or are hidden behind a feature flag (default off) until step 3 or 4 ships.

## 4. Done when

- No card number, CVC or full PAN is stored or logged anywhere (grep plus a test).
- Webhooks are the only writer of "paid" and "credited" states; a replayed webhook changes nothing (test).
- Everything works end to end in Stripe test mode (and the Paystack sandbox, if W2 picks it), with screenshots in the PR.
- Live keys are added by the owner only after review.

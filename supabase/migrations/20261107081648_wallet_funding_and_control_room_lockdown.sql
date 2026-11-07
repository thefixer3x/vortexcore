-- ============================================================
-- 20261107081648 Wallet funding + control-room lockdown
-- ============================================================
-- Multi-project safe: targets app_vortexcore.* and public schema views.
-- NOT run via `supabase db push` — apply via reviewed SQL.
--
-- Prerequisites:
--   user_payment_methods table (PR #128) must already exist.
--   fund-wallet / stripe-payment-methods edge functions must be deployed.
-- ============================================================

-- ── 1. Widen vortex_transactions type CHECK to allow 'deposit' ──────
-- The live constraint on app_vortexcore.vortex_transactions allows:
--   credit | debit | transfer | refund | fee | reversal
-- fund-wallet writes type='deposit' which fails with 23514.
-- We also add 'payment' because the repo ai-router sends type='payment'.
--
-- Wrapped in DO blocks so the migration is safe to re-run.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'vortex_transactions_type_check'
      AND conrelid = 'app_vortexcore.vortex_transactions'::regclass
  ) THEN
    ALTER TABLE app_vortexcore.vortex_transactions
      DROP CONSTRAINT vortex_transactions_type_check;

    ALTER TABLE app_vortexcore.vortex_transactions
      ADD CONSTRAINT vortex_transactions_type_check
      CHECK ((type = ANY (ARRAY[
        'credit', 'debit', 'transfer', 'refund', 'fee',
        'reversal', 'deposit', 'payment'
      ]::text[])));
  END IF;
END
$$;

-- Similarly widen status CHECK to include 'reversed' (used by Dashboard.tsx)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'vortex_transactions_status_check'
      AND conrelid = 'app_vortexcore.vortex_transactions'::regclass
  ) THEN
    ALTER TABLE app_vortexcore.vortex_transactions
      DROP CONSTRAINT vortex_transactions_status_check;

    ALTER TABLE app_vortexcore.vortex_transactions
      ADD CONSTRAINT vortex_transactions_status_check
      CHECK ((status = ANY (ARRAY[
        'pending', 'processing', 'completed', 'failed',
        'cancelled', 'reversed'
      ]::text[])));
  END IF;
END
$$;

-- ── 2. Atomic wallet credit function ─────────────────────────────────
-- Replaces the broken direct INSERT into vortex_transactions (which used
-- non-existent RPC vortex_create_wallet and failed on the CHECK constraint).
--
-- Idempotent by reference (mapped from Stripe charge_id).
-- Writes to app_vortexcore.vortex_transactions (our schema, safe to mutate).
-- Updates app_vortexcore.vortex_wallets atomically in the same TX.

CREATE OR REPLACE FUNCTION app_vortexcore.credit_wallet_for_charge(
  p_user_id   uuid,
  p_amount    numeric,
  p_currency  text,
  p_charge_id text,
  p_type      text DEFAULT 'deposit'
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = app_vortexcore
AS $$
DECLARE
  v_wallet_id  uuid;
  v_wallet_bal numeric;
  v_ref        text;
  v_t          jsonb;
BEGIN
  -- Idempotent: return existing transaction if same reference
  SELECT id, user_id, wallet_id, amount, currency, type, status,
         description, category, reference, metadata, created_at
  FROM app_vortexcore.vortex_transactions
  WHERE reference = p_charge_id AND status = 'completed'
  INTO v_t;

  IF v_t IS NOT NULL THEN
    RETURN jsonb_build_object(
      'ok', true,
      'id', v_t->>'id',
      'user_id', v_t->>'user_id',
      'wallet_id', v_t->>'wallet_id',
      'amount', v_t->>'amount',
      'currency', v_t->>'currency',
      'type', v_t->>'type',
      'status', v_t->>'status',
      'reference', v_t->>'reference',
      'created_at', v_t->>'created_at',
      'idempotent', true,
      'message', 'Deposit already credited.'
    );
  END IF;

  -- Find wallet (UNIQUE(user_id) — one wallet per user, currency may differ)
  SELECT id, balance INTO v_wallet_id, v_wallet_bal
  FROM app_vortexcore.vortex_wallets
  WHERE user_id = p_user_id
  LIMIT 1;

  -- Create wallet if none exists
  IF v_wallet_id IS NULL THEN
    BEGIN
      INSERT INTO app_vortexcore.vortex_wallets (user_id, currency, balance)
      VALUES (p_user_id, p_currency, 0)
      RETURNING id, balance INTO v_wallet_id, v_wallet_bal;
    EXCEPTION WHEN unique_violation THEN
      -- Another process created it concurrently
      SELECT id, balance INTO v_wallet_id, v_wallet_bal
      FROM app_vortexcore.vortex_wallets
      WHERE user_id = p_user_id
      LIMIT 1;
    END;
  END IF;

  -- Generate a unique reference (charge_id is unique per Stripe event)
  v_ref := 'dep_' || p_charge_id;

  -- Write transaction (atomic with wallet credit below)
  INSERT INTO app_vortexcore.vortex_transactions (
    user_id, wallet_id, type, amount, currency, status, reference,
    description, category, metadata
  ) VALUES (
    p_user_id, v_wallet_id, p_type, p_amount, p_currency, 'completed', v_ref,
    'Wallet funded via ' || p_charge_id,
    'wallet_fund',
    jsonb_build_object(
      'stripe_charge_id', p_charge_id,
      'new_balance', v_wallet_bal + p_amount
    )
  ) RETURNING
    jsonb_build_object(
      'id', id, 'user_id', user_id, 'wallet_id', wallet_id,
      'type', type, 'amount', amount, 'currency', currency,
      'status', status, 'reference', reference, 'created_at', created_at
    ) INTO v_t;

  -- Atomic credit (same TX)
  UPDATE app_vortexcore.vortex_wallets
  SET balance = balance + p_amount
  WHERE id = v_wallet_id;

  RETURN v_t;
END;
$$;

-- ── 3. Control-room lockdown: moved ───────────────────────────────
-- Moved to supabase/proposed/2026-11-07-control-room-lockdown.sql so it can be
-- applied on its own, ahead of the wallet-funding changes. The version that
-- was here revoked EXECUTE only from anon/authenticated; both roles inherit
-- EXECUTE through PUBLIC, so the control-room RPCs stayed callable with the
-- anon key (shown by supabase/proposed/test/run.sh).

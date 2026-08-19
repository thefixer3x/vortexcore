-- Atomic wallet balance adjustment, used by the Stripe Issuing webhook to
-- debit/credit a user's wallet when a virtual card transaction settles.
-- Only callable by the service role (edge functions) — never exposed to
-- authenticated clients, since balance changes here must be driven by a
-- verified Stripe event, not a direct client call.

CREATE OR REPLACE FUNCTION public.adjust_wallet_balance(p_wallet_id uuid, p_delta numeric)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance numeric;
BEGIN
  UPDATE public.vortex_wallets
  SET balance = balance + p_delta, updated_at = now()
  WHERE id = p_wallet_id
  RETURNING balance INTO v_balance;

  RETURN v_balance;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.adjust_wallet_balance(uuid, numeric) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.adjust_wallet_balance(uuid, numeric) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.adjust_wallet_balance(uuid, numeric) FROM anon;
GRANT EXECUTE ON FUNCTION public.adjust_wallet_balance(uuid, numeric) TO service_role;

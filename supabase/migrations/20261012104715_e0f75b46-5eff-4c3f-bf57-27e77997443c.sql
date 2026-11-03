-- Live obligations feed
CREATE TABLE public.vortex_obligation_feed (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL,
  message text NOT NULL,
  obligation_id uuid,
  transaction_id uuid,
  amount numeric,
  currency text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.vortex_obligation_feed TO authenticated;
GRANT ALL ON public.vortex_obligation_feed TO service_role;
ALTER TABLE public.vortex_obligation_feed ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own obligation feed" ON public.vortex_obligation_feed FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE INDEX vortex_obligation_feed_user_idx ON public.vortex_obligation_feed (user_id, created_at DESC);

ALTER TABLE public.vortex_obligations REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vortex_obligations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vortex_obligation_feed;

CREATE OR REPLACE FUNCTION public.vortex_next_due(p_due timestamptz, p_rec text)
RETURNS timestamptz LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE p_rec WHEN 'weekly' THEN p_due + interval '7 days'
    WHEN 'monthly' THEN p_due + interval '1 month'
    WHEN 'quarterly' THEN p_due + interval '3 months'
    WHEN 'yearly' THEN p_due + interval '1 year' ELSE p_due END
$$;

-- On each new transaction: match it to an open obligation, or log it for re-detection
CREATE OR REPLACE FUNCTION public.vortex_on_transaction_inserted()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, app_vortexcore AS $$
DECLARE ob record;
BEGIN
  IF NEW.user_id IS NULL OR coalesce(NEW.metadata, '{}'::jsonb) ? 'obligation_id' THEN RETURN NEW; END IF;
  IF NEW.type IN ('debit','payment','withdrawal','transfer') THEN
    SELECT * INTO ob FROM public.vortex_obligations o
    WHERE o.user_id = NEW.user_id AND o.status <> 'paid' AND o.amount IS NOT NULL
      AND abs(o.amount - abs(NEW.amount)) <= greatest(o.amount * 0.05, 1)
      AND coalesce(NEW.description,'') ILIKE '%' || split_part(o.title, ' ', 1) || '%'
    ORDER BY o.due_date NULLS LAST LIMIT 1;
    IF FOUND THEN
      UPDATE public.vortex_obligations SET
        status = CASE WHEN recurrence = 'none' OR due_date IS NULL THEN 'paid' ELSE 'upcoming' END,
        due_date = CASE WHEN recurrence = 'none' OR due_date IS NULL THEN due_date ELSE public.vortex_next_due(due_date, recurrence) END,
        metadata = jsonb_set(coalesce(metadata,'{}'::jsonb), '{payments}', coalesce(metadata->'payments','[]'::jsonb) ||
          jsonb_build_object('amount', abs(NEW.amount), 'paid_at', NEW.created_at, 'transaction_id', NEW.id, 'method', 'matched'))
      WHERE id = ob.id;
      INSERT INTO public.vortex_obligation_feed (user_id, kind, message, obligation_id, transaction_id, amount, currency)
      VALUES (NEW.user_id, 'matched', 'Payment matched to ' || ob.title, ob.id, NEW.id, abs(NEW.amount), NEW.currency);
      RETURN NEW;
    END IF;
  END IF;
  INSERT INTO public.vortex_obligation_feed (user_id, kind, message, transaction_id, amount, currency)
  VALUES (NEW.user_id, 'transaction', 'New transaction: ' || coalesce(nullif(NEW.description,''), NEW.type), NEW.id, NEW.amount, NEW.currency);
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.vortex_on_transaction_inserted() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER vortex_transaction_obligation_feed AFTER INSERT ON app_vortexcore.vortex_transactions
FOR EACH ROW EXECUTE FUNCTION public.vortex_on_transaction_inserted();

-- Pay an obligation from the wallet (server only)
CREATE OR REPLACE FUNCTION public.vortex_pay_obligation(p_user_id uuid, p_obligation_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, app_vortexcore AS $$
DECLARE ob record; w record; tx_id uuid; paid_at timestamptz := now();
BEGIN
  SELECT * INTO ob FROM public.vortex_obligations WHERE id = p_obligation_id AND user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'OBLIGATION_NOT_FOUND'; END IF;
  IF ob.status = 'paid' THEN RAISE EXCEPTION 'ALREADY_PAID'; END IF;
  IF ob.amount IS NULL OR ob.amount <= 0 THEN RAISE EXCEPTION 'NO_AMOUNT'; END IF;
  SELECT * INTO w FROM app_vortexcore.vortex_wallets
    WHERE user_id = p_user_id AND currency = ob.currency AND NOT coalesce(is_locked,false)
    ORDER BY balance DESC LIMIT 1 FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'NO_WALLET'; END IF;
  IF w.balance < ob.amount THEN RAISE EXCEPTION 'INSUFFICIENT_FUNDS'; END IF;

  UPDATE app_vortexcore.vortex_wallets SET balance = balance - ob.amount WHERE id = w.id;
  INSERT INTO app_vortexcore.vortex_transactions (user_id, wallet_id, amount, currency, type, status, description, category, metadata, completed_at)
  VALUES (p_user_id, w.id, ob.amount, ob.currency, 'payment', 'completed', 'Payment: ' || ob.title, ob.category,
          jsonb_build_object('obligation_id', ob.id), paid_at)
  RETURNING id INTO tx_id;

  UPDATE public.vortex_obligations SET
    status = CASE WHEN ob.recurrence = 'none' OR ob.due_date IS NULL THEN 'paid' ELSE 'upcoming' END,
    due_date = CASE WHEN ob.recurrence = 'none' OR ob.due_date IS NULL THEN ob.due_date ELSE public.vortex_next_due(ob.due_date, ob.recurrence) END,
    metadata = jsonb_set(coalesce(ob.metadata,'{}'::jsonb), '{payments}', coalesce(ob.metadata->'payments','[]'::jsonb) ||
      jsonb_build_object('amount', ob.amount, 'paid_at', paid_at, 'transaction_id', tx_id, 'method', 'wallet'))
  WHERE id = ob.id;

  INSERT INTO public.vortex_obligation_feed (user_id, kind, message, obligation_id, transaction_id, amount, currency)
  VALUES (p_user_id, 'paid', 'Paid ' || ob.title || ' from wallet', ob.id, tx_id, ob.amount, ob.currency);

  RETURN jsonb_build_object('transaction_id', tx_id, 'amount', ob.amount, 'currency', ob.currency,
    'paid_at', paid_at, 'new_balance', w.balance - ob.amount);
END $$;
REVOKE ALL ON FUNCTION public.vortex_pay_obligation(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.vortex_pay_obligation(uuid, uuid) TO service_role;

-- Admin management of company projects (writes go through admin-checked server code)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_projects TO service_role;
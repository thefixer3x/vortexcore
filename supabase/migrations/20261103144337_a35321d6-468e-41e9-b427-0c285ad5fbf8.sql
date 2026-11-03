-- ===== 1. Obligations: move real tables from public into app_vortexcore =====
ALTER TABLE public.vortex_obligations SET SCHEMA app_vortexcore;
ALTER TABLE public.vortex_obligation_feed SET SCHEMA app_vortexcore;
ALTER TABLE public.vortex_obligation_detections SET SCHEMA app_vortexcore;

GRANT SELECT, INSERT, UPDATE, DELETE ON app_vortexcore.vortex_obligations TO authenticated;
GRANT SELECT ON app_vortexcore.vortex_obligation_feed TO authenticated;
GRANT SELECT, INSERT, UPDATE ON app_vortexcore.vortex_obligation_detections TO authenticated;
GRANT ALL ON app_vortexcore.vortex_obligations, app_vortexcore.vortex_obligation_feed, app_vortexcore.vortex_obligation_detections TO service_role;
REVOKE ALL ON app_vortexcore.vortex_obligations, app_vortexcore.vortex_obligation_feed, app_vortexcore.vortex_obligation_detections FROM anon;

DO $$
DECLARE c record;
BEGIN
  FOR c IN SELECT conname FROM pg_constraint
    WHERE conrelid = 'app_vortexcore.vortex_obligations'::regclass AND contype = 'c'
      AND (pg_get_constraintdef(oid) ILIKE '%status%' OR pg_get_constraintdef(oid) ILIKE '%source%' OR pg_get_constraintdef(oid) ILIKE '%category%')
  LOOP
    EXECUTE format('ALTER TABLE app_vortexcore.vortex_obligations DROP CONSTRAINT %I', c.conname);
  END LOOP;
END $$;
ALTER TABLE app_vortexcore.vortex_obligations
  ADD CONSTRAINT vortex_obligations_status_check CHECK (status IN ('upcoming','due_soon','overdue','completed','dismissed','paid')),
  ADD CONSTRAINT vortex_obligations_source_check CHECK (source IN ('ai_detected','manual','imported','ai','statement')),
  ADD CONSTRAINT vortex_obligations_category_check CHECK (category IN ('loan','bill','subscription','kyc','regulatory','tax','transfer','other','utility','rent','insurance','salary'));

CREATE VIEW public.vortex_obligations WITH (security_invoker = true) AS
  SELECT id, user_id, title, description, category, amount, currency, due_date, recurrence, status, source, confidence, source_ref, metadata, created_at, updated_at
  FROM app_vortexcore.vortex_obligations;
CREATE VIEW public.vortex_obligation_feed WITH (security_invoker = true) AS
  SELECT id, user_id, kind, message, obligation_id, transaction_id, amount, currency, created_at
  FROM app_vortexcore.vortex_obligation_feed;
CREATE VIEW public.vortex_obligation_detections WITH (security_invoker = true) AS
  SELECT id, user_id, run_started_at, run_completed_at, transactions_scanned, obligations_created, status, error, created_at
  FROM app_vortexcore.vortex_obligation_detections;
REVOKE ALL ON public.vortex_obligations, public.vortex_obligation_feed, public.vortex_obligation_detections FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vortex_obligations TO authenticated;
GRANT SELECT ON public.vortex_obligation_feed TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.vortex_obligation_detections TO authenticated;
GRANT ALL ON public.vortex_obligations, public.vortex_obligation_feed, public.vortex_obligation_detections TO service_role;

-- ===== 2. Obligation functions target app_vortexcore =====
CREATE OR REPLACE FUNCTION public.vortex_on_transaction_inserted()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'app_vortexcore', 'public'
AS $function$
DECLARE ob record;
BEGIN
  IF NEW.user_id IS NULL OR coalesce(NEW.metadata, '{}'::jsonb) ? 'obligation_id' THEN RETURN NEW; END IF;
  IF NEW.type IN ('debit','transfer','fee') THEN
    SELECT * INTO ob FROM app_vortexcore.vortex_obligations o
    WHERE o.user_id = NEW.user_id AND o.status NOT IN ('paid','completed','dismissed') AND o.amount IS NOT NULL
      AND abs(o.amount - abs(NEW.amount)) <= greatest(o.amount * 0.05, 1)
      AND coalesce(NEW.description,'') ILIKE '%' || split_part(o.title, ' ', 1) || '%'
    ORDER BY o.due_date NULLS LAST LIMIT 1;
    IF FOUND THEN
      UPDATE app_vortexcore.vortex_obligations SET
        status = CASE WHEN recurrence = 'none' OR due_date IS NULL THEN 'paid' ELSE 'upcoming' END,
        due_date = CASE WHEN recurrence = 'none' OR due_date IS NULL THEN due_date ELSE public.vortex_next_due(due_date, recurrence) END,
        metadata = jsonb_set(coalesce(metadata,'{}'::jsonb), '{payments}', coalesce(metadata->'payments','[]'::jsonb) ||
          jsonb_build_object('amount', abs(NEW.amount), 'paid_at', NEW.created_at, 'transaction_id', NEW.id, 'method', 'matched'))
      WHERE id = ob.id;
      INSERT INTO app_vortexcore.vortex_obligation_feed (user_id, kind, message, obligation_id, transaction_id, amount, currency)
      VALUES (NEW.user_id, 'matched', 'Payment matched to ' || ob.title, ob.id, NEW.id, abs(NEW.amount), NEW.currency);
      RETURN NEW;
    END IF;
  END IF;
  INSERT INTO app_vortexcore.vortex_obligation_feed (user_id, kind, message, transaction_id, amount, currency)
  VALUES (NEW.user_id, 'transaction', 'New transaction: ' || coalesce(nullif(NEW.description,''), NEW.type), NEW.id, NEW.amount, NEW.currency);
  RETURN NEW;
END $function$;
REVOKE ALL ON FUNCTION public.vortex_on_transaction_inserted() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.vortex_pay_obligation(p_user_id uuid, p_obligation_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'app_vortexcore', 'public'
AS $function$
DECLARE ob record; w record; tx_id uuid; paid_at timestamptz := now();
BEGIN
  SELECT * INTO ob FROM app_vortexcore.vortex_obligations WHERE id = p_obligation_id AND user_id = p_user_id FOR UPDATE;
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
  VALUES (p_user_id, w.id, ob.amount, ob.currency, 'debit', 'completed', 'Payment: ' || ob.title, ob.category,
          jsonb_build_object('obligation_id', ob.id, 'kind', 'obligation_payment'), paid_at)
  RETURNING id INTO tx_id;

  UPDATE app_vortexcore.vortex_obligations SET
    status = CASE WHEN ob.recurrence = 'none' OR ob.due_date IS NULL THEN 'paid' ELSE 'upcoming' END,
    due_date = CASE WHEN ob.recurrence = 'none' OR ob.due_date IS NULL THEN ob.due_date ELSE public.vortex_next_due(ob.due_date, ob.recurrence) END,
    metadata = jsonb_set(coalesce(ob.metadata,'{}'::jsonb), '{payments}', coalesce(ob.metadata->'payments','[]'::jsonb) ||
      jsonb_build_object('amount', ob.amount, 'paid_at', paid_at, 'transaction_id', tx_id, 'method', 'wallet'))
  WHERE id = ob.id;

  INSERT INTO app_vortexcore.vortex_obligation_feed (user_id, kind, message, obligation_id, transaction_id, amount, currency)
  VALUES (p_user_id, 'paid', 'Paid ' || ob.title || ' from wallet', ob.id, tx_id, ob.amount, ob.currency);

  RETURN jsonb_build_object('transaction_id', tx_id, 'amount', ob.amount, 'currency', ob.currency,
    'paid_at', paid_at, 'new_balance', w.balance - ob.amount);
END $function$;
REVOKE ALL ON FUNCTION public.vortex_pay_obligation(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.vortex_pay_obligation(uuid, uuid) TO service_role;

-- ===== 3. Pricing plans (VortexCore's own Stripe prices only) =====
CREATE TABLE app_vortexcore.vortex_pricing_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_key text NOT NULL UNIQUE,
  name text NOT NULL,
  price numeric(12,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  billing_interval text NOT NULL DEFAULT 'month',
  stripe_price_id text,
  previous_price_ids text[] NOT NULL DEFAULT '{}',
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  card_limit integer,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT vortex_pricing_tiers_key_check CHECK (tier_key IN ('free','hobby','pro','enterprise')),
  CONSTRAINT vortex_pricing_tiers_interval_check CHECK (billing_interval IN ('month','year')),
  CONSTRAINT vortex_pricing_tiers_price_check CHECK (price >= 0)
);
GRANT SELECT ON app_vortexcore.vortex_pricing_tiers TO anon, authenticated;
GRANT ALL ON app_vortexcore.vortex_pricing_tiers TO service_role;
ALTER TABLE app_vortexcore.vortex_pricing_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active plans are public" ON app_vortexcore.vortex_pricing_tiers
  FOR SELECT TO anon, authenticated USING (is_active);
CREATE TRIGGER trg_touch_updated_at BEFORE UPDATE ON app_vortexcore.vortex_pricing_tiers
  FOR EACH ROW EXECUTE FUNCTION app_vortexcore.touch_updated_at();

INSERT INTO app_vortexcore.vortex_pricing_tiers (tier_key, name, price, stripe_price_id, features, card_limit, sort_order) VALUES
  ('free', 'Free', 0, NULL, '[{"label":"Basic dashboard"},{"label":"Up to 3 virtual cards"},{"label":"10 VortexAI questions a day"}]', 3, 0),
  ('hobby', 'Hobby', 9.99, 'price_1UOr852KF4vMCpn8TlJ5MMn9', '[{"label":"Everything in Free"},{"label":"50 VortexAI questions a day"},{"label":"Advanced VortexAI answers"},{"label":"Bank statement import"}]', 10, 1),
  ('pro', 'Pro', 29.99, 'price_1UOr872KF4vMCpn81Q4FSS67', '[{"label":"Detailed VortexAI Insights"},{"label":"Unlimited virtual cards"},{"label":"100 VortexAI questions a day"},{"label":"Advanced analytics"}]', NULL, 2),
  ('enterprise', 'Enterprise', 49.99, 'price_1UOr882KF4vMCpn8mLZJAN20', '[{"label":"Everything in Pro"},{"label":"500 VortexAI questions a day"},{"label":"Multiple sub-users","comingSoon":true},{"label":"Dedicated support","comingSoon":true}]', NULL, 3);

CREATE VIEW public.vortex_pricing_tiers WITH (security_invoker = true) AS
  SELECT id, tier_key, name, price, currency, billing_interval, stripe_price_id, previous_price_ids,
         features, card_limit, is_active, sort_order, created_at, updated_at
  FROM app_vortexcore.vortex_pricing_tiers;
GRANT SELECT ON public.vortex_pricing_tiers TO anon, authenticated;
GRANT ALL ON public.vortex_pricing_tiers TO service_role;

-- ===== 4. Control room lockdown (server key only) =====
REVOKE ALL ON ALL TABLES IN SCHEMA control_room FROM anon, authenticated;
REVOKE USAGE ON SCHEMA control_room FROM anon, authenticated;
ALTER TABLE control_room.audit_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.projects FROM anon, authenticated;

-- ===== 5. VortexCore admin data in control_room =====
CREATE VIEW public.vortex_cockpit_projects WITH (security_invoker = true) AS
  SELECT id, name, description, type, status, metadata, created_at, updated_at
  FROM control_room.projects
  WHERE metadata->>'app_id' = 'vortexcore'
  WITH LOCAL CHECK OPTION;
REVOKE ALL ON public.vortex_cockpit_projects FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vortex_cockpit_projects TO service_role;

CREATE OR REPLACE FUNCTION control_room.vortex_admin_audit(p_user_id uuid, p_action text, p_details jsonb)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'control_room'
AS $function$
  INSERT INTO control_room.audit_log (app_id, user_id, action, details)
  VALUES ('vortexcore', p_user_id, left(p_action, 80), coalesce(p_details, '{}'::jsonb));
$function$;
REVOKE ALL ON FUNCTION control_room.vortex_admin_audit(uuid, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION control_room.vortex_admin_audit(uuid, text, jsonb) TO service_role;

CREATE OR REPLACE FUNCTION control_room.vortex_admin_stats()
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'control_room', 'app_vortexcore', 'public'
AS $function$
  WITH vc_users AS (
    SELECT user_id FROM app_vortexcore.vortex_wallets
    UNION SELECT user_id FROM app_vortexcore.vortex_transactions
    UNION SELECT user_id FROM app_vortexcore.vortex_settings
    UNION SELECT user_id FROM app_vortexcore.ai_chat_sessions
    UNION SELECT user_id FROM app_vortexcore.vortex_obligations
  ), vc AS (
    SELECT u.id, u.created_at FROM public.users u JOIN vc_users v ON v.user_id = u.id
  )
  SELECT jsonb_build_object(
    'totals', jsonb_build_object(
      'vortexcore_users', (SELECT count(*) FROM vc),
      'organisation_users', (SELECT count(*) FROM public.users),
      'organisation_admins', (SELECT count(*) FROM public.users WHERE role IN ('admin','superadmin')),
      'transactions', (SELECT count(*) FROM app_vortexcore.vortex_transactions),
      'obligations', (SELECT count(*) FROM app_vortexcore.vortex_obligations),
      'open_obligations', (SELECT count(*) FROM app_vortexcore.vortex_obligations WHERE status NOT IN ('paid','completed','dismissed')),
      'projects', (SELECT count(*) FROM control_room.projects WHERE metadata->>'app_id' = 'vortexcore'),
      'wallets', (SELECT count(*) FROM app_vortexcore.vortex_wallets)
    ),
    'signups', coalesce((SELECT jsonb_agg(jsonb_build_object('month', to_char(m, 'YYYY-MM'), 'count', coalesce(c, 0)) ORDER BY m)
      FROM generate_series(date_trunc('month', now()) - interval '11 months', date_trunc('month', now()), interval '1 month') m
      LEFT JOIN (SELECT date_trunc('month', created_at) mm, count(*) c FROM vc GROUP BY 1) u ON u.mm = m), '[]'::jsonb),
    'transactions_daily', coalesce((SELECT jsonb_agg(jsonb_build_object('day', to_char(d, 'YYYY-MM-DD'), 'credit', coalesce(cr, 0), 'debit', coalesce(db, 0), 'count', coalesce(n, 0)) ORDER BY d)
      FROM generate_series(date_trunc('day', now()) - interval '29 days', date_trunc('day', now()), interval '1 day') d
      LEFT JOIN (SELECT date_trunc('day', created_at) dd,
                        sum(CASE WHEN type IN ('credit','refund','reversal') THEN abs(amount) ELSE 0 END) cr,
                        sum(CASE WHEN type IN ('debit','transfer','fee') THEN abs(amount) ELSE 0 END) db,
                        count(*) n
                 FROM app_vortexcore.vortex_transactions GROUP BY 1) t ON t.dd = d), '[]'::jsonb),
    'obligations_by_status', coalesce((SELECT jsonb_agg(jsonb_build_object('status', status, 'count', n)) FROM (SELECT status, count(*) n FROM app_vortexcore.vortex_obligations GROUP BY 1) s), '[]'::jsonb),
    'obligations_by_category', coalesce((SELECT jsonb_agg(jsonb_build_object('category', category, 'count', n)) FROM (SELECT category, count(*) n FROM app_vortexcore.vortex_obligations GROUP BY 1) s), '[]'::jsonb),
    'wallets_by_currency', coalesce((SELECT jsonb_agg(jsonb_build_object('currency', currency, 'balance', b, 'count', n)) FROM (SELECT currency, sum(balance) b, count(*) n FROM app_vortexcore.vortex_wallets GROUP BY 1) s), '[]'::jsonb),
    'plans', coalesce((SELECT jsonb_agg(jsonb_build_object('tier', tier_name, 'count', n)) FROM (SELECT coalesce(t.tier_name,'free') tier_name, count(*) n FROM public.user_tiers t JOIN vc ON vc.id = t.user_id GROUP BY 1) s), '[]'::jsonb),
    'platform_apps', coalesce((SELECT jsonb_agg(jsonb_build_object('id', id, 'name', name, 'status', status, 'migration_status', migration_status, 'is_active', is_active) ORDER BY name) FROM control_room.apps), '[]'::jsonb),
    'recent_audit', coalesce((SELECT jsonb_agg(jsonb_build_object('action', action, 'details', details, 'user_id', user_id, 'created_at', created_at) ORDER BY created_at DESC)
      FROM (SELECT * FROM control_room.audit_log WHERE app_id = 'vortexcore' ORDER BY created_at DESC LIMIT 15) a), '[]'::jsonb)
  )
$function$;
REVOKE ALL ON FUNCTION control_room.vortex_admin_stats() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION control_room.vortex_admin_stats() TO service_role;

-- Public facades (control_room is not exposed through the API).
CREATE OR REPLACE FUNCTION public.vortex_admin_stats()
 RETURNS jsonb LANGUAGE sql STABLE SET search_path TO 'public'
AS $$ SELECT control_room.vortex_admin_stats() $$;
CREATE OR REPLACE FUNCTION public.vortex_admin_audit(p_user_id uuid, p_action text, p_details jsonb)
 RETURNS void LANGUAGE sql SET search_path TO 'public'
AS $$ SELECT control_room.vortex_admin_audit(p_user_id, p_action, p_details) $$;
REVOKE ALL ON FUNCTION public.vortex_admin_stats() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.vortex_admin_audit(uuid, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.vortex_admin_stats() TO service_role;
GRANT EXECUTE ON FUNCTION public.vortex_admin_audit(uuid, text, jsonb) TO service_role;
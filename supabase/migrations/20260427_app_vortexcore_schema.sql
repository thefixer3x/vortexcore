-- =====================================================================
-- VortexCore App Schema Migration
-- =====================================================================
-- Creates:
--   control_room.*          Admin cockpit (app registry, stages, health)
--   app_vortexcore.*        VortexCore domain tables
--   public views            Backward-compat facades (vortex_wallets etc.)
--   public stripe tables    Billing (stripe_customers, stripe_subscriptions)
-- Idempotent: all CREATE uses IF NOT EXISTS. No DROP of existing tables.
-- =====================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================================
-- 1. CONTROL ROOM
-- =====================================================================
CREATE SCHEMA IF NOT EXISTS control_room;

CREATE TABLE IF NOT EXISTS control_room.apps (
  id           text PRIMARY KEY,
  display_name text NOT NULL,
  schema_name  text NOT NULL UNIQUE,
  description  text,
  owner_team   text,
  status       text NOT NULL DEFAULT 'active'
                 CHECK (status IN ('active','paused','deprecated','archived')),
  metadata     jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS control_room.project_stages (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id     text NOT NULL REFERENCES control_room.apps(id) ON DELETE CASCADE,
  stage      text NOT NULL
               CHECK (stage IN ('design','build','uat','beta','ga','sunset')),
  notes      text,
  entered_at timestamptz NOT NULL DEFAULT now(),
  exited_at  timestamptz
);
CREATE INDEX IF NOT EXISTS idx_project_stages_app ON control_room.project_stages(app_id);

CREATE TABLE IF NOT EXISTS control_room.project_audit_log (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id        text REFERENCES control_room.apps(id) ON DELETE SET NULL,
  actor_user_id uuid,
  action        text NOT NULL,
  target        text,
  payload       jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_app_time ON control_room.project_audit_log(app_id, occurred_at DESC);

CREATE TABLE IF NOT EXISTS control_room.system_health (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id      text REFERENCES control_room.apps(id) ON DELETE CASCADE,
  component   text NOT NULL,
  status      text NOT NULL CHECK (status IN ('ok','degraded','down','unknown')),
  latency_ms  integer,
  details     jsonb NOT NULL DEFAULT '{}'::jsonb,
  recorded_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_health_app_time ON control_room.system_health(app_id, recorded_at DESC);

ALTER TABLE control_room.apps              ENABLE ROW LEVEL SECURITY;
ALTER TABLE control_room.project_stages    ENABLE ROW LEVEL SECURITY;
ALTER TABLE control_room.project_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE control_room.system_health     ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- 2. APP_VORTEXCORE SCHEMA
-- =====================================================================
CREATE SCHEMA IF NOT EXISTS app_vortexcore;

CREATE OR REPLACE FUNCTION app_vortexcore.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = pg_catalog, app_vortexcore AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END; $$;

-- 2.1 vortex_wallets
CREATE TABLE IF NOT EXISTS app_vortexcore.vortex_wallets (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL UNIQUE,
  balance     numeric(18,2) NOT NULL DEFAULT 0,
  currency    text NOT NULL DEFAULT 'USD',
  is_locked   boolean NOT NULL DEFAULT false,
  metadata    jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- 2.2 vortex_transactions
CREATE TABLE IF NOT EXISTS app_vortexcore.vortex_transactions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL,
  wallet_id       uuid REFERENCES app_vortexcore.vortex_wallets(id) ON DELETE SET NULL,
  amount          numeric(18,2) NOT NULL,
  currency        text NOT NULL DEFAULT 'USD',
  type            text NOT NULL CHECK (type IN ('credit','debit','transfer','refund','fee','reversal')),
  status          text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','processing','completed','failed','cancelled')),
  description     text,
  category        text,
  reference       text UNIQUE,
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  completed_at    timestamptz
);
CREATE INDEX IF NOT EXISTS idx_vc_tx_user ON app_vortexcore.vortex_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vc_tx_wallet ON app_vortexcore.vortex_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_vc_tx_status ON app_vortexcore.vortex_transactions(status);

-- 2.3 vortex_settings
CREATE TABLE IF NOT EXISTS app_vortexcore.vortex_settings (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL,
  key        text NOT NULL,
  value      jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, key)
);
CREATE INDEX IF NOT EXISTS idx_vc_settings_user ON app_vortexcore.vortex_settings(user_id);

-- 2.4 ai_chat_sessions
CREATE TABLE IF NOT EXISTS app_vortexcore.ai_chat_sessions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL,
  title           text,
  model           text,
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  last_message_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_vc_sessions_user ON app_vortexcore.ai_chat_sessions(user_id, updated_at DESC);

-- 2.5 ai_chat_messages
CREATE TABLE IF NOT EXISTS app_vortexcore.ai_chat_messages (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES app_vortexcore.ai_chat_sessions(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL,
  role       text NOT NULL CHECK (role IN ('system','user','assistant','tool')),
  content    text NOT NULL,
  tokens     integer,
  metadata   jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_vc_messages_session ON app_vortexcore.ai_chat_messages(session_id, created_at);

-- 2.6 accounts (linked bank/external)
CREATE TABLE IF NOT EXISTS app_vortexcore.accounts (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL,
  provider            text NOT NULL,
  provider_account_id text,
  account_name        text NOT NULL,
  account_type        text,
  currency            text NOT NULL DEFAULT 'NGN',
  balance             numeric(18,2) NOT NULL DEFAULT 0,
  is_active           boolean NOT NULL DEFAULT true,
  metadata            jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_vc_accounts_user ON app_vortexcore.accounts(user_id);

-- =====================================================================
-- 3. UPDATED_AT TRIGGERS
-- =====================================================================
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'vortex_wallets','vortex_transactions','vortex_settings',
    'ai_chat_sessions','accounts'
  ] LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_touch_updated_at ON app_vortexcore.%I;
       CREATE TRIGGER trg_touch_updated_at BEFORE UPDATE ON app_vortexcore.%I
         FOR EACH ROW EXECUTE FUNCTION app_vortexcore.touch_updated_at();', t, t);
  END LOOP;
END $$;

-- =====================================================================
-- 4. RLS — owner-scoped
-- =====================================================================
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'vortex_wallets','vortex_transactions','vortex_settings',
    'ai_chat_sessions','ai_chat_messages','accounts'
  ] LOOP
    EXECUTE format('ALTER TABLE app_vortexcore.%I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format($f$
      DROP POLICY IF EXISTS "owner_select" ON app_vortexcore.%1$I;
      CREATE POLICY "owner_select" ON app_vortexcore.%1$I
        FOR SELECT TO authenticated USING (auth.uid() = user_id);
      DROP POLICY IF EXISTS "owner_insert" ON app_vortexcore.%1$I;
      CREATE POLICY "owner_insert" ON app_vortexcore.%1$I
        FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
      DROP POLICY IF EXISTS "owner_update" ON app_vortexcore.%1$I;
      CREATE POLICY "owner_update" ON app_vortexcore.%1$I
        FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
      DROP POLICY IF EXISTS "owner_delete" ON app_vortexcore.%1$I;
      CREATE POLICY "owner_delete" ON app_vortexcore.%1$I
        FOR DELETE TO authenticated USING (auth.uid() = user_id);
    $f$, t);
  END LOOP;
END $$;

-- =====================================================================
-- 5. PUBLIC FACADE VIEWS
-- Only created when no base table of that name exists in public.
-- These let the frontend query .from('vortex_wallets') without code changes.
-- =====================================================================
DO $$
DECLARE
  views text[][] := ARRAY[
    ['vortex_wallets',      'vortex_wallets'],
    ['vortex_transactions', 'vortex_transactions'],
    ['vortex_settings',     'vortex_settings'],
    ['ai_chat_sessions',    'ai_chat_sessions'],
    ['accounts',            'accounts']
  ];
  pub_name text; src_name text; i int;
BEGIN
  FOR i IN 1 .. array_length(views, 1) LOOP
    pub_name := views[i][1];
    src_name := views[i][2];
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = pub_name AND table_type = 'BASE TABLE'
    ) THEN
      RAISE NOTICE 'Skipping public.% — base table exists. Facade not needed.', pub_name;
    ELSE
      EXECUTE format(
        'CREATE OR REPLACE VIEW public.%I WITH (security_invoker = true) AS SELECT * FROM app_vortexcore.%I;',
        pub_name, src_name
      );
      EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated;', pub_name);
      RAISE NOTICE 'Created facade: public.% -> app_vortexcore.%', pub_name, src_name;
    END IF;
  END LOOP;
END $$;

-- =====================================================================
-- 6. STRIPE BILLING (Phase 3 — required for webhook to function)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.stripe_customers (
  user_id     uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id text NOT NULL UNIQUE,
  created_at  timestamptz DEFAULT now()
);
ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user reads own customer" ON public.stripe_customers;
CREATE POLICY "user reads own customer"
  ON public.stripe_customers FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "service role writes customers" ON public.stripe_customers;
CREATE POLICY "service role writes customers"
  ON public.stripe_customers FOR ALL USING (auth.role() = 'service_role');

CREATE TABLE IF NOT EXISTS public.stripe_subscriptions (
  id                     uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_subscription_id text NOT NULL UNIQUE,
  customer_id            text NOT NULL REFERENCES public.stripe_customers(customer_id) ON DELETE CASCADE,
  status                 text NOT NULL,
  price_id               text,
  current_period_end     timestamptz,
  cancel_at              timestamptz,
  created_at             timestamptz DEFAULT now(),
  updated_at             timestamptz DEFAULT now()
);
ALTER TABLE public.stripe_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user reads own subscription" ON public.stripe_subscriptions;
CREATE POLICY "user reads own subscription"
  ON public.stripe_subscriptions FOR SELECT
  USING (customer_id IN (
    SELECT customer_id FROM public.stripe_customers WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "service role writes subscriptions" ON public.stripe_subscriptions;
CREATE POLICY "service role writes subscriptions"
  ON public.stripe_subscriptions FOR ALL USING (auth.role() = 'service_role');

-- =====================================================================
-- 7. REGISTER IN CONTROL ROOM
-- =====================================================================
INSERT INTO control_room.apps (id, display_name, schema_name, description, owner_team, status)
VALUES (
  'vortexcore', 'VortexCore', 'app_vortexcore',
  'Personal finance + AI insights (wallets, transactions, virtual cards, AI chat).',
  'vortexcore-core', 'active'
)
ON CONFLICT (id) DO UPDATE
  SET display_name = EXCLUDED.display_name,
      updated_at   = now();

INSERT INTO control_room.project_stages (app_id, stage, notes)
VALUES ('vortexcore', 'uat', 'app_vortexcore schema landed 2026-04-27.')
ON CONFLICT DO NOTHING;

-- =====================================================================
-- POST-APPLY:
--   supabase gen types typescript --project-id mxtsdgkwzjzlttpotole \
--     > src/integrations/supabase/types.ts
-- =====================================================================

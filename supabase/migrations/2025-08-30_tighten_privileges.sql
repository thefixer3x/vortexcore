-- Tighten privileges: revoke broad anon access and grant minimal to authenticated
-- Note: RLS remains the primary enforcement layer; privileges must still be granted explicitly

DO $$
BEGIN
  -- Wallets
  BEGIN
    REVOKE ALL ON TABLE public.wallets FROM anon;
  EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.wallets TO authenticated;
  EXCEPTION WHEN undefined_table THEN NULL; END;

  -- Conversations
  BEGIN
    REVOKE ALL ON TABLE public.conversations FROM anon;
  EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.conversations TO authenticated;
  EXCEPTION WHEN undefined_table THEN NULL; END;

  -- Child profiles
  BEGIN
    REVOKE ALL ON TABLE public.child_profiles FROM anon;
  EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.child_profiles TO authenticated;
  EXCEPTION WHEN undefined_table THEN NULL; END;

  -- Transactions
  BEGIN
    REVOKE ALL ON TABLE public.transactions FROM anon;
  EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.transactions TO authenticated;
  EXCEPTION WHEN undefined_table THEN NULL; END;

  -- AI chat sessions
  BEGIN
    REVOKE ALL ON TABLE public.ai_chat_sessions FROM anon;
  EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.ai_chat_sessions TO authenticated;
  EXCEPTION WHEN undefined_table THEN NULL; END;

  -- Vortex settings
  BEGIN
    REVOKE ALL ON TABLE public.vortex_settings FROM anon;
  EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.vortex_settings TO authenticated;
  EXCEPTION WHEN undefined_table THEN NULL; END;

  -- Stripe customers
  BEGIN
    REVOKE ALL ON TABLE public.stripe_customers FROM anon;
  EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.stripe_customers TO authenticated;
  EXCEPTION WHEN undefined_table THEN NULL; END;
END $$;


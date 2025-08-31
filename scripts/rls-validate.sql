-- RLS Validation Snapshot
-- 1) Which public tables have RLS enabled?
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2) List policies for key tables
SELECT schemaname, tablename, policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('wallets','conversations','child_profiles','transactions','ai_chat_sessions','vortex_settings','stripe_customers')
ORDER BY tablename, policyname;

-- 3) Indexes and FK integrity (ensure performant and consistent access)
SELECT schemaname, tablename, indexname, indexdef FROM pg_indexes WHERE schemaname='public' ORDER BY tablename, indexname;

-- To validate deny‑by‑default isolation, use API calls authenticated as two different users
-- and attempt cross‑user access to the tables above. See scripts/rls-validate.md for curl examples.


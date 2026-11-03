-- Applied migration 20260218070745 (fix_performance_advisors_policies_and_indexes), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.


-- ============================================================
-- FIX 1: auth_rls_initplan — wrap auth.uid() / auth.role() in (select ...)
-- ============================================================

-- client_services.clients
DROP POLICY IF EXISTS "Tenant access to clients" ON client_services.clients;
CREATE POLICY "Tenant access to clients" ON client_services.clients
  FOR ALL
  USING (
    ((metadata ->> 'org_id') = current_setting('jwt.claims.org_id', true))
    OR ((metadata ->> 'user_id') = (select auth.uid())::text)
  )
  WITH CHECK (
    ((metadata ->> 'org_id') = current_setting('jwt.claims.org_id', true))
    OR ((metadata ->> 'user_id') = (select auth.uid())::text)
  );

DROP POLICY IF EXISTS "Service role has full access to clients" ON client_services.clients;
CREATE POLICY "Service role has full access to clients" ON client_services.clients
  FOR ALL TO service_role
  USING ((select auth.role()) = 'service_role');

-- control_room.projects
DROP POLICY IF EXISTS "Tenant access to projects" ON control_room.projects;
CREATE POLICY "Tenant access to projects" ON control_room.projects
  FOR ALL
  USING (
    ((metadata ->> 'org_id') = current_setting('jwt.claims.org_id', true))
    OR ((metadata ->> 'user_id') = (select auth.uid())::text)
  )
  WITH CHECK (
    ((metadata ->> 'org_id') = current_setting('jwt.claims.org_id', true))
    OR ((metadata ->> 'user_id') = (select auth.uid())::text)
  );

DROP POLICY IF EXISTS "Service role has full access to projects" ON control_room.projects;
CREATE POLICY "Service role has full access to projects" ON control_room.projects
  FOR ALL TO service_role
  USING ((select auth.role()) = 'service_role');

-- control_room.render_services
DROP POLICY IF EXISTS "Tenant access to render_services" ON control_room.render_services;
CREATE POLICY "Tenant access to render_services" ON control_room.render_services
  FOR ALL
  USING (
    ((metadata ->> 'org_id') = current_setting('jwt.claims.org_id', true))
    OR ((metadata ->> 'user_id') = (select auth.uid())::text)
  )
  WITH CHECK (
    ((metadata ->> 'org_id') = current_setting('jwt.claims.org_id', true))
    OR ((metadata ->> 'user_id') = (select auth.uid())::text)
  );

DROP POLICY IF EXISTS "Service role has full access to render_services" ON control_room.render_services;
CREATE POLICY "Service role has full access to render_services" ON control_room.render_services
  FOR ALL TO service_role
  USING ((select auth.role()) = 'service_role');

-- vendors.vendors
DROP POLICY IF EXISTS "Tenant access to vendors" ON vendors.vendors;
CREATE POLICY "Tenant access to vendors" ON vendors.vendors
  FOR ALL
  USING (
    ((config ->> 'org_id') = current_setting('jwt.claims.org_id', true))
    OR ((config ->> 'user_id') = (select auth.uid())::text)
  )
  WITH CHECK (
    ((config ->> 'org_id') = current_setting('jwt.claims.org_id', true))
    OR ((config ->> 'user_id') = (select auth.uid())::text)
  );

DROP POLICY IF EXISTS "Service role has full access to vendors" ON vendors.vendors;
CREATE POLICY "Service role has full access to vendors" ON vendors.vendors
  FOR ALL TO service_role
  USING ((select auth.role()) = 'service_role');

-- public.user_sync_log
DROP POLICY IF EXISTS "Only service role can access user_sync_log" ON public.user_sync_log;
CREATE POLICY "Only service role can access user_sync_log" ON public.user_sync_log
  FOR ALL TO service_role
  USING ((select auth.role()) = 'service_role')
  WITH CHECK ((select auth.role()) = 'service_role');

-- public.sync_config
DROP POLICY IF EXISTS "Service role only" ON public.sync_config;
CREATE POLICY "Service role only" ON public.sync_config
  FOR ALL TO service_role
  USING ((select auth.role()) = 'service_role');

-- security_service.user_tool_configs
DROP POLICY IF EXISTS "Users can view own tool configs" ON security_service.user_tool_configs;
CREATE POLICY "Users can view own tool configs" ON security_service.user_tool_configs
  FOR SELECT
  USING (((select auth.uid()) = user_id) OR ((select auth.role()) = 'service_role'));

DROP POLICY IF EXISTS "Users can insert own tool configs" ON security_service.user_tool_configs;
CREATE POLICY "Users can insert own tool configs" ON security_service.user_tool_configs
  FOR INSERT
  WITH CHECK (((select auth.uid()) = user_id) OR ((select auth.role()) = 'service_role'));

DROP POLICY IF EXISTS "Users can update own tool configs" ON security_service.user_tool_configs;
CREATE POLICY "Users can update own tool configs" ON security_service.user_tool_configs
  FOR UPDATE
  USING (((select auth.uid()) = user_id) OR ((select auth.role()) = 'service_role'))
  WITH CHECK (((select auth.uid()) = user_id) OR ((select auth.role()) = 'service_role'));

DROP POLICY IF EXISTS "Users can delete own tool configs" ON security_service.user_tool_configs;
CREATE POLICY "Users can delete own tool configs" ON security_service.user_tool_configs
  FOR DELETE
  USING (((select auth.uid()) = user_id) OR ((select auth.role()) = 'service_role'));

-- security_service.behavior_patterns
DROP POLICY IF EXISTS "Users can view own patterns" ON security_service.behavior_patterns;
CREATE POLICY "Users can view own patterns" ON security_service.behavior_patterns
  FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own patterns" ON security_service.behavior_patterns;
CREATE POLICY "Users can insert own patterns" ON security_service.behavior_patterns
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own patterns" ON security_service.behavior_patterns;
CREATE POLICY "Users can update own patterns" ON security_service.behavior_patterns
  FOR UPDATE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own patterns" ON security_service.behavior_patterns;
CREATE POLICY "Users can delete own patterns" ON security_service.behavior_patterns
  FOR DELETE USING ((select auth.uid()) = user_id);


-- ============================================================
-- FIX 2: duplicate_index — drop the duplicate cosine index
-- (auth_events_event_id_unique is a constraint, handled separately)
-- ============================================================

DROP INDEX IF EXISTS security_service.idx_voyage_embedding_cosine;


-- ============================================================
-- FIX 3: unindexed_foreign_keys
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_identity_provenance_actor_auth_id
  ON auth_gateway.identity_provenance (actor_auth_id);

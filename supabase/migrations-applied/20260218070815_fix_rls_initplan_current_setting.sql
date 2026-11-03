-- Applied migration 20260218070815 (fix_rls_initplan_current_setting), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.


-- Wrap current_setting() in (select ...) to prevent per-row re-evaluation

-- client_services.clients
DROP POLICY IF EXISTS "Tenant access to clients" ON client_services.clients;
CREATE POLICY "Tenant access to clients" ON client_services.clients
  FOR ALL
  USING (
    ((metadata ->> 'org_id') = (select current_setting('jwt.claims.org_id', true)))
    OR ((metadata ->> 'user_id') = (select auth.uid())::text)
  )
  WITH CHECK (
    ((metadata ->> 'org_id') = (select current_setting('jwt.claims.org_id', true)))
    OR ((metadata ->> 'user_id') = (select auth.uid())::text)
  );

-- control_room.projects
DROP POLICY IF EXISTS "Tenant access to projects" ON control_room.projects;
CREATE POLICY "Tenant access to projects" ON control_room.projects
  FOR ALL
  USING (
    ((metadata ->> 'org_id') = (select current_setting('jwt.claims.org_id', true)))
    OR ((metadata ->> 'user_id') = (select auth.uid())::text)
  )
  WITH CHECK (
    ((metadata ->> 'org_id') = (select current_setting('jwt.claims.org_id', true)))
    OR ((metadata ->> 'user_id') = (select auth.uid())::text)
  );

-- control_room.render_services
DROP POLICY IF EXISTS "Tenant access to render_services" ON control_room.render_services;
CREATE POLICY "Tenant access to render_services" ON control_room.render_services
  FOR ALL
  USING (
    ((metadata ->> 'org_id') = (select current_setting('jwt.claims.org_id', true)))
    OR ((metadata ->> 'user_id') = (select auth.uid())::text)
  )
  WITH CHECK (
    ((metadata ->> 'org_id') = (select current_setting('jwt.claims.org_id', true)))
    OR ((metadata ->> 'user_id') = (select auth.uid())::text)
  );

-- vendors.vendors
DROP POLICY IF EXISTS "Tenant access to vendors" ON vendors.vendors;
CREATE POLICY "Tenant access to vendors" ON vendors.vendors
  FOR ALL
  USING (
    ((config ->> 'org_id') = (select current_setting('jwt.claims.org_id', true)))
    OR ((config ->> 'user_id') = (select auth.uid())::text)
  )
  WITH CHECK (
    ((config ->> 'org_id') = (select current_setting('jwt.claims.org_id', true)))
    OR ((config ->> 'user_id') = (select auth.uid())::text)
  );

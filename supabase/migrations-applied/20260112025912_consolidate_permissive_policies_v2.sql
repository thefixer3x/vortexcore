-- Applied migration 20260112025912 (consolidate_permissive_policies_v2), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.

alter policy "Users can view own audit logs" on analytics.audit_log
  using (
    (user_id = ( SELECT auth.uid() AS uid))
    OR (( SELECT auth.role() AS role) = 'service_role'::text)
  );

alter policy "Users can create audit entries" on analytics.audit_log
  with check (
    ((user_id = ( SELECT auth.uid() AS uid)) OR (user_id IS NULL))
    OR (( SELECT auth.role() AS role) = 'service_role'::text)
  );

drop policy "Service role full access to audit_log" on analytics.audit_log;

create policy "Service role can update audit log"
  on analytics.audit_log
  for update
  to public
  using ((( SELECT auth.role() AS role) = 'service_role'::text))
  with check ((( SELECT auth.role() AS role) = 'service_role'::text));

create policy "Service role can delete audit log"
  on analytics.audit_log
  for delete
  to public
  using ((( SELECT auth.role() AS role) = 'service_role'::text));

alter policy "credit_applications_service_insert" on credit.applications
  with check (
    (( SELECT auth.role() AS role) = 'service_role'::text)
    OR (( SELECT auth.uid() AS uid) = user_id)
  );

alter policy "credit_applications_service_select" on credit.applications
  using (
    (( SELECT auth.role() AS role) = 'service_role'::text)
    OR (( SELECT auth.uid() AS uid) = user_id)
  );

alter policy "credit_applications_service_update" on credit.applications
  using (
    (( SELECT auth.role() AS role) = 'service_role'::text)
    OR (( SELECT auth.uid() AS uid) = user_id)
  )
  with check (
    (( SELECT auth.role() AS role) = 'service_role'::text)
    OR (( SELECT auth.uid() AS uid) = user_id)
  );

drop policy "credit_applications_user_insert" on credit.applications;

drop policy "credit_applications_user_select" on credit.applications;

drop policy "Users can create own applications" on credit.applications;

drop policy "Users can view own applications" on credit.applications;

drop policy "Users can update own applications" on credit.applications;

alter policy "credit_bids_service_select" on credit.bids
  using (
    (( SELECT auth.role() AS role) = 'service_role'::text)
    OR (EXISTS (
      SELECT 1
      FROM credit.applications a
      WHERE ((a.id = bids.application_id) AND (a.user_id = ( SELECT auth.uid() AS uid)))
    ))
    OR (application_id IN (
      SELECT applications.id
      FROM credit.applications
      WHERE (applications.user_id = ( SELECT auth.uid() AS uid))
    ))
  );

drop policy "credit_bids_user_select" on credit.bids;

drop policy "Users can view bids on own applications" on credit.bids;

alter policy "credit_limits_service_select" on credit.credit_limits
  using (
    (( SELECT auth.role() AS role) = 'service_role'::text)
    OR (( SELECT auth.uid() AS uid) = user_id)
  );

drop policy "credit_limits_user_select" on credit.credit_limits;

alter policy "credit_scores_service_select" on credit.credit_scores
  using (
    (( SELECT auth.role() AS role) = 'service_role'::text)
    OR (( SELECT auth.uid() AS uid) = user_id)
  );

drop policy "credit_scores_user_select" on credit.credit_scores;

drop policy "Users can view own credit scores" on credit.credit_scores;

drop policy "Authenticated users can view active providers" on credit.providers;

alter policy "Service role full access to projects" on public.projects
  using (
    (( SELECT auth.role() AS role) = 'service_role'::text)
    OR (organization_id IN (
      SELECT users.organization_id
      FROM security_service.users
      WHERE (users.id = ( SELECT auth.uid() AS uid))
    ))
  )
  with check (
    (( SELECT auth.role() AS role) = 'service_role'::text)
    OR (organization_id IN (
      SELECT users.organization_id
      FROM security_service.users
      WHERE (users.id = ( SELECT auth.uid() AS uid))
    ))
  );

drop policy "Users can manage org projects" on public.projects;

alter policy "Users can create memories" on security_service.memory_entries
  with check (
    (user_id = ( SELECT auth.uid() AS uid))
    OR (( SELECT auth.role() AS role) = 'service_role'::text)
  );

alter policy "Users can view org memories" on security_service.memory_entries
  using (
    (organization_id IN (
      SELECT users.organization_id
      FROM security_service.users
      WHERE (users.id = ( SELECT auth.uid() AS uid))
    ))
    OR (user_id = ( SELECT auth.uid() AS uid))
    OR (( SELECT auth.role() AS role) = 'service_role'::text)
  );

alter policy "Service role can update memory entries" on security_service.memory_entries
  using (
    (( SELECT auth.role() AS role) = 'service_role'::text)
    OR (user_id = ( SELECT auth.uid() AS uid))
  )
  with check (
    (( SELECT auth.role() AS role) = 'service_role'::text)
    OR (user_id = ( SELECT auth.uid() AS uid))
  );

alter policy "Service role can delete memory entries" on security_service.memory_entries
  using (
    (( SELECT auth.role() AS role) = 'service_role'::text)
    OR (user_id = ( SELECT auth.uid() AS uid))
  );

drop policy "Users can manage own memory entries" on security_service.memory_entries;
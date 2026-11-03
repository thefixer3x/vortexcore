-- Applied migration 20260112025529 (consolidate_permissive_policies), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.

alter policy "credit_providers_public_read" on credit.providers
  using (((status)::text = 'active'::text) OR (( SELECT auth.role() AS role) = 'service_role'::text));

drop policy "credit_providers_service_all" on credit.providers;

alter policy "credit_repayment_schedules_service_select" on credit.repayment_schedules
  using (
    (( SELECT auth.role() AS role) = 'service_role'::text)
    OR (EXISTS (
      SELECT 1
      FROM credit.applications a
      WHERE ((a.id = repayment_schedules.application_id) AND (a.user_id = ( SELECT auth.uid() AS uid)))
    ))
  );

drop policy "credit_repayment_schedules_user_select" on credit.repayment_schedules;

alter policy "credit_status_history_service_select" on credit.status_history
  using (
    (( SELECT auth.role() AS role) = 'service_role'::text)
    OR (EXISTS (
      SELECT 1
      FROM credit.applications a
      WHERE ((a.id = status_history.application_id) AND (a.user_id = ( SELECT auth.uid() AS uid)))
    ))
  );

drop policy "credit_status_history_user_select" on credit.status_history;

alter policy "credit_transactions_service_select" on credit.transactions
  using (
    (( SELECT auth.role() AS role) = 'service_role'::text)
    OR (EXISTS (
      SELECT 1
      FROM credit.applications a
      WHERE ((a.id = transactions.application_id) AND (a.user_id = ( SELECT auth.uid() AS uid)))
    ))
    OR (application_id IN (
      SELECT applications.id
      FROM credit.applications
      WHERE (applications.user_id = ( SELECT auth.uid() AS uid))
    ))
  );

drop policy "credit_transactions_user_select" on credit.transactions;

drop policy "Users can view own transactions" on credit.transactions;

alter policy "API products are publicly readable" on marketplace.api_marketplace_products
  using ((status = 'approved'::text) OR (( SELECT auth.uid() AS uid) = developer_id));

drop policy "Developers can manage their own products" on marketplace.api_marketplace_products;

create policy "Developers can insert their own products"
  on marketplace.api_marketplace_products
  for insert
  to public
  with check ((( SELECT auth.uid() AS uid) = developer_id));

create policy "Developers can update their own products"
  on marketplace.api_marketplace_products
  for update
  to public
  using ((( SELECT auth.uid() AS uid) = developer_id))
  with check ((( SELECT auth.uid() AS uid) = developer_id));

create policy "Developers can delete their own products"
  on marketplace.api_marketplace_products
  for delete
  to public
  using ((( SELECT auth.uid() AS uid) = developer_id));

alter policy "Expert profiles are publicly readable" on marketplace.expert_marketplace_profiles
  using ((active = true) OR (( SELECT auth.uid() AS uid) = user_id));

drop policy "Experts can manage their own profile" on marketplace.expert_marketplace_profiles;

create policy "Experts can insert their own profile"
  on marketplace.expert_marketplace_profiles
  for insert
  to public
  with check ((( SELECT auth.uid() AS uid) = user_id));

create policy "Experts can update their own profile"
  on marketplace.expert_marketplace_profiles
  for update
  to public
  using ((( SELECT auth.uid() AS uid) = user_id))
  with check ((( SELECT auth.uid() AS uid) = user_id));

create policy "Experts can delete their own profile"
  on marketplace.expert_marketplace_profiles
  for delete
  to public
  using ((( SELECT auth.uid() AS uid) = user_id));

alter policy "Users can view org configs" on public.configurations
  using (
    (EXISTS (
      SELECT 1
      FROM api_keys
      WHERE ((api_keys.user_id = ( SELECT auth.uid() AS uid))
        AND (api_keys.access_level = ANY (ARRAY['admin'::text, 'enterprise'::text]))
        AND (api_keys.is_active = true))
    ))
    OR (( SELECT auth.role() AS role) = 'service_role'::text)
    OR ((organization_id IN (
      SELECT users.organization_id
      FROM security_service.users
      WHERE (users.id = ( SELECT auth.uid() AS uid))
    )) AND ((is_sensitive = false) OR (is_sensitive IS NULL)))
  );

drop policy "Admins can manage configs" on public.configurations;

drop policy "Service role full access to configurations" on public.configurations;

create policy "Admins and service can insert configs"
  on public.configurations
  for insert
  to public
  with check (
    (EXISTS (
      SELECT 1
      FROM api_keys
      WHERE ((api_keys.user_id = ( SELECT auth.uid() AS uid))
        AND (api_keys.access_level = ANY (ARRAY['admin'::text, 'enterprise'::text]))
        AND (api_keys.is_active = true))
    ))
    OR (( SELECT auth.role() AS role) = 'service_role'::text)
  );

create policy "Admins and service can update configs"
  on public.configurations
  for update
  to public
  using (
    (EXISTS (
      SELECT 1
      FROM api_keys
      WHERE ((api_keys.user_id = ( SELECT auth.uid() AS uid))
        AND (api_keys.access_level = ANY (ARRAY['admin'::text, 'enterprise'::text]))
        AND (api_keys.is_active = true))
    ))
    OR (( SELECT auth.role() AS role) = 'service_role'::text)
  )
  with check (
    (EXISTS (
      SELECT 1
      FROM api_keys
      WHERE ((api_keys.user_id = ( SELECT auth.uid() AS uid))
        AND (api_keys.access_level = ANY (ARRAY['admin'::text, 'enterprise'::text]))
        AND (api_keys.is_active = true))
    ))
    OR (( SELECT auth.role() AS role) = 'service_role'::text)
  );

create policy "Admins and service can delete configs"
  on public.configurations
  for delete
  to public
  using (
    (EXISTS (
      SELECT 1
      FROM api_keys
      WHERE ((api_keys.user_id = ( SELECT auth.uid() AS uid))
        AND (api_keys.access_level = ANY (ARRAY['admin'::text, 'enterprise'::text]))
        AND (api_keys.is_active = true))
    ))
    OR (( SELECT auth.role() AS role) = 'service_role'::text)
  );

alter policy "Users can view their own customer record" on public.customers
  using (
    ((( SELECT auth.jwt() AS jwt) ->> 'role'::text) = 'service_role'::text)
    OR ((user_id)::text = (( SELECT auth.uid() AS uid))::text)
  );

drop policy "Service role can manage customers" on public.customers;

create policy "Service role can insert customers"
  on public.customers
  for insert
  to public
  with check (((( SELECT auth.jwt() AS jwt) ->> 'role'::text) = 'service_role'::text));

create policy "Service role can update customers"
  on public.customers
  for update
  to public
  using (((( SELECT auth.jwt() AS jwt) ->> 'role'::text) = 'service_role'::text))
  with check (((( SELECT auth.jwt() AS jwt) ->> 'role'::text) = 'service_role'::text));

create policy "Service role can delete customers"
  on public.customers
  for delete
  to public
  using (((( SELECT auth.jwt() AS jwt) ->> 'role'::text) = 'service_role'::text));

alter policy "Anyone can view available services" on public.mcp_service_catalog
  using (
    (is_available = true)
    OR ((( SELECT auth.jwt() AS jwt) ->> 'role'::text) = 'admin'::text)
  );

drop policy "Admins can manage service catalog" on public.mcp_service_catalog;

create policy "Admins can insert service catalog"
  on public.mcp_service_catalog
  for insert
  to public
  with check (((( SELECT auth.jwt() AS jwt) ->> 'role'::text) = 'admin'::text));

create policy "Admins can update service catalog"
  on public.mcp_service_catalog
  for update
  to public
  using (((( SELECT auth.jwt() AS jwt) ->> 'role'::text) = 'admin'::text))
  with check (((( SELECT auth.jwt() AS jwt) ->> 'role'::text) = 'admin'::text));

create policy "Admins can delete service catalog"
  on public.mcp_service_catalog
  for delete
  to public
  using (((( SELECT auth.jwt() AS jwt) ->> 'role'::text) = 'admin'::text));

alter policy "Users can view transactions for their wallets" on public.transactions
  using (
    ((( SELECT auth.jwt() AS jwt) ->> 'role'::text) = 'service_role'::text)
    OR (source_wallet_id IN (
      SELECT w.id
      FROM wallets w
      JOIN customers c ON (w.customer_id = c.id)
      WHERE ((c.user_id)::text = (( SELECT auth.uid() AS uid))::text)
    ))
  );

drop policy "Service role can manage transactions" on public.transactions;

create policy "Service role can insert transactions"
  on public.transactions
  for insert
  to public
  with check (((( SELECT auth.jwt() AS jwt) ->> 'role'::text) = 'service_role'::text));

create policy "Service role can update transactions"
  on public.transactions
  for update
  to public
  using (((( SELECT auth.jwt() AS jwt) ->> 'role'::text) = 'service_role'::text))
  with check (((( SELECT auth.jwt() AS jwt) ->> 'role'::text) = 'service_role'::text));

create policy "Service role can delete transactions"
  on public.transactions
  for delete
  to public
  using (((( SELECT auth.jwt() AS jwt) ->> 'role'::text) = 'service_role'::text));

alter policy "Users can manage own config" on public.user_config
  using (
    (user_id = ( SELECT auth.uid() AS uid))
    OR (( SELECT auth.role() AS role) = 'service_role'::text)
  )
  with check (
    (user_id = ( SELECT auth.uid() AS uid))
    OR (( SELECT auth.role() AS role) = 'service_role'::text)
  );

drop policy "Service role full access to user_config" on public.user_config;

alter policy "Users can view wallets linked to their customer record" on public.wallets
  using (
    ((( SELECT auth.jwt() AS jwt) ->> 'role'::text) = 'service_role'::text)
    OR (customer_id IN (
      SELECT customers.id
      FROM customers
      WHERE ((customers.user_id)::text = (( SELECT auth.uid() AS uid))::text)
    ))
  );

drop policy "Service role can manage wallets" on public.wallets;

create policy "Service role can insert wallets"
  on public.wallets
  for insert
  to public
  with check (((( SELECT auth.jwt() AS jwt) ->> 'role'::text) = 'service_role'::text));

create policy "Service role can update wallets"
  on public.wallets
  for update
  to public
  using (((( SELECT auth.jwt() AS jwt) ->> 'role'::text) = 'service_role'::text))
  with check (((( SELECT auth.jwt() AS jwt) ->> 'role'::text) = 'service_role'::text));

create policy "Service role can delete wallets"
  on public.wallets
  for delete
  to public
  using (((( SELECT auth.jwt() AS jwt) ->> 'role'::text) = 'service_role'::text));

alter policy "Users can create memories" on security_service.memory_entries
  with check (
    ((user_id = ( SELECT auth.uid() AS uid))
      AND (organization_id IN (
        SELECT users.organization_id
        FROM security_service.users
        WHERE (users.id = ( SELECT auth.uid() AS uid))
      )))
    OR (( SELECT auth.role() AS role) = 'service_role'::text)
  );

alter policy "Users can view org memories" on security_service.memory_entries
  using (
    (organization_id IN (
      SELECT users.organization_id
      FROM security_service.users
      WHERE (users.id = ( SELECT auth.uid() AS uid))
    ))
    OR (( SELECT auth.role() AS role) = 'service_role'::text)
  );

drop policy "Service role full access to memory_entries" on security_service.memory_entries;

create policy "Service role can update memory entries"
  on security_service.memory_entries
  for update
  to public
  using ((( SELECT auth.role() AS role) = 'service_role'::text))
  with check ((( SELECT auth.role() AS role) = 'service_role'::text));

create policy "Service role can delete memory entries"
  on security_service.memory_entries
  for delete
  to public
  using ((( SELECT auth.role() AS role) = 'service_role'::text));

alter policy "user_verification_status_service_all" on verification.user_verification_status
  using (
    (( SELECT auth.role() AS role) = 'service_role'::text)
    OR (( SELECT auth.uid() AS uid) = user_id)
  );

drop policy "user_verification_status_user_select" on verification.user_verification_status;

alter policy "verification_audit_log_service_select" on verification.verification_audit_log
  using (
    (( SELECT auth.role() AS role) = 'service_role'::text)
    OR (( SELECT auth.uid() AS uid) = user_id)
  );

drop policy "verification_audit_log_user_select" on verification.verification_audit_log;

alter policy "verification_records_service_select" on verification.verification_records
  using (
    (( SELECT auth.role() AS role) = 'service_role'::text)
    OR (( SELECT auth.uid() AS uid) = user_id)
  );

drop policy "verification_records_user_select" on verification.verification_records;
-- Applied migration 20260112020216 (fix_auth_rls_initplan_policies_v2), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.

do $$
declare
  r record;
  new_qual text;
  new_with_check text;
  using_clause text;
  check_clause text;
begin
  for r in
    select schemaname, tablename, policyname, qual, with_check
    from pg_policies
  loop
    new_qual := regexp_replace(
      regexp_replace(r.qual, E'(?i)(?<!select\\s)auth\\.([a-zA-Z_][a-zA-Z0-9_]*)\\(([^)]*)\\)', E'(select auth.\\1(\\2))', 'g'),
      E'(?i)(?<!select\\s)current_setting\\(([^)]*)\\)',
      E'(select current_setting(\\1))',
      'g'
    );

    new_with_check := regexp_replace(
      regexp_replace(r.with_check, E'(?i)(?<!select\\s)auth\\.([a-zA-Z_][a-zA-Z0-9_]*)\\(([^)]*)\\)', E'(select auth.\\1(\\2))', 'g'),
      E'(?i)(?<!select\\s)current_setting\\(([^)]*)\\)',
      E'(select current_setting(\\1))',
      'g'
    );

    using_clause := null;
    check_clause := null;

    if r.qual is not null and r.qual <> new_qual then
      using_clause := format('USING (%s)', new_qual);
    end if;

    if r.with_check is not null and r.with_check <> new_with_check then
      check_clause := format('WITH CHECK (%s)', new_with_check);
    end if;

    if using_clause is not null or check_clause is not null then
      execute format(
        'ALTER POLICY %I ON %I.%I %s %s',
        r.policyname,
        r.schemaname,
        r.tablename,
        coalesce(using_clause, ''),
        coalesce(check_clause, '')
      );
    end if;
  end loop;
end $$;
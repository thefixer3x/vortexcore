-- Local fixture for the control-room lockdown test.
-- Reproduces, from the live definitions read on 2026-11-07, the roles,
-- schema privileges, tables, views, INSTEAD OF triggers, RPCs and grants
-- that matter. Only for a throwaway local database.

do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin bypassrls; end if;
end $$;

create schema control_room;
grant usage on schema control_room to service_role;   -- live: postgres=UC, service_role=U
create schema if not exists extensions;

create table control_room.apps (
  id text primary key, name text not null, description text, status text default 'active',
  schema_name text, original_project_ref text, migration_status text default 'pending',
  created_at timestamptz default now(), updated_at timestamptz default now(),
  certified boolean not null default false, metadata jsonb, app_id text,
  is_active boolean default true, api_url text, health_endpoint text, github_repo text, github_path text
);
create table control_room.render_services (
  id text primary key, name text not null, type text not null, status text default 'active',
  url text, project_id uuid, app_id text, metadata jsonb default '{}',
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create table control_room.projects (
  id uuid primary key default gen_random_uuid(), name text, description text, type text, status text,
  api_key text, metadata jsonb, created_at timestamptz default now(), updated_at timestamptz default now(),
  organization_id uuid
);
create table control_room.audit_log (
  id bigserial primary key, event_type text, entity_type text, entity_id text, details jsonb, created_at timestamptz
);
grant all on all tables in schema control_room to service_role;
grant all on all sequences in schema control_room to service_role;

insert into control_room.apps (id, name) values ('vortexcore', 'VortexCore'), ('other-app', 'Other app');
insert into control_room.render_services (id, name, type) values ('svc-1', 'api', 'web');

-- Views (security_invoker), as live
create view public.apps with (security_invoker = on) as
  select id, name, description, status, schema_name, original_project_ref, migration_status, created_at,
         updated_at, certified, metadata, app_id, is_active, api_url, health_endpoint, github_repo, github_path
  from control_room.apps;
create view public.render_services with (security_invoker = on) as
  select id, name, type, status, url, project_id, app_id, metadata, created_at, updated_at
  from control_room.render_services;
create view public.projects with (security_invoker = on) as
  select id, name, description, type, status, api_key, metadata, created_at, updated_at, organization_id
  from control_room.projects;
create view public.vortex_cockpit_projects with (security_invoker = on) as
  select id, name, description, type, status, metadata, created_at, updated_at
  from control_room.projects where (metadata ->> 'app_id') = 'vortexcore';

-- INSTEAD OF trigger functions on public.render_services (live bodies)
create function public.render_services_insert() returns trigger language plpgsql security definer
set search_path to 'pg_catalog', 'control_room', 'public' as $$
begin
  insert into control_room.render_services (id, name, type, status, url, project_id, app_id, metadata, created_at, updated_at)
  values (new.id, new.name, new.type, coalesce(new.status, 'active'), new.url, new.project_id, new.app_id,
          coalesce(new.metadata, '{}'::jsonb), coalesce(new.created_at, now()), coalesce(new.updated_at, now()))
  returning * into new;
  return new;
end; $$;
create function public.render_services_update() returns trigger language plpgsql security definer
set search_path to 'pg_catalog', 'control_room', 'public' as $$
begin
  update control_room.render_services set name = new.name, type = new.type, status = new.status, url = new.url,
    project_id = new.project_id, app_id = new.app_id, metadata = new.metadata, updated_at = now()
  where id = old.id returning * into new;
  return new;
end; $$;
create function public.render_services_delete() returns trigger language plpgsql security definer
set search_path to 'pg_catalog', 'control_room', 'public' as $$
begin
  delete from control_room.render_services where id = old.id;
  return old;
end; $$;
create trigger render_services_insert_trigger instead of insert on public.render_services
  for each row execute function public.render_services_insert();
create trigger render_services_update_trigger instead of update on public.render_services
  for each row execute function public.render_services_update();
create trigger render_services_delete_trigger instead of delete on public.render_services
  for each row execute function public.render_services_delete();

-- projects_* trigger functions: bodies are not needed for the test (the view has
-- no client grants); they only need to exist with the live ACLs.
create function public.projects_insert() returns trigger language plpgsql security definer as $$ begin return new; end; $$;
create function public.projects_update() returns trigger language plpgsql security definer as $$ begin return new; end; $$;
create function public.projects_delete() returns trigger language plpgsql security definer as $$ begin return old; end; $$;

-- Control-room RPCs (live bodies; create_/update_ reference a column that does
-- not exist, exactly as live)
create function public.create_control_room_app(p_id text, p_name text, p_description text default '',
  p_status text default 'active', p_schema_name text default null, p_api_url text default null,
  p_health_endpoint text default '/health', p_render_service_id text default null,
  p_render_database_id text default null, p_metadata jsonb default '{}')
returns control_room.apps language plpgsql security definer set search_path to 'public', 'extensions' as $$
declare result control_room.apps;
begin
  insert into control_room.apps (id, name, description, status, schema_name, api_url, health_endpoint,
    render_service_id, render_database_id, metadata, created_at, updated_at)
  values (p_id, p_name, p_description, p_status, p_schema_name, p_api_url, p_health_endpoint,
    p_render_service_id, p_render_database_id, p_metadata, now(), now())
  returning * into result;
  return result;
end; $$;
create function public.update_control_room_app(p_id text, p_updates jsonb)
returns control_room.apps language plpgsql security definer set search_path to 'public', 'extensions' as $$
declare result control_room.apps;
begin
  update control_room.apps set name = coalesce(p_updates->>'name', name),
    render_service_id = coalesce(p_updates->>'render_service_id', render_service_id), updated_at = now()
  where id = p_id returning * into result;
  return result;
end; $$;
create function public.delete_control_room_app(p_id text, p_hard_delete boolean default false)
returns jsonb language plpgsql security definer set search_path to 'public', 'extensions' as $$
declare result control_room.apps;
begin
  if p_hard_delete then
    delete from control_room.apps where id = p_id;
    insert into control_room.audit_log (event_type, entity_type, entity_id, details, created_at)
    values ('project_deleted', 'app', p_id, jsonb_build_object('hard_delete', true), now());
    return jsonb_build_object('deleted', true, 'id', p_id);
  else
    update control_room.apps set status = 'inactive', updated_at = now() where id = p_id returning * into result;
    insert into control_room.audit_log (event_type, entity_type, entity_id, details, created_at)
    values ('project_deactivated', 'app', p_id, '{}'::jsonb, now());
    return to_jsonb(result);
  end if;
end; $$;
create function public.get_control_room_app(p_id text)
returns control_room.apps language plpgsql security definer set search_path to 'public', 'extensions' as $$
declare result control_room.apps;
begin
  select * into result from control_room.apps where id = p_id;
  return result;
end; $$;
create function public.get_control_room_apps(p_status text default null, p_search text default null)
returns setof control_room.apps language plpgsql security definer set search_path to 'public', 'extensions' as $$
begin
  return query select * from control_room.apps a
  where (p_status is null or p_status = 'all' or a.status = p_status)
  order by a.created_at desc;
end; $$;

-- Live grants. Functions: PUBLIC keeps its default EXECUTE; anon, authenticated
-- and service_role were also granted explicitly.
grant execute on function
  public.create_control_room_app(text, text, text, text, text, text, text, text, text, jsonb),
  public.update_control_room_app(text, jsonb), public.delete_control_room_app(text, boolean),
  public.get_control_room_app(text), public.get_control_room_apps(text, text),
  public.render_services_insert(), public.render_services_update(), public.render_services_delete(),
  public.projects_insert(), public.projects_update(), public.projects_delete()
  to anon, authenticated, service_role;

-- Views: apps and render_services grant everything to anon/authenticated;
-- projects and vortex_cockpit_projects only to service_role.
grant select, insert, update, delete, truncate, references, trigger
  on public.apps, public.render_services to anon, authenticated, service_role;
grant select, insert, update, delete, truncate, references, trigger
  on public.projects, public.vortex_cockpit_projects to service_role;

-- Probes run as each role. Each line prints "<probe>|allowed" or
-- "<probe>|denied"; nothing here is kept (every probe rolls back).
-- Called with -v role=<role>.

create or replace function pg_temp.try(p_label text, p_sql text) returns text language plpgsql as $$
begin
  begin
    execute p_sql;
    raise exception 'rollback-ok';
  exception
    when insufficient_privilege then return p_label || '|denied';
    when others then
      if sqlerrm = 'rollback-ok' then return p_label || '|allowed'; end if;
      -- A failure that is not a permission error means the call got through
      -- the privilege check (e.g. create_control_room_app's missing column).
      return p_label || '|allowed(' || sqlstate || ')';
  end;
end; $$;

set role :role;
select pg_temp.try('view insert render_services', $q$insert into public.render_services (id, name, type) values ('x', 'x', 'web')$q$);
select pg_temp.try('view update render_services', $q$update public.render_services set name = 'pwned' where id = 'svc-1'$q$);
select pg_temp.try('view delete render_services', $q$delete from public.render_services where id = 'svc-1'$q$);
select pg_temp.try('view insert apps', $q$insert into public.apps (id, name) values ('x', 'x')$q$);
select pg_temp.try('rpc delete_control_room_app', $q$select public.delete_control_room_app('other-app', true)$q$);
select pg_temp.try('rpc get_control_room_apps', $q$select * from public.get_control_room_apps()$q$);
select pg_temp.try('rpc get_control_room_app', $q$select public.get_control_room_app('vortexcore')$q$);
select pg_temp.try('rpc create_control_room_app', $q$select public.create_control_room_app('x', 'x')$q$);
select pg_temp.try('rpc update_control_room_app', $q$select public.update_control_room_app('vortexcore', '{}'::jsonb)$q$);
reset role;

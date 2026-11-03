-- Applied migration 20260122040609 (expose_control_room_apps_rpc), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.

-- Create RPC functions to access control_room.apps since the schema isn't exposed to PostgREST

-- Function to list all apps
CREATE OR REPLACE FUNCTION public.get_control_room_apps(
  p_status TEXT DEFAULT NULL,
  p_search TEXT DEFAULT NULL
)
RETURNS SETOF control_room.apps
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM control_room.apps a
  WHERE 
    (p_status IS NULL OR p_status = 'all' OR a.status = p_status)
    AND (
      p_search IS NULL 
      OR a.name ILIKE '%' || p_search || '%'
      OR a.description ILIKE '%' || p_search || '%'
      OR a.schema_name ILIKE '%' || p_search || '%'
    )
  ORDER BY a.created_at DESC;
END;
$$;

-- Function to get single app by ID
CREATE OR REPLACE FUNCTION public.get_control_room_app(p_id TEXT)
RETURNS control_room.apps
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result control_room.apps;
BEGIN
  SELECT * INTO result
  FROM control_room.apps
  WHERE id = p_id;
  RETURN result;
END;
$$;

-- Function to create an app
CREATE OR REPLACE FUNCTION public.create_control_room_app(
  p_id TEXT,
  p_name TEXT,
  p_description TEXT DEFAULT '',
  p_status TEXT DEFAULT 'active',
  p_schema_name TEXT DEFAULT NULL,
  p_api_url TEXT DEFAULT NULL,
  p_health_endpoint TEXT DEFAULT '/health',
  p_render_service_id TEXT DEFAULT NULL,
  p_render_database_id TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS control_room.apps
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result control_room.apps;
BEGIN
  INSERT INTO control_room.apps (
    id, name, description, status, schema_name,
    api_url, health_endpoint, render_service_id, render_database_id,
    metadata, created_at, updated_at
  ) VALUES (
    p_id, p_name, p_description, p_status, p_schema_name,
    p_api_url, p_health_endpoint, p_render_service_id, p_render_database_id,
    p_metadata, NOW(), NOW()
  )
  RETURNING * INTO result;
  
  -- Log to audit
  INSERT INTO control_room.audit_log (event_type, entity_type, entity_id, details, created_at)
  VALUES ('project_created', 'app', p_id, jsonb_build_object('name', p_name, 'schema_name', p_schema_name), NOW());
  
  RETURN result;
END;
$$;

-- Function to update an app
CREATE OR REPLACE FUNCTION public.update_control_room_app(
  p_id TEXT,
  p_updates JSONB
)
RETURNS control_room.apps
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result control_room.apps;
BEGIN
  UPDATE control_room.apps
  SET 
    name = COALESCE(p_updates->>'name', name),
    description = COALESCE(p_updates->>'description', description),
    status = COALESCE(p_updates->>'status', status),
    api_url = COALESCE(p_updates->>'api_url', api_url),
    health_endpoint = COALESCE(p_updates->>'health_endpoint', health_endpoint),
    render_service_id = COALESCE(p_updates->>'render_service_id', render_service_id),
    render_database_id = COALESCE(p_updates->>'render_database_id', render_database_id),
    metadata = COALESCE((p_updates->'metadata')::jsonb, metadata),
    updated_at = NOW()
  WHERE id = p_id
  RETURNING * INTO result;
  
  -- Log to audit
  INSERT INTO control_room.audit_log (event_type, entity_type, entity_id, details, created_at)
  VALUES ('project_updated', 'app', p_id, p_updates, NOW());
  
  RETURN result;
END;
$$;

-- Function to delete an app (soft or hard)
CREATE OR REPLACE FUNCTION public.delete_control_room_app(
  p_id TEXT,
  p_hard_delete BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result control_room.apps;
BEGIN
  IF p_hard_delete THEN
    DELETE FROM control_room.apps WHERE id = p_id;
    
    INSERT INTO control_room.audit_log (event_type, entity_type, entity_id, details, created_at)
    VALUES ('project_deleted', 'app', p_id, jsonb_build_object('hard_delete', true), NOW());
    
    RETURN jsonb_build_object('deleted', true, 'id', p_id);
  ELSE
    UPDATE control_room.apps
    SET status = 'inactive', updated_at = NOW()
    WHERE id = p_id
    RETURNING * INTO result;
    
    INSERT INTO control_room.audit_log (event_type, entity_type, entity_id, details, created_at)
    VALUES ('project_deactivated', 'app', p_id, '{}'::jsonb, NOW());
    
    RETURN to_jsonb(result);
  END IF;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_control_room_apps TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_control_room_app TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_control_room_app TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_control_room_app TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.delete_control_room_app TO authenticated, service_role;
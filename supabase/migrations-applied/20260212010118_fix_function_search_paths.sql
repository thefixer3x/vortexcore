-- Applied migration 20260212010118 (fix_function_search_paths), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.

-- Fix search_path for auth_gateway schema functions
ALTER FUNCTION auth_gateway.resolve_identity 
  SET search_path = auth_gateway, public, extensions;

ALTER FUNCTION auth_gateway.touch_auth_identity 
  SET search_path = auth_gateway, public, extensions;

ALTER FUNCTION auth_gateway.link_credential 
  SET search_path = auth_gateway, public, extensions;

-- Fix search_path for security_service schema functions
ALTER FUNCTION security_service.increment_pattern_use_count 
  SET search_path = security_service, public, extensions;

ALTER FUNCTION security_service.update_user_tool_configs_updated_at 
  SET search_path = security_service, public, extensions;

ALTER FUNCTION security_service.update_behavior_pattern_timestamp 
  SET search_path = security_service, public, extensions;

-- Fix search_path for public schema functions
ALTER FUNCTION public.trigger_sync_api_key_update 
  SET search_path = public, extensions;

ALTER FUNCTION public.get_control_room_apps 
  SET search_path = public, extensions;

ALTER FUNCTION public.create_control_room_app 
  SET search_path = public, extensions;

ALTER FUNCTION public.trigger_user_sync_to_auth_gateway 
  SET search_path = public, extensions;

ALTER FUNCTION public.trigger_sync_user 
  SET search_path = public, extensions;

ALTER FUNCTION public.trigger_sync_api_key 
  SET search_path = public, extensions;

ALTER FUNCTION public.update_control_room_app 
  SET search_path = public, extensions;

ALTER FUNCTION public.get_control_room_app 
  SET search_path = public, extensions;

ALTER FUNCTION public.delete_control_room_app 
  SET search_path = public, extensions;

ALTER FUNCTION public.memory_entries_insert 
  SET search_path = public, extensions;

-- Fix search_path for vendors schema functions
ALTER FUNCTION vendors.trigger_ai_service_alert 
  SET search_path = vendors, public, extensions;

ALTER FUNCTION vendors.trigger_key_detection_alert 
  SET search_path = vendors, public, extensions;

-- Fix search_path for maas schema functions
ALTER FUNCTION maas.memory_entries_insert 
  SET search_path = maas, public, extensions;
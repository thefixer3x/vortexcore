-- Applied migration 20260112022019 (add_missing_fk_indexes), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.

create index if not exists idx_auth_gateway_oauth_authorization_codes_client_id
  on auth_gateway.oauth_authorization_codes (client_id);

create index if not exists idx_auth_gateway_oauth_clients_created_by
  on auth_gateway.oauth_clients (created_by);

create index if not exists idx_auth_gateway_oauth_tokens_parent_token_id
  on auth_gateway.oauth_tokens (parent_token_id);

create index if not exists idx_control_room_profiles_user_id
  on control_room.profiles (user_id);

create index if not exists idx_control_room_user_app_access_app_id
  on control_room.user_app_access (app_id);

create index if not exists idx_public_webhook_deliveries_event_id
  on public.webhook_deliveries (event_id);
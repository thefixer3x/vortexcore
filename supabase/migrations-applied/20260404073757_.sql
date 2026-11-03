-- Applied migration 20260404073757 (), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.


-- Recreate facade views with security_invoker = true
CREATE OR REPLACE VIEW public.ai_brainbox_vortex_items
  WITH (security_invoker = true) AS
  SELECT * FROM apps.ai_brainbox_vortex_items;

CREATE OR REPLACE VIEW public.ai_brainbox_imported_data
  WITH (security_invoker = true) AS
  SELECT * FROM apps.ai_brainbox_imported_data;

CREATE OR REPLACE VIEW public.ai_brainbox_chat_conversations
  WITH (security_invoker = true) AS
  SELECT * FROM apps.ai_brainbox_chat_conversations;

CREATE OR REPLACE VIEW public.ai_brainbox_chat_messages
  WITH (security_invoker = true) AS
  SELECT * FROM apps.ai_brainbox_chat_messages;

CREATE OR REPLACE VIEW public.ai_brainbox_memories
  WITH (security_invoker = true) AS
  SELECT * FROM apps.ai_brainbox_memories;

CREATE OR REPLACE VIEW public.ai_brainbox_sessions
  WITH (security_invoker = true) AS
  SELECT * FROM apps.ai_brainbox_sessions;

CREATE OR REPLACE VIEW public.ai_brainbox_ai_response_cache
  WITH (security_invoker = true) AS
  SELECT * FROM apps.ai_brainbox_ai_response_cache;

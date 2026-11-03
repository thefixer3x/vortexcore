-- Applied migration 20260404073709 (), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.


-- Create the apps schema
CREATE SCHEMA IF NOT EXISTS apps;

-- Grant usage to authenticated users
GRANT USAGE ON SCHEMA apps TO authenticated, anon, service_role;

-- =============================================
-- 1. ai_brainbox_vortex_items
-- =============================================
CREATE TABLE apps.ai_brainbox_vortex_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  url TEXT,
  type TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  source TEXT,
  keywords TEXT[],
  pitch TEXT,
  writer TEXT,
  status TEXT DEFAULT 'active'
);

ALTER TABLE apps.ai_brainbox_vortex_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own company vortex items"
  ON apps.ai_brainbox_vortex_items FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR owner_id IS NULL);

CREATE POLICY "Users can insert vortex items"
  ON apps.ai_brainbox_vortex_items FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own vortex items"
  ON apps.ai_brainbox_vortex_items FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR owner_id IS NULL);

CREATE POLICY "Users can delete own vortex items"
  ON apps.ai_brainbox_vortex_items FOR DELETE TO authenticated
  USING (owner_id = auth.uid() OR owner_id IS NULL);

-- Anon read access for public items
CREATE POLICY "Anon can view public vortex items"
  ON apps.ai_brainbox_vortex_items FOR SELECT TO anon
  USING (true);

-- Copy existing data
INSERT INTO apps.ai_brainbox_vortex_items (id, company_id, owner_id, title, url, type, created_at, updated_at, source, keywords, pitch, writer, status)
SELECT id, company_id, owner_id, title, url, type, created_at, updated_at, source, keywords, pitch, writer, status
FROM public.vortex_items
ON CONFLICT DO NOTHING;

-- =============================================
-- 2. ai_brainbox_imported_data
-- =============================================
CREATE TABLE apps.ai_brainbox_imported_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  source_type TEXT NOT NULL,
  title TEXT,
  content TEXT,
  file_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE apps.ai_brainbox_imported_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own imported data"
  ON apps.ai_brainbox_imported_data FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can insert imported data"
  ON apps.ai_brainbox_imported_data FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can delete own imported data"
  ON apps.ai_brainbox_imported_data FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL);

INSERT INTO apps.ai_brainbox_imported_data (id, user_id, source_type, title, content, file_url, metadata, created_at)
SELECT id, user_id, source_type, title, content, file_url, metadata, created_at
FROM public.imported_data
ON CONFLICT DO NOTHING;

-- =============================================
-- 3. ai_brainbox_chat_conversations
-- =============================================
CREATE TABLE apps.ai_brainbox_chat_conversations (
  id UUID NOT NULL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  topic TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE apps.ai_brainbox_chat_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations"
  ON apps.ai_brainbox_chat_conversations FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own conversations"
  ON apps.ai_brainbox_chat_conversations FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own conversations"
  ON apps.ai_brainbox_chat_conversations FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own conversations"
  ON apps.ai_brainbox_chat_conversations FOR DELETE TO authenticated
  USING (user_id = auth.uid());

INSERT INTO apps.ai_brainbox_chat_conversations (id, user_id, title, topic, created_at, updated_at)
SELECT id, user_id, title, topic, created_at, updated_at
FROM public.chat_conversations
ON CONFLICT DO NOTHING;

-- =============================================
-- 4. ai_brainbox_chat_messages
-- =============================================
CREATE TABLE apps.ai_brainbox_chat_messages (
  id UUID NOT NULL PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES apps.ai_brainbox_chat_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  encrypted BOOLEAN DEFAULT false,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE apps.ai_brainbox_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages"
  ON apps.ai_brainbox_chat_messages FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM apps.ai_brainbox_chat_conversations c
    WHERE c.id = conversation_id AND c.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own messages"
  ON apps.ai_brainbox_chat_messages FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM apps.ai_brainbox_chat_conversations c
    WHERE c.id = conversation_id AND c.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own messages"
  ON apps.ai_brainbox_chat_messages FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM apps.ai_brainbox_chat_conversations c
    WHERE c.id = conversation_id AND c.user_id = auth.uid()
  ));

INSERT INTO apps.ai_brainbox_chat_messages (id, conversation_id, role, content, encrypted, timestamp)
SELECT id, conversation_id, role, content, encrypted, timestamp
FROM public.chat_messages
ON CONFLICT DO NOTHING;

-- =============================================
-- 5. ai_brainbox_ai_response_cache
-- =============================================
CREATE TABLE apps.ai_brainbox_ai_response_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt TEXT NOT NULL,
  prompt_hash TEXT NOT NULL,
  response TEXT NOT NULL,
  model_used TEXT NOT NULL,
  tokens_used INTEGER,
  hit_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);

ALTER TABLE apps.ai_brainbox_ai_response_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to cache"
  ON apps.ai_brainbox_ai_response_cache FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated can read cache"
  ON apps.ai_brainbox_ai_response_cache FOR SELECT TO authenticated
  USING (true);

INSERT INTO apps.ai_brainbox_ai_response_cache (id, prompt, prompt_hash, response, model_used, tokens_used, hit_count, created_at, expires_at)
SELECT id, prompt, prompt_hash, response, model_used, tokens_used, hit_count, created_at, expires_at
FROM public.ai_response_cache
ON CONFLICT DO NOTHING;

-- =============================================
-- 6. ai_brainbox_memories (from agent_banks_memories)
-- =============================================
CREATE TABLE apps.ai_brainbox_memories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  memory_type TEXT DEFAULT 'context',
  tags JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  project_ref TEXT,
  source_url TEXT,
  status TEXT DEFAULT 'active',
  relevance_score FLOAT,
  access_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE apps.ai_brainbox_memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read memories"
  ON apps.ai_brainbox_memories FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert memories"
  ON apps.ai_brainbox_memories FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update memories"
  ON apps.ai_brainbox_memories FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Authenticated can delete memories"
  ON apps.ai_brainbox_memories FOR DELETE TO authenticated
  USING (true);

-- Anon read for public access
CREATE POLICY "Anon can read memories"
  ON apps.ai_brainbox_memories FOR SELECT TO anon
  USING (true);

INSERT INTO apps.ai_brainbox_memories (id, title, content, summary, memory_type, tags, metadata, project_ref, source_url, status, relevance_score, access_count, created_at, updated_at)
SELECT id, title, content, summary, memory_type, tags, metadata, project_ref, source_url, status, relevance_score, access_count, created_at, updated_at
FROM public.agent_banks_memories
ON CONFLICT DO NOTHING;

-- =============================================
-- 7. ai_brainbox_sessions (from agent_banks_sessions)
-- =============================================
CREATE TABLE apps.ai_brainbox_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_name TEXT NOT NULL,
  session_type TEXT,
  description TEXT,
  status TEXT DEFAULT 'active',
  memory_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ DEFAULT now(),
  last_activity TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

ALTER TABLE apps.ai_brainbox_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can manage sessions"
  ON apps.ai_brainbox_sessions FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

INSERT INTO apps.ai_brainbox_sessions (id, session_name, session_type, description, status, memory_count, metadata, started_at, last_activity, completed_at)
SELECT id, session_name, session_type, description, status, memory_count, metadata, started_at, last_activity, completed_at
FROM public.agent_banks_sessions
ON CONFLICT DO NOTHING;

-- =============================================
-- FACADE VIEWS in public (so Supabase client works)
-- =============================================

-- Drop old tables and replace with views
-- Note: We keep the original tables for now and create views with _v2 suffix
-- to avoid breaking anything. Once verified, the old tables can be dropped.

CREATE OR REPLACE VIEW public.ai_brainbox_vortex_items AS
  SELECT * FROM apps.ai_brainbox_vortex_items;

CREATE OR REPLACE VIEW public.ai_brainbox_imported_data AS
  SELECT * FROM apps.ai_brainbox_imported_data;

CREATE OR REPLACE VIEW public.ai_brainbox_chat_conversations AS
  SELECT * FROM apps.ai_brainbox_chat_conversations;

CREATE OR REPLACE VIEW public.ai_brainbox_chat_messages AS
  SELECT * FROM apps.ai_brainbox_chat_messages;

CREATE OR REPLACE VIEW public.ai_brainbox_memories AS
  SELECT * FROM apps.ai_brainbox_memories;

CREATE OR REPLACE VIEW public.ai_brainbox_sessions AS
  SELECT * FROM apps.ai_brainbox_sessions;

CREATE OR REPLACE VIEW public.ai_brainbox_ai_response_cache AS
  SELECT * FROM apps.ai_brainbox_ai_response_cache;

-- Grant access on views
GRANT SELECT, INSERT, UPDATE, DELETE ON apps.ai_brainbox_vortex_items TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON apps.ai_brainbox_imported_data TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON apps.ai_brainbox_chat_conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON apps.ai_brainbox_chat_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON apps.ai_brainbox_memories TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON apps.ai_brainbox_sessions TO authenticated;
GRANT ALL ON apps.ai_brainbox_ai_response_cache TO service_role;
GRANT SELECT ON apps.ai_brainbox_ai_response_cache TO authenticated;

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION apps.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = 'apps';

CREATE TRIGGER update_vortex_items_updated_at
  BEFORE UPDATE ON apps.ai_brainbox_vortex_items
  FOR EACH ROW EXECUTE FUNCTION apps.update_updated_at();

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON apps.ai_brainbox_chat_conversations
  FOR EACH ROW EXECUTE FUNCTION apps.update_updated_at();

CREATE TRIGGER update_memories_updated_at
  BEFORE UPDATE ON apps.ai_brainbox_memories
  FOR EACH ROW EXECUTE FUNCTION apps.update_updated_at();

-- Create indexes
CREATE INDEX idx_ai_brainbox_vortex_company ON apps.ai_brainbox_vortex_items(company_id);
CREATE INDEX idx_ai_brainbox_vortex_owner ON apps.ai_brainbox_vortex_items(owner_id);
CREATE INDEX idx_ai_brainbox_imported_user ON apps.ai_brainbox_imported_data(user_id);
CREATE INDEX idx_ai_brainbox_conv_user ON apps.ai_brainbox_chat_conversations(user_id);
CREATE INDEX idx_ai_brainbox_msg_conv ON apps.ai_brainbox_chat_messages(conversation_id);
CREATE INDEX idx_ai_brainbox_memories_type ON apps.ai_brainbox_memories(memory_type);
CREATE INDEX idx_ai_brainbox_memories_project ON apps.ai_brainbox_memories(project_ref);
CREATE INDEX idx_ai_brainbox_cache_hash ON apps.ai_brainbox_ai_response_cache(prompt_hash);

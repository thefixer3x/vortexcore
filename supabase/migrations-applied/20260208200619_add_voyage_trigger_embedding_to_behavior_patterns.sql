-- Applied migration 20260208200619 (add_voyage_trigger_embedding_to_behavior_patterns), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.

-- Add voyage embedding column to behavior_patterns
ALTER TABLE security_service.behavior_patterns 
ADD COLUMN IF NOT EXISTS voyage_trigger_embedding vector(1024);

-- Create index for voyage embedding similarity search
CREATE INDEX IF NOT EXISTS idx_behavior_patterns_voyage_embedding 
ON security_service.behavior_patterns 
USING ivfflat (voyage_trigger_embedding vector_cosine_ops)
WITH (lists = 10);

-- Drop and recreate view with new column
DROP VIEW IF EXISTS public.behavior_patterns;
CREATE VIEW public.behavior_patterns AS
SELECT id, user_id, trigger, trigger_embedding, voyage_trigger_embedding, 
       context, actions, final_outcome, confidence, use_count, 
       last_used_at, created_at, updated_at
FROM security_service.behavior_patterns;
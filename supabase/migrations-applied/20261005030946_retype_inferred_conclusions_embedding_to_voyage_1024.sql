-- Applied migration 20261005030946 (retype_inferred_conclusions_embedding_to_voyage_1024), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.

-- memory_inferred_conclusions: align the (empty) embedding column with the Voyage
-- 1024-dim corpus used by memory_entries.voyage_embedding, and expose it through
-- the public view so PostgREST writes from reasoning-processor stop failing.
-- Safe: base table has 0 rows, so the retype moves no data.

DROP INDEX IF EXISTS security_service.idx_memory_inferred_conclusions_embedding;

ALTER TABLE security_service.memory_inferred_conclusions
  ALTER COLUMN embedding TYPE vector(1024);

COMMENT ON COLUMN security_service.memory_inferred_conclusions.embedding IS
  'Voyage embedding, 1024 dims (EMBEDDING_PROVIDER=voyage). Note the asymmetry with '
  'memory_entries.embedding, which is the legacy OpenAI 1536 column; the Voyage vector '
  'there lives in memory_entries.voyage_embedding.';

CREATE INDEX idx_memory_inferred_conclusions_embedding
  ON security_service.memory_inferred_conclusions
  USING hnsw (embedding vector_cosine_ops)
  WHERE (embedding IS NOT NULL);

-- Recreate the view with `embedding` appended. security_invoker is restated
-- explicitly: without it the view would read security_service with the owner's
-- rights, and `authenticated` holds full CRUD grants on it.
CREATE OR REPLACE VIEW public.memory_inferred_conclusions
  WITH (security_invoker = true) AS
SELECT id, subject_id, organization_id, conclusion_type, content, confidence,
       evidence_memory_ids, scope, freshness, superseded_by,
       contradiction_group_id, metadata, created_at, source_job_id,
       embedding
  FROM security_service.memory_inferred_conclusions;
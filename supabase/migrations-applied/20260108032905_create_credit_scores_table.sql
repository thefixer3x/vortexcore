-- Applied migration 20260108032905 (create_credit_scores_table), copied from supabase_migrations.schema_migrations on 2026-11-03.
-- Reference copy only: already applied to the live database. Do not re-run.

-- Credit scores
CREATE TABLE IF NOT EXISTS credit.credit_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  business_id UUID,
  score INTEGER NOT NULL,
  score_band VARCHAR(20),  -- e.g., 'excellent', 'good', 'fair', 'poor'
  bureau VARCHAR(100) NOT NULL,  -- e.g., 'CRC', 'FirstCentral', 'CreditRegistry'
  report_data JSONB NOT NULL DEFAULT '{}',
  factors JSONB DEFAULT '{}',  -- Factors affecting score
  recommendations JSONB DEFAULT '{}',
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT check_entity CHECK (user_id IS NOT NULL OR business_id IS NOT NULL),
  CONSTRAINT check_score CHECK (score >= 0 AND score <= 1000)
);

CREATE INDEX IF NOT EXISTS idx_credit_scores_user ON credit.credit_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_scores_business ON credit.credit_scores(business_id);
CREATE INDEX IF NOT EXISTS idx_credit_scores_bureau ON credit.credit_scores(bureau);
CREATE INDEX IF NOT EXISTS idx_credit_scores_created ON credit.credit_scores(created_at DESC);
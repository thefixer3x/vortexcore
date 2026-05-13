
CREATE TABLE public.vortex_obligations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'other' CHECK (category IN ('loan','bill','subscription','kyc','regulatory','tax','transfer','other')),
  amount NUMERIC(18,2),
  currency TEXT NOT NULL DEFAULT 'NGN',
  due_date TIMESTAMPTZ,
  recurrence TEXT NOT NULL DEFAULT 'none' CHECK (recurrence IN ('none','weekly','monthly','quarterly','yearly')),
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming','due_soon','overdue','completed','dismissed')),
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('ai_detected','manual','imported')),
  confidence NUMERIC(3,2),
  source_ref TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_vortex_obligations_user_due ON public.vortex_obligations(user_id, due_date);
CREATE INDEX idx_vortex_obligations_user_status ON public.vortex_obligations(user_id, status);

ALTER TABLE public.vortex_obligations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "obligations_select_own" ON public.vortex_obligations
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "obligations_insert_own" ON public.vortex_obligations
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "obligations_update_own" ON public.vortex_obligations
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "obligations_delete_own" ON public.vortex_obligations
  FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.vortex_touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_vortex_obligations_updated_at
  BEFORE UPDATE ON public.vortex_obligations
  FOR EACH ROW EXECUTE FUNCTION public.vortex_touch_updated_at();

CREATE TABLE public.vortex_obligation_detections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  run_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  run_completed_at TIMESTAMPTZ,
  transactions_scanned INTEGER NOT NULL DEFAULT 0,
  obligations_created INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running','completed','failed')),
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_vortex_obligation_detections_user ON public.vortex_obligation_detections(user_id, run_started_at DESC);

ALTER TABLE public.vortex_obligation_detections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "obligation_detections_select_own" ON public.vortex_obligation_detections
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "obligation_detections_insert_own" ON public.vortex_obligation_detections
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "obligation_detections_update_own" ON public.vortex_obligation_detections
  FOR UPDATE USING (auth.uid() = user_id);

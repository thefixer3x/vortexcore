-- Edge rate limiting primitives
CREATE TABLE IF NOT EXISTS public.edge_rate_limits (
  user_id uuid NOT NULL,
  action text NOT NULL,
  window_start timestamptz NOT NULL,
  count integer NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, action, window_start)
);

-- Only service role should write; no grants to anon/authenticated
REVOKE ALL ON public.edge_rate_limits FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE ON public.edge_rate_limits TO service_role;

-- Increment function (security definer) to atomically upsert and return new count
CREATE OR REPLACE FUNCTION public.increment_edge_rate(
  p_user_id uuid,
  p_action text,
  p_window_seconds integer DEFAULT 60
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_window_start timestamptz;
  v_count integer;
BEGIN
  -- Align window start to N-second boundary
  v_window_start := date_trunc('second', now()) - make_interval(secs := (extract(epoch from now())::int % p_window_seconds));

  INSERT INTO public.edge_rate_limits(user_id, action, window_start, count)
  VALUES (p_user_id, p_action, v_window_start, 1)
  ON CONFLICT (user_id, action, window_start)
  DO UPDATE SET count = public.edge_rate_limits.count + 1
  RETURNING count INTO v_count;

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_edge_rate(uuid, text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_edge_rate(uuid, text, integer) TO service_role;


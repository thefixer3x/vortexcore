DROP POLICY IF EXISTS "Users can view their own agent sessions" ON public.agent_banks_sessions;
DROP POLICY IF EXISTS "Users can view their own agent memories" ON public.agent_banks_memories;
REVOKE ALL ON public.agent_banks_sessions FROM anon, authenticated;
REVOKE ALL ON public.agent_banks_memories FROM anon, authenticated;
GRANT ALL ON public.agent_banks_sessions TO service_role;
GRANT ALL ON public.agent_banks_memories TO service_role;
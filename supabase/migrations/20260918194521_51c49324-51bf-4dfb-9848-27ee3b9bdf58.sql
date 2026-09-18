CREATE OR REPLACE FUNCTION public.cleanup_stale_sessions()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.active_sessions WHERE last_seen_at < now() - interval '15 seconds';
$$;

ALTER TABLE public.active_sessions REPLICA IDENTITY FULL;

CREATE INDEX IF NOT EXISTS idx_active_sessions_last_seen ON public.active_sessions (last_seen_at DESC);

GRANT EXECUTE ON FUNCTION public.cleanup_stale_sessions() TO authenticated, anon, service_role;
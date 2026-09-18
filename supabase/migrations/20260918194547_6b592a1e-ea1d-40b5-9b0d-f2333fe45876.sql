REVOKE EXECUTE ON FUNCTION public.cleanup_stale_sessions() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_stale_sessions() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_stale_sessions() TO service_role;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
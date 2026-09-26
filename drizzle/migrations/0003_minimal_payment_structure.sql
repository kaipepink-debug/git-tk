ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS items jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS paid_at timestamptz;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tiktok_event_id text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS rastrocode_lock_at timestamptz;
CREATE UNIQUE INDEX IF NOT EXISTS orders_transaction_id_unique ON public.orders (transaction_id) WHERE transaction_id IS NOT NULL;
-- Pedidos: somente o servidor acessa. Nenhum acesso pelo navegador.
DROP POLICY IF EXISTS "Service can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
REVOKE ALL ON public.orders FROM anon, authenticated;
GRANT ALL ON public.orders TO service_role;
-- Log técnico do TikTok: somente o servidor grava.
DROP POLICY IF EXISTS "Anyone can log tiktok events" ON public.tiktok_events;
DROP POLICY IF EXISTS "Admins can view tiktok events" ON public.tiktok_events;
REVOKE ALL ON public.tiktok_events FROM anon, authenticated;
GRANT ALL ON public.tiktok_events TO service_role;
-- Tabelas antigas: bloqueadas até a exclusão definitiva.
DROP POLICY IF EXISTS "Anyone can delete own session" ON public.active_sessions;
DROP POLICY IF EXISTS "Anyone can update sessions" ON public.active_sessions;
DROP POLICY IF EXISTS "Anyone can upsert sessions" ON public.active_sessions;
DROP POLICY IF EXISTS "Service can insert events" ON public.analytics_events;
DROP POLICY IF EXISTS "Service can read gateway_settings" ON public.gateway_settings;
COMMENT ON TABLE public.active_sessions IS 'DEPRECATED: LiveView removido';
COMMENT ON TABLE public.analytics_events IS 'DEPRECATED: métricas internas removidas';
COMMENT ON TABLE public.gateway_settings IS 'DEPRECATED: KirvusPay fixo no código';
COMMENT ON TABLE public.products IS 'DEPRECATED: conteúdo em src/data/storeContent.ts';
COMMENT ON TABLE public.product_reviews IS 'DEPRECATED: conteúdo em src/data/storeContent.ts';
COMMENT ON TABLE public.site_settings IS 'DEPRECATED: conteúdo em src/data/storeContent.ts';
COMMENT ON TABLE public.user_roles IS 'DEPRECATED: painel administrativo removido';
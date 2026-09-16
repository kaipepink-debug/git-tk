ALTER TABLE public.tiktok_events ADD COLUMN IF NOT EXISTS ttclid text;
ALTER TABLE public.tiktok_events ADD COLUMN IF NOT EXISTS ttp text;
ALTER TABLE public.tiktok_events ADD COLUMN IF NOT EXISTS external_id text;
ALTER TABLE public.tiktok_events ADD COLUMN IF NOT EXISTS content_id text;
ALTER TABLE public.tiktok_events ADD COLUMN IF NOT EXISTS http_status integer;
ALTER TABLE public.tiktok_events ADD COLUMN IF NOT EXISTS error_message text;
ALTER TABLE public.tiktok_events ADD COLUMN IF NOT EXISTS retry_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.tiktok_events ADD COLUMN IF NOT EXISTS dedup_blocked boolean NOT NULL DEFAULT false;
ALTER TABLE public.tiktok_events ADD COLUMN IF NOT EXISTS utm jsonb;
ALTER TABLE public.tiktok_events ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS idx_tiktok_events_server_dedup
  ON public.tiktok_events (event_name, event_id)
  WHERE source = 'server' AND dedup_blocked = false AND event_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tiktok_events_name_created
  ON public.tiktok_events (event_name, created_at DESC);

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS utm jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tt_purchase_sent_at timestamp with time zone;
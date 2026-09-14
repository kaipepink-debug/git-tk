CREATE TABLE public.tiktok_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_name text NOT NULL,
  event_id text,
  source text NOT NULL DEFAULT 'browser',
  value numeric,
  currency text NOT NULL DEFAULT 'BRL',
  page text,
  status text NOT NULL DEFAULT 'sent',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT INSERT ON public.tiktok_events TO anon;
GRANT SELECT, INSERT ON public.tiktok_events TO authenticated;
GRANT ALL ON public.tiktok_events TO service_role;

ALTER TABLE public.tiktok_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log tiktok events"
ON public.tiktok_events FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins can view tiktok events"
ON public.tiktok_events FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_tiktok_events_created_at ON public.tiktok_events (created_at DESC);
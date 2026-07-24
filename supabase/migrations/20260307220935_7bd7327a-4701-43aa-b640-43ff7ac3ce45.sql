
CREATE TABLE public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  event_type text NOT NULL, -- 'click', 'scroll'
  page text NOT NULL DEFAULT '/',
  element_tag text, -- e.g. 'BUTTON', 'A', 'IMG'
  element_text text, -- text content of clicked element
  element_id text, -- id attribute if any
  element_class text, -- class attribute
  x_position integer, -- click x coordinate
  y_position integer, -- click y coordinate
  viewport_width integer,
  viewport_height integer,
  scroll_depth integer, -- percentage 0-100
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service can insert events" ON public.analytics_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view events" ON public.analytics_events FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_analytics_events_created ON public.analytics_events (created_at DESC);
CREATE INDEX idx_analytics_events_type ON public.analytics_events (event_type);
CREATE INDEX idx_analytics_events_page ON public.analytics_events (page);

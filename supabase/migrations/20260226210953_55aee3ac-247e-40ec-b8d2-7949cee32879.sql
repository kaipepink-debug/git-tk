
-- Create gateway_settings table for dynamic gateway management
CREATE TABLE public.gateway_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway_name text NOT NULL UNIQUE,
  api_token text NOT NULL DEFAULT '',
  product_id text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gateway_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can read gateway settings
CREATE POLICY "Admins can view gateway_settings"
ON public.gateway_settings
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can insert
CREATE POLICY "Admins can insert gateway_settings"
ON public.gateway_settings
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can update
CREATE POLICY "Admins can update gateway_settings"
ON public.gateway_settings
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete
CREATE POLICY "Admins can delete gateway_settings"
ON public.gateway_settings
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Service role can read (for edge functions)
CREATE POLICY "Service can read gateway_settings"
ON public.gateway_settings
FOR SELECT
USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_gateway_settings_updated_at
BEFORE UPDATE ON public.gateway_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed initial gateways
INSERT INTO public.gateway_settings (gateway_name, api_token, product_id, is_active) VALUES
  ('SigmaPay', '', 'awayav3oag', true),
  ('GoatPay', '', '', false),
  ('ZeroOnePay', '', '', false),
  ('PayEvo', '', '', false);

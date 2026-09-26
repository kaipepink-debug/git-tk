ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS kirvus_webhook_token text;
UPDATE public.gateway_settings SET is_active = false;
INSERT INTO public.gateway_settings (gateway_name, api_token, product_id, is_active)
SELECT 'KirvusPay', '', '', true WHERE NOT EXISTS (SELECT 1 FROM public.gateway_settings WHERE gateway_name='KirvusPay');
UPDATE public.gateway_settings SET is_active = true WHERE gateway_name='KirvusPay';
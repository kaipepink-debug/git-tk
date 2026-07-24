
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS customer_city text,
  ADD COLUMN IF NOT EXISTS customer_state text,
  ADD COLUMN IF NOT EXISTS customer_cep text;

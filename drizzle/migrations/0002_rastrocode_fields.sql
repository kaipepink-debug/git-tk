ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS customer_street text,
  ADD COLUMN IF NOT EXISTS customer_number text,
  ADD COLUMN IF NOT EXISTS customer_neighborhood text,
  ADD COLUMN IF NOT EXISTS customer_complement text,
  ADD COLUMN IF NOT EXISTS rastrocode_tracking_code text,
  ADD COLUMN IF NOT EXISTS rastrocode_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS rastrocode_error text;
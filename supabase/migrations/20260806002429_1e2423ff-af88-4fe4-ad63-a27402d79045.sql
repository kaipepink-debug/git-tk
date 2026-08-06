UPDATE public.products 
SET variants = '[
  {"label": "Menta", "price": 99.90, "oldPrice": 297.77, "stock": 10},
  {"label": "Menta com Rosa", "price": 99.90, "oldPrice": 297.77, "stock": 10},
  {"label": "Azul candy", "price": 99.90, "oldPrice": 297.77, "stock": 10},
  {"label": "Rosa com Menta", "price": 99.90, "oldPrice": 297.77, "stock": 10}
]'::jsonb,
variant_label = 'Modelo'
WHERE is_active = true;
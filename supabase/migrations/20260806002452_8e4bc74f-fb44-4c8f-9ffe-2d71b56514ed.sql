ALTER TABLE public.products ADD COLUMN IF NOT EXISTS models jsonb DEFAULT '[]'::jsonb;

UPDATE public.products 
SET models = '[
  {"name": "Menta", "image": "https://chiquebloja.com/cdn/shop/files/chunta6-menta-costas-sq.jpg"},
  {"name": "Menta com Rosa", "image": "https://chiquebloja.com/cdn/shop/files/17_a4473c18-d69e-4492-9e12-52051ce8db39.jpg"},
  {"name": "Azul candy", "image": "https://chiquebloja.com/cdn/shop/files/21.jpg"},
  {"name": "Rosa com Menta", "image": "https://chiquebloja.com/cdn/shop/files/27_1.webp"}
]'::jsonb,
variant_label = 'Tamanho',
variants = '[
  {"label": "34", "price": 99.90, "oldPrice": 297.77, "stock": 10},
  {"label": "35", "price": 99.90, "oldPrice": 297.77, "stock": 10},
  {"label": "36", "price": 99.90, "oldPrice": 297.77, "stock": 10},
  {"label": "37", "price": 99.90, "oldPrice": 297.77, "stock": 10},
  {"label": "38", "price": 99.90, "oldPrice": 297.77, "stock": 10},
  {"label": "39", "price": 99.90, "oldPrice": 297.77, "stock": 10},
  {"label": "40", "price": 99.90, "oldPrice": 297.77, "stock": 10},
  {"label": "41", "price": 99.90, "oldPrice": 297.77, "stock": 10},
  {"label": "42", "price": 99.90, "oldPrice": 297.77, "stock": 10},
  {"label": "43", "price": 99.90, "oldPrice": 297.77, "stock": 10}
]'::jsonb
WHERE is_active = true;
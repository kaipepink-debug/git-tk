UPDATE public.products 
SET models = '[
  {"name": "Menta", "image": "https://chiquebloja.com/cdn/shop/files/chunta6-menta-costas-sq.jpg", "imageIndex": 2},
  {"name": "Menta com Rosa", "image": "https://chiquebloja.com/cdn/shop/files/17_a4473c18-d69e-4492-9e12-52051ce8db39.jpg", "imageIndex": 1},
  {"name": "Azul candy", "image": "https://chiquebloja.com/cdn/shop/files/21.jpg", "imageIndex": 3},
  {"name": "Rosa com Menta", "image": "https://chiquebloja.com/cdn/shop/files/27_1.webp", "imageIndex": 4}
]'::jsonb
WHERE is_active = true;
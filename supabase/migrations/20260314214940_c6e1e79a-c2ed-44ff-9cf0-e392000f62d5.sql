INSERT INTO public.site_settings (key, value) VALUES 
  ('presell_enabled', 'true'),
  ('presell_button_text', 'Deslize para obter a oferta →'),
  ('presell_instruction_text', 'Arraste o botão para a direita para liberar a oferta'),
  ('presell_button_color', '#FE2C55')
ON CONFLICT (key) DO NOTHING;
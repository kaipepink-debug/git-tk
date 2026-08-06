UPDATE products 
SET 
  title = 'Tênis Chunta 6.0', 
  description = '⚠️ PEÇA O TAMANHO QUE VOCÊ USA NORMALMENTE NO BRASIL — O AJUSTE É EXATO
🏃 PARA CORREDORES DE VERDADE
Chunta 6.0

O tênis que une tecnologia de ponta com leveza extrema — feito pra você ir mais longe, mais rápido e sem desconforto.

🏃 ESTABILIDADE
Com placa interna antitorção para maior firmeza e suporte.
🌬️ LEVEZA
Malha aérea que mantém o pé fresco do km 1 ao 21
🛡️ ABSORÇÃO
Palmilha EVA que protege articulações no longo prazo
O Chunta 6.0 foi desenvolvido para corredores que não abrem mão de performance. Seja no treino diário, na corrida de rua ou na meia maratona, ele entrega estabilidade em cada passada — graças à combinação de malha aérea, palmilha EVA e sola de borracha. Design super arrojado, tecnologia real e preço acessível.

🛠️ ESPECIFICAÇÕES TÉCNICAS
👟 AJUSTE: Tamanho exato — peça o seu número normal
🌐 CABEDAL: Malha aérea de alta qualidade — ventilação superior
🧶 PALMILHA: EVA — absorção de impacto e conforto prolongado
⚙️ SOLA: Borracha — aderência em asfalto, trilha e pista
🔒 FIXAÇÃO: Cadarço com costura reforçada — zero folga em ritmo forte
🦵 CANO: Baixo — liberdade total de movimento no tornozelo
💨 PROPRIEDADES: Respirável · Anti-odor · Leve · Resistente
⚖️ GÊNERO: Unissex
⚡ TECNOLOGIA DE ELITE: A placa inserida na entressola garante estabilidade e absorção de impacto.

🏆 IDEAL PARA:
• Corridas de rua — 5km, 10km, meia e maratona
• Treinos diários de alta intensidade
• Corredores que buscam tecnologia com custo-benefício real
• Uso esportivo com estilo e design moderno
• Quem tem pé sensível e precisa de amortecimento confiável

Produto original Chiqueb — qualidade garantida.',
  images = '[
    "https://chiquebloja.com/cdn/shop/files/25_2.webp",
    "https://chiquebloja.com/cdn/shop/files/17_a4473c18-d69e-4492-9e12-52051ce8db39.jpg",
    "https://chiquebloja.com/cdn/shop/files/chunta6-menta-costas-sq.jpg",
    "https://chiquebloja.com/cdn/shop/files/21.jpg",
    "https://chiquebloja.com/cdn/shop/files/27_1.webp",
    "https://chiquebloja.com/cdn/shop/files/16_6a270a0a-a611-4d54-9cbe-446d98c02491.jpg",
    "https://chiquebloja.com/cdn/shop/files/11_1458444b-c9b4-43c7-9982-76e0947add13.jpg",
    "https://chiquebloja.com/cdn/shop/files/26_2.webp",
    "https://chiquebloja.com/cdn/shop/files/7_61f49573-e3e9-4e25-8284-489d049f2070.jpg",
    "https://chiquebloja.com/cdn/shop/files/24_1.webp",
    "https://chiquebloja.com/cdn/shop/files/8_104e087c-514d-450c-8a31-191c412d380e.jpg",
    "https://chiquebloja.com/cdn/shop/files/12.jpg"
  ]'::jsonb,
  cart_image = 'https://chiquebloja.com/cdn/shop/files/25_2.webp',
  variants = '[
    {"label": "34", "price": 99.9, "oldPrice": 297.77, "stock": 0},
    {"label": "35", "price": 99.9, "oldPrice": 297.77, "stock": 4},
    {"label": "36", "price": 99.9, "oldPrice": 297.77, "stock": 6},
    {"label": "37", "price": 99.9, "oldPrice": 297.77, "stock": 8},
    {"label": "38", "price": 99.9, "oldPrice": 297.77, "stock": 9},
    {"label": "39", "price": 99.9, "oldPrice": 297.77, "stock": 7},
    {"label": "40", "price": 99.9, "oldPrice": 297.77, "stock": 6},
    {"label": "41", "price": 99.9, "oldPrice": 297.77, "stock": 5},
    {"label": "42", "price": 99.9, "oldPrice": 297.77, "stock": 4},
    {"label": "43", "price": 99.9, "oldPrice": 297.77, "stock": 3},
    {"label": "44", "price": 99.9, "oldPrice": 297.77, "stock": 2}
  ]'::jsonb
WHERE is_active = true;

UPDATE site_settings SET value = 'CHIQUEB LOJA' WHERE key = 'company_name';
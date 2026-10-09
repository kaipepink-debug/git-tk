/**
 * Conteúdo estático da loja (antes vinha do banco de dados).
 * Edite aqui produto, preços, avaliações e configurações públicas.
 *
 * ATENÇÃO: os preços aqui são só o que o cliente VÊ. Quem cobra é o servidor,
 * em supabase/functions/_shared/pricing.ts, e ele recalcula tudo por conta
 * própria. Mudou preço aqui, muda lá também — senão o checkout recusa o
 * pedido dizendo que o valor mudou.
 */

export interface StoreVariant { label: string; price: number; oldPrice: number; stock: number; delivery?: string }

export const PRODUCT = {
  "id": "7c4b1f3a-9d28-4e61-a0f5-3b8e2c6d9147",
  "title": "Cooler Térmica Makita DCW180Z Refrigerador e Aquecedor 20L Bateria 18V e 12V/24V",
  "description": "**Cooler Térmica Makita DCW180Z — Refrigerador e Aquecedor 20 L**\nA DCW180Z não é um cooler comum: ela tem compressor, o mesmo princípio de uma geladeira. Por isso gela de verdade, sem depender de gelo, e mantém a temperatura escolhida mesmo com o sol batendo em cima.\nFunciona de três jeitos — com duas baterias 18V LXT, ligada na tomada do carro (12V ou 24V) ou na tomada de parede. Vai da obra ao churrasco, da estrada ao acampamento, sem ficar presa a um único lugar.\nTambém esquenta. São 4 níveis de refrigeração e 2 de aquecimento, escolhidos no painel digital, que mostra a temperatura o tempo todo.\n---\n**Principais características**\n✔ Capacidade de 20 litros\n✔ Refrigeração por compressor — gela sem gelo\n✔ 4 níveis de frio: -9 °C, -1 °C, 4 °C e 10 °C\n✔ 2 níveis de calor: 54 °C e 60 °C\n✔ Três fontes de energia: bateria 18V LXT, tomada do carro (12V/24V) ou tomada de parede\n✔ Até 17 horas ligada com duas baterias 6.0Ah no modo 4 °C\n✔ Painel digital com a temperatura à vista\n✔ Rodas e alça telescópica — puxa em vez de carregar\n✔ Adaptadores para tomada e para carro já incluídos\n---\n**Ficha técnica**\n✔ Medidas: 62,2 × 34,0 × 37,1 cm\n✔ Peso: 14,5 kg (com bateria)\n✔ Alimentação: 2× bateria 18V LXT, 12V/24V DC ou 127/220V\n---\n**Ideal para**\n✔ Obra e trabalho externo — bebida gelada e marmita quente no mesmo lugar\n✔ Viagem de carro, praia e camping\n✔ Pesca, churrasco e acampamento\n✔ Transporte de remédio e insulina\n---\n**Observação importante**\nAs baterias e o carregador são vendidos separadamente — a caixa acompanha os adaptadores de tomada e de carro. A autonomia varia conforme a temperatura escolhida, a capacidade das baterias e o calor do ambiente.",
  "images": [
    "/images/product/cooler-hero.webp",
    "/images/product/cooler-aberta-obra.webp",
    "/images/product/cooler-interior.webp",
    "/images/product/cooler-painel.webp",
    "/images/product/cooler-lateral.webp",
    "/images/product/cooler-piquenique.webp",
    "/images/product/cooler-rodinhas.webp",
    "/images/product/cooler-carro.webp"
  ],
  "cart_image": "/images/product/cooler-hero.webp",
  "slug": "produto",
  "social_proof": false,
  "bumps": true,
  "exit_offer": true,
  "delivery_text": "",
  "protection": ["Devolução gratuita", "Reembolso automático por danos", "Pagamento seguro", "Cupom por atraso na coleta"],
  "rating": 0,
  "rating_count": 0,
  "sold_count": 0,
  "default_variant": 0,
  "badges": [],
  "variant_label": "Modelo",
  "variants": [
    {
      "label": "DCW180Z 20 L",
      "price": 89.75,
      "oldPrice": 899.9,
      "stock": 12
    }
  ]
};

/**
 * Buggy elétrico — segundo produto da loja, em /buggy.
 *
 * Sem contagem de vendas, avaliações nem "preço de" riscado: o produto acabou
 * de entrar e nada disso existe ainda (`social_proof: false`, `oldPrice: 0`).
 * O preço sai do custo de importação, não de um desconto fictício.
 * Mudou o preço aqui, muda também em supabase/functions/_shared/pricing.ts.
 */
export const BUGGY = {
  "id": "b7e2d4a1-5c3f-4e8a-9b61-2f0d8c4a7e15",
  "slug": "buggy",
  "title": "Buggy Elétrico Off-Road Adulto até 80 km/h — Gaiola de Proteção e Pneus de Trilha",
  "description": "**Buggy Elétrico Off-Road — até 80 km/h**\nTrilha, terra, areia e cascalho com a força de um motor elétrico de 2000 a 2500 W. Sem gasolina, sem troca de óleo e sem barulho de escapamento: carregou, ligou, saiu.\nO chassi é de aço, com gaiola de proteção em volta do piloto, e os pneus de garra alta seguram em piso solto. Atrás, o motor trabalha direto no eixo com diferencial, que é o que faz as duas rodas empurrarem juntas nas curvas.\n---\n**Três versões**\n✔ 2000W · 50 km/h — pronta entrega no Brasil\n✔ 2500W · 60 km/h — mais força para subida e areia (sob encomenda)\n✔ 2000W fio chato · 80 km/h — motor de alto desempenho, a mais rápida (sob encomenda)\n---\n**O que vem nele**\n✔ Motor elétrico de 2000 W ou 2500 W, conforme a versão\n✔ Velocidade máxima de 50, 60 ou 80 km/h, conforme a versão\n✔ Partida elétrica\n✔ Chassi de aço com gaiola de proteção (santo antônio)\n✔ Amortecedores com mola na dianteira e na traseira\n✔ Eixo traseiro com diferencial\n✔ Pneus off-road de garra alta em rodas de aço\n✔ Farol dianteiro\n✔ Volante esportivo e banco tipo concha\n---\n**Por que elétrico**\n✔ Sem gasolina — carrega na tomada\n✔ Silencioso — dá para andar sem incomodar vizinho nem assustar bicho\n✔ Manutenção simples — não tem óleo, vela, filtro nem carburador\n---\n**Ideal para**\n✔ Sítio, chácara e fazenda\n✔ Trilha e passeio em terra\n✔ Pousada, camping e parque de aventura\n✔ Diversão de fim de semana em área particular\n---\n**Antes de comprar**\nUso off-road, em área particular: o buggy não é emplacável e não pode circular em via pública. Indicado para adultos; adolescente só com supervisão e equipamento de proteção (capacete, no mínimo).\nA versão de 50 km/h é pronta entrega no Brasil. As de 60 e 80 km/h são importadas depois da compra, com entrega em até 90 dias. Em todas, o envio é por transportadora, com frete já incluso no preço.",
  "images": [
    "/images/buggy/buggy-frente-lateral.webp",
    "/images/buggy/buggy-frente.webp",
    "/images/buggy/buggy-lateral.webp",
    "/images/buggy/buggy-motor-eixo.webp",
    "/images/buggy/buggy-pneu.webp",
    "/images/buggy/buggy-volante.webp"
  ],
  "cart_image": "/images/buggy/buggy-frente-lateral.webp",
  "social_proof": false,
  "bumps": false,
  "exit_offer": false,
  "delivery_text": "Pronta entrega · enviado por transportadora em até 5 dias úteis após o pagamento",
  "protection": ["Pagamento seguro via Pix", "Garantia legal de 90 dias", "7 dias para desistir da compra", "Nota fiscal"],
  "rating": 0,
  "rating_count": 0,
  "sold_count": 0,
  "default_variant": 0,
  "badges": [],
  "variant_label": "Versão",
  "variants": [
    {
      "label": "2000W · 50 km/h",
      "price": 24990.0,
      "oldPrice": 0,
      "stock": 99,
      "delivery": "Pronta entrega · enviado por transportadora em até 5 dias úteis após o pagamento"
    },
    {
      "label": "2500W · 60 km/h",
      "price": 27990.0,
      "oldPrice": 0,
      "stock": 99,
      "delivery": "Sob encomenda · importado após a compra, entrega em até 90 dias"
    },
    {
      "label": "2000W fio chato · 80 km/h",
      "price": 29990.0,
      "oldPrice": 0,
      "stock": 99,
      "delivery": "Sob encomenda · importado após a compra, entrega em até 90 dias"
    }
  ]
};

export type StoreProduct = typeof PRODUCT;

/** Produtos da loja pelo endereço da página. */
export const PRODUCTS: Record<string, StoreProduct> = { produto: PRODUCT, buggy: BUGGY as StoreProduct };

/** Preço da oferta de saída (popup de abandono). */
export const EXIT_OFFER_PRICE = 52.84;

/**
 * Nome fantasia — como a loja se apresenta ao cliente (card do vendedor,
 * carrinho, checkout). É diferente da razão social logo abaixo, e pode ser:
 * quem responde pela venda é a empresa registrada, não o nome da vitrine.
 */
export const STORE_NAME = "Monster Tools";

/** Razão social e CNPJ — o que vai nas páginas legais. NÃO é o nome da loja. */
export const COMPANY_INFO = {
  company_name: "MONSTER MOBILIDADE LTDA",
  cnpj: "64.482.958/0001-00",
  contact_email: "monstereletric@gmail.com",
  contact_phone: "(89) 98102-5918",
  company_address: "",
};

/** Pré-venda (tela de deslizar antes do produto). */
export const PRESELL = {
  enabled: false,
  buttonText: "Deslize para obter a oferta →",
  instructionText: "Arraste o botão para a direita para liberar a oferta",
  buttonColor: "#FE2C55",
};

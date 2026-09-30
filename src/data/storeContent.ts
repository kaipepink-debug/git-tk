/**
 * Conteúdo estático da loja (antes vinha do banco de dados).
 * Edite aqui produto, preços, avaliações e configurações públicas.
 *
 * ATENÇÃO: os preços aqui são só o que o cliente VÊ. Quem cobra é o servidor,
 * em supabase/functions/_shared/pricing.ts, e ele recalcula tudo por conta
 * própria. Mudou preço aqui, muda lá também — senão o checkout recusa o
 * pedido dizendo que o valor mudou.
 */

export interface StoreVariant { label: string; price: number; oldPrice: number; stock: number }

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
  "rating": 4.9,
  "rating_count": 1147,
  "sold_count": 2800,
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

/** Preço da oferta de saída (popup de abandono). */
export const EXIT_OFFER_PRICE = 52.84;

export interface StoreReview {
  id: string; reviewer_name: string; reviewer_initial: string; avatar_url: string | null;
  rating: number; review_text: string; photos: string[]; days_ago: number;
}

export const REVIEWS: StoreReview[] = [
  {
    "id": "00000000-0000-411c-a000-000000003039",
    "reviewer_name": "Lucas Ferreira",
    "reviewer_initial": "L",
    "avatar_url": "/images/reviews/avatar-lucas.webp",
    "rating": 5,
    "review_text": "Comprei pra usar na obra e virou item obrigatório da caminhonete. Ligo no 12V e chego no serviço com tudo gelado. O que mais me surpreendeu foi esquentar a marmita sem precisar de micro-ondas.",
    "photos": [
      "/images/reviews/review-cooler-obra.webp",
      "/images/reviews/review-cooler-tomada.webp"
    ],
    "days_ago": 1
  },
  {
    "id": "00000000-0000-411c-a000-000000004f28",
    "reviewer_name": "Mariana Souza",
    "reviewer_initial": "M",
    "avatar_url": "/images/reviews/avatar-mariana.webp",
    "rating": 5,
    "review_text": "Levei pra praia no fim de semana e não precisei comprar gelo nenhum. Ela gela sozinha, é isso que muda tudo. Cabe bastante coisa, coloquei duas garrafas de 2L em pé e ainda sobrou espaço.",
    "photos": [
      "/images/reviews/review-cooler-aberta.webp"
    ],
    "days_ago": 2
  },
  {
    "id": "00000000-0000-411c-a000-000000006e17",
    "reviewer_name": "Bruno Almeida",
    "reviewer_initial": "B",
    "avatar_url": null,
    "rating": 5,
    "review_text": "Uso pra transportar insulina. O painel mostra a temperatura o tempo todo, então eu não fico no escuro achando que está gelando. Tranquilidade que não tem preço.",
    "photos": [],
    "days_ago": 3
  },
  {
    "id": "00000000-0000-411c-a000-000000008d06",
    "reviewer_name": "Camila Rodrigues",
    "reviewer_initial": "C",
    "avatar_url": "/images/reviews/avatar-camila.webp",
    "rating": 4,
    "review_text": "Excelente, só achei mais pesada do que imaginava. Mas como tem rodinha e alça, dá pra puxar tranquilo. Só não pensa que vai carregar no braço.",
    "photos": [
      "/images/reviews/review-cooler-mao.webp"
    ],
    "days_ago": 4
  },
  {
    "id": "00000000-0000-411c-a000-00000000abf5",
    "reviewer_name": "Rafael Lima",
    "reviewer_initial": "R",
    "avatar_url": "/images/reviews/avatar-rafael.webp",
    "rating": 5,
    "review_text": "Viagem de 9 horas com ela ligada na tomada do carro, sem esquentar nem dar problema. Chegamos com tudo gelado.",
    "photos": [
      "/images/reviews/review-cooler-tomada.webp"
    ],
    "days_ago": 5
  },
  {
    "id": "00000000-0000-411c-a000-00000000cae4",
    "reviewer_name": "Patrícia Nunes",
    "reviewer_initial": "P",
    "avatar_url": null,
    "rating": 5,
    "review_text": "Comprei pro meu marido que é pedreiro e ele não larga mais. Disse que os colegas ficaram doidos pra saber onde comprei.",
    "photos": [
      "/images/reviews/review-cooler-obra.webp"
    ],
    "days_ago": 6
  },
  {
    "id": "00000000-0000-411c-a000-00000000e9d3",
    "reviewer_name": "Diego Martins",
    "reviewer_initial": "D",
    "avatar_url": "/images/reviews/avatar-mariana.webp",
    "rating": 5,
    "review_text": "O compressor faz diferença mesmo. Já tive cooler daqueles de pastilha e não chega perto — aquele só deixa fresquinho, esse aqui gela de verdade.",
    "photos": [],
    "days_ago": 7
  },
  {
    "id": "00000000-0000-411c-a000-0000000108c2",
    "reviewer_name": "Ana Carolina",
    "reviewer_initial": "A",
    "avatar_url": "/images/reviews/avatar-bruno.webp",
    "rating": 5,
    "review_text": "Uso no camping. Duas baterias 6Ah seguraram a noite inteira no modo intermediário. De manhã ainda estava gelado.",
    "photos": [
      "/images/reviews/review-cooler-quintal.webp"
    ],
    "days_ago": 8
  },
  {
    "id": "00000000-0000-411c-a000-0000000127b1",
    "reviewer_name": "Thiago Barbosa",
    "reviewer_initial": "T",
    "avatar_url": null,
    "rating": 5,
    "review_text": "Chegou antes do prazo e muito bem embalada. Já testei nas três tomadas: bateria, carro e parede. Funciona em todas.",
    "photos": [],
    "days_ago": 9
  },
  {
    "id": "00000000-0000-411c-a000-0000000146a0",
    "reviewer_name": "Juliana Castro",
    "reviewer_initial": "J",
    "avatar_url": "/images/reviews/avatar-rafael.webp",
    "rating": 5,
    "review_text": "O que me ganhou foi aquecer. Levo comida pronta pro meu filho e chega na temperatura certa. Não precisa mais parar em lanchonete de estrada.",
    "photos": [
      "/images/reviews/review-cooler-familia.webp"
    ],
    "days_ago": 10
  },
  {
    "id": "00000000-0000-411c-a000-00000001658f",
    "reviewer_name": "Marcos Vinícius",
    "reviewer_initial": "M",
    "avatar_url": "/images/reviews/avatar-lucas.webp",
    "rating": 4,
    "review_text": "Produto muito bom. Tirei uma estrela só porque a bateria não vem junto, e isso não estava tão claro pra mim na hora. Fora isso, recomendo.",
    "photos": [],
    "days_ago": 11
  },
  {
    "id": "00000000-0000-411c-a000-00000001847e",
    "reviewer_name": "Fernanda Dias",
    "reviewer_initial": "F",
    "avatar_url": null,
    "rating": 5,
    "review_text": "Meu marido é técnico e passa o dia na rua. Agora leva almoço quente e água gelada na mesma caixa. Melhor presente que já dei.",
    "photos": [],
    "days_ago": 12
  },
  {
    "id": "00000000-0000-411c-a000-00000001a36d",
    "reviewer_name": "Roberto Nascimento",
    "reviewer_initial": "R",
    "avatar_url": "/images/reviews/avatar-bruno.webp",
    "rating": 5,
    "review_text": "Comprei pra pescaria. Peixe voltou gelado igual saiu da água. A alça telescópica ajuda demais pra puxar na areia.",
    "photos": [
      "/images/reviews/review-cooler-quintal.webp"
    ],
    "days_ago": 13
  },
  {
    "id": "00000000-0000-411c-a000-00000001c25c",
    "reviewer_name": "Larissa Pereira",
    "reviewer_initial": "L",
    "avatar_url": "/images/reviews/avatar-camila.webp",
    "rating": 5,
    "review_text": "Qualidade Makita de sempre. Plástico grosso, dobradiça firme, nada de peça mole. Dá pra ver que foi feita pra apanhar.",
    "photos": [],
    "days_ago": 14
  },
  {
    "id": "00000000-0000-411c-a000-00000001e14b",
    "reviewer_name": "Eduardo Ramos",
    "reviewer_initial": "E",
    "avatar_url": null,
    "rating": 5,
    "review_text": "Uso dentro da van de entrega. Ligada o dia inteiro no 24V, sem drama. Os produtos chegam na temperatura certa.",
    "photos": [
      "/images/reviews/review-cooler-tomada.webp"
    ],
    "days_ago": 15
  },
  {
    "id": "00000000-0000-411c-a000-00000002003a",
    "reviewer_name": "Vanessa Moreira",
    "reviewer_initial": "V",
    "avatar_url": "/images/reviews/avatar-lucas.webp",
    "rating": 5,
    "review_text": "Fiz churrasco no quintal e ela ficou do lado da mesa. Ninguém precisou entrar em casa pra pegar bebida a tarde toda.",
    "photos": [
      "/images/reviews/review-cooler-quintal.webp"
    ],
    "days_ago": 16
  },
  {
    "id": "00000000-0000-411c-a000-000000021f29",
    "reviewer_name": "Gustavo Henrique",
    "reviewer_initial": "G",
    "avatar_url": "/images/reviews/avatar-mariana.webp",
    "rating": 5,
    "review_text": "Cabe muito mais do que parece. Enchi de lata e ainda coube marmita em cima.",
    "photos": [
      "/images/reviews/review-cooler-aberta.webp"
    ],
    "days_ago": 17
  },
  {
    "id": "00000000-0000-411c-a000-000000023e18",
    "reviewer_name": "Simone Ribeiro",
    "reviewer_initial": "S",
    "avatar_url": null,
    "rating": 4,
    "review_text": "Boa demais. O único ponto é que ocupa espaço no porta-malas do carro pequeno. Meça antes se o seu for compacto.",
    "photos": [],
    "days_ago": 18
  },
  {
    "id": "00000000-0000-411c-a000-000000025d07",
    "reviewer_name": "Alexandre Costa",
    "reviewer_initial": "A",
    "avatar_url": "/images/reviews/avatar-camila.webp",
    "rating": 5,
    "review_text": "Trabalho com manutenção predial e passo o dia fora. Água gelada às 15h no sol é outra vida.",
    "photos": [
      "/images/reviews/review-cooler-obra.webp"
    ],
    "days_ago": 19
  },
  {
    "id": "00000000-0000-411c-a000-000000027bf6",
    "reviewer_name": "Beatriz Cardoso",
    "reviewer_initial": "B",
    "avatar_url": "/images/reviews/avatar-rafael.webp",
    "rating": 5,
    "review_text": "Comprei desconfiada pelo preço e me surpreendi. Chegou certinho, funciona igual ao anúncio.",
    "photos": [],
    "days_ago": 20
  },
  {
    "id": "00000000-0000-411c-a000-000000029ae5",
    "reviewer_name": "Paulo Sérgio",
    "reviewer_initial": "P",
    "avatar_url": null,
    "rating": 5,
    "review_text": "O visor digital é o detalhe que faz diferença. Você escolhe a temperatura e ela mantém, não fica adivinhando.",
    "photos": [
      "/images/reviews/review-cooler-mao.webp"
    ],
    "days_ago": 21
  },
  {
    "id": "00000000-0000-411c-a000-00000002b9d4",
    "reviewer_name": "Renata Lopes",
    "reviewer_initial": "R",
    "avatar_url": "/images/reviews/avatar-mariana.webp",
    "rating": 5,
    "review_text": "Levamos pro sítio no fim de semana. Ligada na tomada de lá, segurou tudo. Voltamos com sobra de gelo que nem usamos.",
    "photos": [
      "/images/reviews/review-cooler-familia.webp"
    ],
    "days_ago": 22
  },
  {
    "id": "00000000-0000-411c-a000-00000002d8c3",
    "reviewer_name": "Felipe Andrade",
    "reviewer_initial": "F",
    "avatar_url": "/images/reviews/avatar-bruno.webp",
    "rating": 5,
    "review_text": "Melhor compra do ano. Já indiquei pra três colegas de serviço.",
    "photos": [],
    "days_ago": 23
  },
  {
    "id": "00000000-0000-411c-a000-00000002f7b2",
    "reviewer_name": "Cristiane Melo",
    "reviewer_initial": "C",
    "avatar_url": null,
    "rating": 5,
    "review_text": "Uso pra transportar bolo e doce de encomenda. No modo frio eles chegam inteiros, sem derreter cobertura.",
    "photos": [],
    "days_ago": 25
  },
  {
    "id": "00000000-0000-411c-a000-0000000316a1",
    "reviewer_name": "Anderson Tavares",
    "reviewer_initial": "A",
    "avatar_url": "/images/reviews/avatar-rafael.webp",
    "rating": 5,
    "review_text": "Simples de usar, liga e escolhe. Não tem menu complicado nem manual de cem páginas.",
    "photos": [],
    "days_ago": 27
  }
];

/** Dados da empresa exibidos no rodapé e na pré-venda. */
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

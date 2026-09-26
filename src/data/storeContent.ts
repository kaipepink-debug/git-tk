/**
 * Conteúdo estático da loja (antes vinha do banco de dados).
 * Edite aqui produto, preços, avaliações e configurações públicas.
 */

export interface StoreVariant { label: string; price: number; oldPrice: number; stock: number }

export const PRODUCT = {
  "id": "35d010e2-4b26-4b96-a718-1ac8859f1329",
  "title": "Bicicleta Bike Eletrica V9 Max 1000w 48km Freio Hidraulico",
  "description": "**Bike Elétrica V9 Max 1000W**\nA V9 Max combina potência, conforto e praticidade para quem busca uma alternativa moderna para os deslocamentos do dia a dia.\nEquipada com motor elétrico de 1000W, oferece ótimo desempenho tanto para trajetos urbanos quanto para percursos que exigem mais força. Sua bateria proporciona autonomia anunciada de até 48 km, permitindo realizar diversos trajetos sem precisar recarregar constantemente.\nOs freios hidráulicos proporcionam frenagens mais precisas e seguras, enquanto os pneus de aro 20 contribuem para estabilidade e conforto durante a condução.\n---\n**Principais características**\n✔ Motor elétrico de 1000W\n✔ Autonomia anunciada de até 48 km\n✔ Freios hidráulicos\n✔ Rodas aro 20\n✔ Estrutura robusta\n✔ Condução confortável\n✔ Bateria recarregável\n✔ Baixo custo de utilização comparado a veículos a combustão\n---\n**Ideal para**\n✔ Deslocamentos urbanos no dia a dia\n✔ Passeios e lazer\n✔ Quem busca mobilidade, economia e potência\n---\n**Observação**\nAutonomia pode variar conforme peso do condutor, velocidade, terreno, inclinações, calibragem dos pneus e modo de utilização.",
  "images": [
    "/images/product/v9-max-hero.webp",
    "/images/product/v9-max-brindes.webp",
    "/images/product/v9-max-nfc-acessorios.webp",
    "/images/product/v9-max-variacoes.webp",
    "/images/product/v9-max-cambio-nfc.webp",
    "/images/product/v9-max-detalhes.webp",
    "/images/product/v9-max-seguranca.webp"
  ],
  "cart_image": "/images/product/v9-max-hero.webp",
  "rating": 4.9,
  "rating_count": 1284,
  "sold_count": 3100,
  "default_variant": 0,
  "badges": [],
  "variant_label": "Cor",
  "variants": [
    {
      "label": "Preto",
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
    "id": "2c25daae-7067-40f2-b167-794691a25710",
    "reviewer_name": "Lucas Ferreira",
    "reviewer_initial": "L",
    "avatar_url": null,
    "rating": 5,
    "review_text": "Umas das melhores compras que já fiz!. Excelente qualidade. Fácil achar peças para manutenção e upgrade. Vem pré montada, gastei umas 4 horas para montar com ajuda da minha namorada para segurar.",
    "photos": [
      "/images/reviews/review-bike-traseira.webp",
      "/images/reviews/review-bike-frente.webp",
      "/images/reviews/review-bike-lateral.webp"
    ],
    "days_ago": 1
  },
  {
    "id": "8736f97b-ae44-4d5c-ab33-fbacad63f052",
    "reviewer_name": "Mariana Souza",
    "reviewer_initial": "M",
    "avatar_url": null,
    "rating": 5,
    "review_text": "Gostei muito. Satisfeita com minha comprar. Nota 1. 000😁.",
    "photos": [
      "/images/reviews/review-bike-garagem.webp"
    ],
    "days_ago": 2
  },
  {
    "id": "496c769f-3be8-42de-ab93-2731cdfe1713",
    "reviewer_name": "Rafael Oliveira",
    "reviewer_initial": "R",
    "avatar_url": null,
    "rating": 5,
    "review_text": "Produto original, lacrado. Recomendo a loja.",
    "photos": [
      "/images/reviews/review-bike-caixa.webp"
    ],
    "days_ago": 2
  },
  {
    "id": "73e497f8-be0f-4595-882a-39b004f5e67f",
    "reviewer_name": "Camila Santos",
    "reviewer_initial": "C",
    "avatar_url": null,
    "rating": 5,
    "review_text": "Entrega antes do prazo, tudo perfeito.",
    "photos": [
      "/images/reviews/review-bike-vl20.webp"
    ],
    "days_ago": 3
  },
  {
    "id": "d39cc9b0-6e20-42a3-8b3a-c2ce8f294ae2",
    "reviewer_name": "Bruno Almeida",
    "reviewer_initial": "B",
    "avatar_url": null,
    "rating": 5,
    "review_text": "Amei, se a bateria fosse de 20 ah seria a top, mas e confortável, e ta ajudando nas entregas.",
    "photos": [],
    "days_ago": 3
  },
  {
    "id": "51d7135c-cc15-49e6-aadc-86b191e6e40c",
    "reviewer_name": "Juliana Costa",
    "reviewer_initial": "J",
    "avatar_url": null,
    "rating": 5,
    "review_text": "Comprei com medo, mas chegou tudo certo. Loja confiável!",
    "photos": [],
    "days_ago": 4
  },
  {
    "id": "459697d0-3493-431c-abd5-1002ca216bdc",
    "reviewer_name": "Pedro Henrique Lima",
    "reviewer_initial": "P",
    "avatar_url": null,
    "rating": 5,
    "review_text": "A bike é muito boa, motor forte e roda liso na cidade.",
    "photos": [],
    "days_ago": 4
  },
  {
    "id": "dd4012df-a184-4827-af76-8e1dcbdec1e6",
    "reviewer_name": "Fernanda Rocha",
    "reviewer_initial": "F",
    "avatar_url": null,
    "rating": 5,
    "review_text": "Presente de aniversário do marido, ele ficou muito feliz.",
    "photos": [],
    "days_ago": 5
  },
  {
    "id": "f2be100f-38f3-4156-a8ef-d3af7408660f",
    "reviewer_name": "Gustavo Martins",
    "reviewer_initial": "G",
    "avatar_url": null,
    "rating": 5,
    "review_text": "Veio com todos os cabos e manual. Nota 10.",
    "photos": [],
    "days_ago": 5
  },
  {
    "id": "2d6d2016-2f1f-4882-ad25-ace14f1ecfcf",
    "reviewer_name": "Aline Barbosa",
    "reviewer_initial": "A",
    "avatar_url": null,
    "rating": 5,
    "review_text": "Pagamento no Pix aprovado na hora e entrega rápida.",
    "photos": [],
    "days_ago": 6
  },
  {
    "id": "1cc0f177-9b72-401d-9672-94ca0010a8ba",
    "reviewer_name": "Thiago Ribeiro",
    "reviewer_initial": "T",
    "avatar_url": null,
    "rating": 5,
    "review_text": "Melhor preço que encontrei. Produto impecável.",
    "photos": [],
    "days_ago": 6
  },
  {
    "id": "e36be147-c630-411f-9bd1-ec83575fd4d9",
    "reviewer_name": "Larissa Mendes",
    "reviewer_initial": "L",
    "avatar_url": null,
    "rating": 5,
    "review_text": "Chegou em perfeito estado, super recomendo.",
    "photos": [],
    "days_ago": 7
  },
  {
    "id": "dbb1d68c-c354-41ed-a921-26a3465bec8e",
    "reviewer_name": "Diego Carvalho",
    "reviewer_initial": "D",
    "avatar_url": null,
    "rating": 5,
    "review_text": "Gran Turismo 7 com os gatilhos adaptáveis é outra experiência.",
    "photos": [],
    "days_ago": 7
  },
  {
    "id": "815dce93-0d14-44e7-ab31-e9a7ea977a84",
    "reviewer_name": "Patrícia Gomes",
    "reviewer_initial": "P",
    "avatar_url": null,
    "rating": 5,
    "review_text": "Atendimento excelente, tiraram todas as minhas dúvidas.",
    "photos": [],
    "days_ago": 8
  },
  {
    "id": "8133a45b-fdd7-4378-aeb2-01f49b87624e",
    "reviewer_name": "Vinícius Araújo",
    "reviewer_initial": "V",
    "avatar_url": null,
    "rating": 5,
    "review_text": "Produto original, verifiquei tudo na entrega. Recomendo!",
    "photos": [],
    "days_ago": 9
  },
  {
    "id": "a3c245ac-33ae-4d78-a54f-8154dd6b1504",
    "reviewer_name": "Beatriz Nascimento",
    "reviewer_initial": "B",
    "avatar_url": null,
    "rating": 5,
    "review_text": "Meus filhos não largam mais. Ótima compra!",
    "photos": [],
    "days_ago": 10
  },
  {
    "id": "af3f5ad9-59d5-4f5a-abdd-4c976d7ee3cc",
    "reviewer_name": "Rodrigo Pereira",
    "reviewer_initial": "R",
    "avatar_url": null,
    "rating": 5,
    "review_text": "Embalagem reforçada, nenhum arranhão.",
    "photos": [],
    "days_ago": 11
  },
  {
    "id": "2cf3cdd8-b30d-495e-8823-bc34d088866d",
    "reviewer_name": "Gabriela Teixeira",
    "reviewer_initial": "G",
    "avatar_url": null,
    "rating": 5,
    "review_text": "Recebi em 4 dias. Muito satisfeita.",
    "photos": [],
    "days_ago": 12
  },
  {
    "id": "abab17a9-bd2d-4843-bc54-8bca0959a9b3",
    "reviewer_name": "Felipe Moreira",
    "reviewer_initial": "F",
    "avatar_url": null,
    "rating": 5,
    "review_text": "Gráficos incríveis, carregamento super rápido.",
    "photos": [],
    "days_ago": 13
  },
  {
    "id": "0a682091-948f-4cd6-81f2-5ee14eab1960",
    "reviewer_name": "Renata Cardoso",
    "reviewer_initial": "R",
    "avatar_url": null,
    "rating": 5,
    "review_text": "Comprei com desconto e chegou tudo certinho.",
    "photos": [],
    "days_ago": 14
  },
  {
    "id": "e8d0d84a-3423-4d50-a90e-21b3b052a362",
    "reviewer_name": "Matheus Correia",
    "reviewer_initial": "M",
    "avatar_url": null,
    "rating": 5,
    "review_text": "Já é a segunda compra que faço aqui. Confiável.",
    "photos": [],
    "days_ago": 15
  },
  {
    "id": "be0d0d29-85ea-49e0-b686-a9e573dbb4c9",
    "reviewer_name": "Vanessa Dias",
    "reviewer_initial": "V",
    "avatar_url": null,
    "rating": 5,
    "review_text": "Produto conforme o anúncio. Amei!",
    "photos": [],
    "days_ago": 16
  },
  {
    "id": "fffba5d1-c004-4be3-ba1e-6e9ad43d017b",
    "reviewer_name": "André Lopes",
    "reviewer_initial": "A",
    "avatar_url": null,
    "rating": 5,
    "review_text": "Chegou lacrado com nota fiscal. Recomendo.",
    "photos": [],
    "days_ago": 18
  },
  {
    "id": "52cd6135-e05c-4ec0-b69b-7e8bb028685d",
    "reviewer_name": "Carolina Freitas",
    "reviewer_initial": "C",
    "avatar_url": null,
    "rating": 5,
    "review_text": "Muito bom, entrega rápida e produto de qualidade.",
    "photos": [],
    "days_ago": 20
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

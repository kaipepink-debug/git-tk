/**
 * @file orderBumps.ts
 * @description Catálogo de ofertas adicionais (order bumps) exibidas no carrinho
 * e utilidades para persistir a seleção do cliente entre o carrinho e o checkout.
 */


/** Item de oferta adicional oferecido junto ao produto principal. */
export interface OrderBump {
  /** Identificador estável usado para salvar a seleção */
  id: string;
  /** Nome exibido ao cliente */
  title: string;
  /** Preço promocional cobrado ao adicionar o item */
  price: number;
  /** Preço original, usado para mostrar o desconto */
  oldPrice: number;
  /** URL da imagem (CDN) */
  image: string;
}

/** Lista de ofertas adicionais disponíveis no carrinho. */
export const ORDER_BUMPS: OrderBump[] = [
  {
    id: "bateria-18v",
    title: "Bateria Makita 18V LXT 5.0Ah",
    price: 39.9,
    oldPrice: 289.9,
    image: "/images/order-bumps/bateria-18v.webp",
  },
  {
    id: "carregador-rapido",
    title: "Carregador Rápido Makita DC18RC",
    price: 29.9,
    oldPrice: 199.9,
    image: "/images/order-bumps/carregador.webp",
  },
  {
    id: "cabo-veicular",
    title: "Cabo Veicular 12V/24V para Cooler",
    price: 19.9,
    oldPrice: 89.9,
    image: "/images/order-bumps/cabo-veicular.webp",
  },
];

const readyBumpImages = new Set<string>();
let bumpImagesRequested = false;

/** Prepara as três fotos apenas depois da imagem principal e durante uma pausa do navegador. */
export const prefetchBumpImages = () => {
  if (bumpImagesRequested) return;
  bumpImagesRequested = true;
  ORDER_BUMPS.forEach(({ image }) => {
    const img = new Image();
    img.decoding = "async";
    img.src = image;
    if (img.decode) void img.decode().then(() => readyBumpImages.add(image)).catch(() => {});
    else img.onload = () => { readyBumpImages.add(image); };
  });
};

export const isBumpImageReady = (image: string) => readyBumpImages.has(image);

const STORAGE_KEY = "order_bumps_selected";

/**
 * Salva na sessão os IDs das ofertas adicionais escolhidas pelo cliente.
 * @param ids Lista de identificadores selecionados.
 */
export const saveSelectedBumps = (ids: string[]) => {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    /* sessionStorage indisponível — a seleção apenas não persiste */
  }
};

/**
 * Recupera as ofertas adicionais escolhidas anteriormente.
 * @returns Lista de itens válidos presentes no catálogo atual.
 */
export const getSelectedBumps = (): OrderBump[] => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const ids = JSON.parse(raw);
    if (!Array.isArray(ids)) return [];
    return ORDER_BUMPS.filter((b) => ids.includes(b.id));
  } catch {
    return [];
  }
};

/** Formata um valor numérico no padrão brasileiro (ex.: "89,90"). */
export const formatBRL = (value: number) =>
  value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

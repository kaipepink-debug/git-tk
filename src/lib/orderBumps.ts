/**
 * @file orderBumps.ts
 * @description Catálogo de ofertas adicionais (order bumps) exibidas no carrinho
 * e utilidades para persistir a seleção do cliente entre o carrinho e o checkout.
 */

import bombaAr from "@/assets/bumps/bomba-ar.png.asset.json";
import cadeado from "@/assets/bumps/cadeado.png.asset.json";
import capacete from "@/assets/bumps/capacete.png.asset.json";

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
    id: "bomba-ar",
    title: "Mini Bomba de Ar Portátil",
    price: 19.9,
    oldPrice: 109.9,
    image: bombaAr.url,
  },
  {
    id: "cadeado-antifurto",
    title: "Cadeado Antifurto com Alarme",
    price: 12.9,
    oldPrice: 59.9,
    image: cadeado.url,
  },
  {
    id: "capacete-coquinho",
    title: "Capacete Coquinho Viseira Cristal",
    price: 29.9,
    oldPrice: 159.9,
    image: capacete.url,
  },
];

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
export const formatBRL = (value: number) => value.toFixed(2).replace(".", ",");

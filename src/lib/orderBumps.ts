/**
 * @file orderBumps.ts
 * @description Catálogo de ofertas adicionais (order bumps) exibidas no carrinho
 * e utilidades para persistir a seleção do cliente entre o carrinho e o checkout.
 */

import gta6 from "@/assets/bumps/gta6.webp.asset.json";
import dualsenseBlack from "@/assets/bumps/dualsense-black.webp.asset.json";
import dualsenseRed from "@/assets/bumps/dualsense-red.webp.asset.json";
import dualsenseCamo from "@/assets/bumps/dualsense-camo.webp.asset.json";
import dualsenseWhite from "@/assets/bumps/dualsense-white.webp.asset.json";
import baseCarregador from "@/assets/bumps/base-carregador.webp.asset.json";

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
    id: "gta6",
    title: "Jogo Grand Theft Auto VI (GTA 6) - Mídia Física",
    price: 79.9,
    oldPrice: 349.9,
    image: gta6.url,
  },
  {
    id: "dualsense-black",
    title: "Controle Sem Fio Sony PlayStation 5 DualSense Midnight Black",
    price: 88.9,
    oldPrice: 419.9,
    image: dualsenseBlack.url,
  },
  {
    id: "dualsense-red",
    title: "Controle Sony DualSense Sem Fio PS5 Cosmic Red",
    price: 88.9,
    oldPrice: 419.9,
    image: dualsenseRed.url,
  },
  {
    id: "dualsense-camo",
    title: "Controle Sem Fio DualSense PlayStation 5 Gray Camuflado",
    price: 89.9,
    oldPrice: 429.9,
    image: dualsenseCamo.url,
  },
  {
    id: "dualsense-white",
    title: "Controle Sony DualSense Sem Fio White PS5",
    price: 89.9,
    oldPrice: 409.9,
    image: dualsenseWhite.url,
  },
  {
    id: "base-carregador",
    title: "Suporte Base Carregador para 2 Controles PS5",
    price: 39.9,
    oldPrice: 189.9,
    image: baseCarregador.url,
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

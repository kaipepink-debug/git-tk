/**
 * @file catalogo.ts
 * @description Os produtos e as configurações que o painel /admin edita, lidos
 * da Supabase. O conteúdo de storeContent.ts continua valendo como RESERVA: se o
 * banco não responder, a vitrine abre com o que estava no código em vez de abrir
 * vazia — e o servidor, que cobra pelo banco, recusa o pedido se o preço não bater.
 */

import { PRODUCTS, type StoreProduct } from "@/data/storeContent";

/** Uma versão como o banco guarda: preço em centavos. */
export interface VersaoBanco {
  label: string;
  price_cents: number;
  delivery?: string;
  stock?: number;
}

/** Uma linha da tabela `products`. */
export interface ProdutoBanco {
  slug: string;
  title: string;
  description: string;
  images: string[];
  variant_label: string;
  variants: VersaoBanco[];
  delivery_text: string;
  protection: string[];
  active: boolean;
  position: number;
}

/** O endereço que o painel aceita (o banco confere a mesma regra). */
export const SLUG_VALIDO = /^[a-z0-9][a-z0-9-]{1,59}$/;

/** Endereço público da página de um produto. */
export const enderecoDoProduto = (slug: string) =>
  slug === "produto" ? "/produto" : slug === "buggy" ? "/buggy" : `/p/${slug}`;

/**
 * Converte a linha do banco no formato que a vitrine usa.
 *
 * O que o painel não edita vem do produto no código, quando ele existe (o
 * cooler mantém avaliações, adicionais e oferta de saída). Produto criado pelo
 * painel nasce sem nada disso: sem nota, sem "vendidos" e sem preço riscado.
 */
export function daLinha(linha: ProdutoBanco): StoreProduct {
  const base = PRODUCTS[linha.slug];
  const variants = linha.variants.map((v, i) => ({
    label: v.label,
    price: v.price_cents / 100,
    oldPrice: base?.variants[i]?.oldPrice ?? 0,
    stock: v.stock ?? 99,
    ...(v.delivery ? { delivery: v.delivery } : {}),
  }));
  const comum = {
    slug: linha.slug,
    title: linha.title,
    description: linha.description,
    images: linha.images,
    cart_image: linha.images[0] ?? "",
    variant_label: linha.variant_label,
    variants,
    delivery_text: linha.delivery_text,
    protection: linha.protection,
  };
  if (base) return { ...base, ...comum, default_variant: Math.min(base.default_variant, variants.length - 1) };
  return {
    ...comum,
    id: linha.slug,
    social_proof: false,
    bumps: false,
    exit_offer: false,
    rating: 0,
    rating_count: 0,
    sold_count: 0,
    default_variant: 0,
    badges: [],
  } as unknown as StoreProduct;
}

/** Lê os produtos ativos e as configurações. Nunca lança: devolve null quando falha. */
export async function carregaCatalogo(): Promise<{ produtos: Record<string, StoreProduct>; pixel: string | null } | null> {
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    // `products` e `settings` ainda não estão nos tipos gerados; a consulta é tipada aqui.
    const sb = supabase as unknown as {
      from: (t: string) => {
        select: (c: string) => {
          order: (c: string) => Promise<{ data: ProdutoBanco[] | null; error: unknown }>;
          eq: (c: string, v: string) => Promise<{ data: { key: string; value: string }[] | null; error: unknown }>;
        };
      };
    };
    const [prod, conf] = await Promise.all([
      sb.from("products").select("*").order("position"),
      sb.from("settings").select("key, value").eq("key", "tiktok_pixel_id"),
    ]);
    if (prod.error || !prod.data) return null;
    const produtos: Record<string, StoreProduct> = {};
    for (const linha of prod.data) if (linha.active) produtos[linha.slug] = daLinha(linha);
    const pixel = conf.data?.[0]?.value ?? null;
    return { produtos, pixel };
  } catch {
    return null;
  }
}

/**
 * Tabela oficial de preços (em centavos). O servidor NUNCA confia no valor do navegador:
 * o total do PIX é sempre recalculado aqui a partir dos itens selecionados.
 * Manter igual a src/data/storeContent.ts e src/lib/orderBumps.ts.
 */
export const PRODUCT = {
  id: '7c4b1f3a-9d28-4e61-a0f5-3b8e2c6d9147',
  name: 'Cooler Térmica Makita DCW180Z 20L',
  price: 8975, // R$ 89,75
  exitOfferPrice: 5284, // R$ 52,84 (oferta de saída exibida no site)
};

/** Segundo produto (/buggy). Sem oferta de saída, sem adicionais e só frete incluso. */
export const BUGGY = {
  id: 'b7e2d4a1-5c3f-4e8a-9b61-2f0d8c4a7e15',
  name: 'Buggy Elétrico Off-Road',
  /** Preço por versão, na mesma ordem de `variants` em storeContent.ts. */
  variants: [
    { label: '2000W · 50 km/h', price: 2499000 },          // R$ 24.990,00
    { label: '2500W · 60 km/h', price: 2799000 },          // R$ 27.990,00
    { label: '2000W fio chato · 80 km/h', price: 2999000 }, // R$ 29.990,00
  ],
};

export const SHIPPING: Record<string, number> = {
  gratis: 0,
  expresso: 980, // R$ 9,80
};

export const BUMPS: Record<string, { name: string; price: number }> = {
  'bateria-18v':      { name: 'Bateria Makita 18V LXT 5.0Ah',       price: 3990 },
  'carregador-rapido':{ name: 'Carregador Rápido Makita DC18RC',    price: 2990 },
  'cabo-veicular':    { name: 'Cabo Veicular 12V/24V para Cooler',  price: 1990 },
};

export const MAX_QTY = 10;

export interface PricedOrder {
  total: number; // centavos
  qty: number;
  items: {
    product: { id: string; name: string; qty: number; unit_price: number; exit_offer: boolean };
    shipping: { type: string; price: number };
    bumps: { id: string; name: string; price: number }[];
  };
}

/** Recalcula o pedido. Retorna erro quando algum item é desconhecido/inválido. */
export function priceOrder(raw: any): { ok: true; order: PricedOrder } | { ok: false; error: string } {
  const qty = Number(raw?.qty);
  if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) return { ok: false, error: 'Quantidade inválida' };
  const frete = String(raw?.frete ?? '');
  if (!(frete in SHIPPING)) return { ok: false, error: 'Frete inválido' };
  const isBuggy = raw?.product === 'buggy';
  if (isBuggy && frete !== 'gratis') return { ok: false, error: 'Frete inválido' };
  const ids: unknown = isBuggy ? [] : raw?.bumps ?? [];
  if (!Array.isArray(ids) || ids.length > Object.keys(BUMPS).length) return { ok: false, error: 'Itens inválidos' };
  const unique = [...new Set(ids.map(String))];
  const bumps = [];
  for (const id of unique) {
    const b = BUMPS[id];
    if (!b) return { ok: false, error: 'Item adicional inválido' };
    bumps.push({ id, name: b.name, price: b.price });
  }
  const exitOffer = !isBuggy && raw?.exit_offer === true;
  const versao = isBuggy ? BUGGY.variants[Number(raw?.variant ?? 0)] : null;
  if (isBuggy && !versao) return { ok: false, error: 'Versão inválida' };
  const item = isBuggy ? { id: BUGGY.id, name: `${BUGGY.name} — ${versao!.label}` } : PRODUCT;
  const unit = isBuggy ? versao!.price : exitOffer ? PRODUCT.exitOfferPrice : PRODUCT.price;
  const total = unit * qty + SHIPPING[frete] + bumps.reduce((s, b) => s + b.price, 0);
  return {
    ok: true,
    order: {
      total,
      qty,
      items: {
        product: { id: item.id, name: item.name, qty, unit_price: unit, exit_offer: exitOffer },
        shipping: { type: frete, price: SHIPPING[frete] },
        bumps,
      },
    },
  };
}

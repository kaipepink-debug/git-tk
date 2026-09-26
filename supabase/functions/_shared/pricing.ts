/**
 * Tabela oficial de preços (em centavos). O servidor NUNCA confia no valor do navegador:
 * o total do PIX é sempre recalculado aqui a partir dos itens selecionados.
 * Manter igual a src/data/storeContent.ts e src/lib/orderBumps.ts.
 */
export const PRODUCT = {
  id: '35d010e2-4b26-4b96-a718-1ac8859f1329',
  name: 'Bicicleta Bike Eletrica V9 Max 1000w 48km',
  price: 1000, // R$ 10,00 (teste)
  exitOfferPrice: 5284, // R$ 52,84 (oferta de saída exibida no site)
};

export const SHIPPING: Record<string, number> = {
  gratis: 0,
  expresso: 980, // R$ 9,80
};

export const BUMPS: Record<string, { name: string; price: number }> = {
  'bomba-ar': { name: 'Mini Bomba de Ar Portátil', price: 1990 },
  'cadeado-antifurto': { name: 'Cadeado Antifurto com Alarme', price: 1290 },
  'capacete-coquinho': { name: 'Capacete Coquinho Viseira Cristal', price: 2990 },
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
  const ids: unknown = raw?.bumps ?? [];
  if (!Array.isArray(ids) || ids.length > Object.keys(BUMPS).length) return { ok: false, error: 'Itens inválidos' };
  const unique = [...new Set(ids.map(String))];
  const bumps = [];
  for (const id of unique) {
    const b = BUMPS[id];
    if (!b) return { ok: false, error: 'Item adicional inválido' };
    bumps.push({ id, name: b.name, price: b.price });
  }
  const exitOffer = raw?.exit_offer === true;
  const unit = exitOffer ? PRODUCT.exitOfferPrice : PRODUCT.price;
  const total = unit * qty + SHIPPING[frete] + bumps.reduce((s, b) => s + b.price, 0);
  return {
    ok: true,
    order: {
      total,
      qty,
      items: {
        product: { id: PRODUCT.id, name: PRODUCT.name, qty, unit_price: unit, exit_offer: exitOffer },
        shipping: { type: frete, price: SHIPPING[frete] },
        bumps,
      },
    },
  };
}

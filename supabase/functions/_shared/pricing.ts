/**
 * Regras de cobrança (em centavos). O servidor NUNCA confia no valor do navegador:
 * o total do PIX é sempre recalculado aqui. O preço de cada produto vem da tabela
 * `products` (editada pelo painel /admin); o que fica no código é o que o painel
 * não edita — frete, adicionais do cooler e a oferta de saída.
 */
export const PRODUCT = {
  id: '7c4b1f3a-9d28-4e61-a0f5-3b8e2c6d9147',
  name: 'Cooler Térmica Makita DCW180Z 20L',
  price: 8975, // R$ 89,75
  exitOfferPrice: 5284, // R$ 52,84 (oferta de saída exibida no site)
};

/** Buggy: só o id, para o content_id do pixel continuar o mesmo. O preço mora no banco. */
export const BUGGY = {
  id: 'b7e2d4a1-5c3f-4e8a-9b61-2f0d8c4a7e15',
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

/** Linha da tabela `products` — o que o painel edita e o que vale na cobrança. */
export interface CatalogRow {
  slug: string;
  title: string;
  variants: { label: string; price_cents: number }[];
}

/** O cooler é o produto da casa: só ele tem frete expresso, adicionais e oferta de saída. */
const PRODUTO_PRINCIPAL = 'produto';

/** content_id dos produtos que já existiam antes do painel (mantém o histórico do pixel). */
const IDS_ANTIGOS: Record<string, string> = { produto: PRODUCT.id, buggy: BUGGY.id };

/**
 * Recalcula o pedido. Retorna erro quando algum item é desconhecido/inválido.
 *
 * O PREÇO VEM DO BANCO (`catalogo`, lido pela Edge Function na tabela
 * `products`), que é o mesmo lugar onde o painel grava e de onde a vitrine lê.
 * Por isso trocar o preço no painel muda a vitrine e o Pix juntos — e o
 * checkout recusa ("o valor mudou") se alguém estiver com a página aberta no
 * preço antigo, em vez de cobrar um valor diferente do que viu.
 *
 * Sem linha no banco, só o produto principal tem preço de reserva no código.
 */
export function priceOrder(raw: any, catalogo?: CatalogRow | null): { ok: true; order: PricedOrder } | { ok: false; error: string } {
  const qty = Number(raw?.qty);
  if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) return { ok: false, error: 'Quantidade inválida' };
  const frete = String(raw?.frete ?? '');
  if (!(frete in SHIPPING)) return { ok: false, error: 'Frete inválido' };

  const slug = typeof raw?.product === 'string' && raw.product ? raw.product : PRODUTO_PRINCIPAL;
  const principal = slug === PRODUTO_PRINCIPAL;
  if (catalogo && catalogo.slug !== slug) return { ok: false, error: 'Produto inválido' };
  if (!catalogo && !principal) return { ok: false, error: 'Produto indisponível' };
  if (!principal && frete !== 'gratis') return { ok: false, error: 'Frete inválido' };

  const ids: unknown = principal ? raw?.bumps ?? [] : [];
  if (!Array.isArray(ids) || ids.length > Object.keys(BUMPS).length) return { ok: false, error: 'Itens inválidos' };
  const unique = [...new Set(ids.map(String))];
  const bumps = [];
  for (const id of unique) {
    const b = BUMPS[id];
    if (!b) return { ok: false, error: 'Item adicional inválido' };
    bumps.push({ id, name: b.name, price: b.price });
  }

  const exitOffer = principal && raw?.exit_offer === true;
  const versoes = catalogo?.variants ?? [{ label: '', price_cents: PRODUCT.price }];
  const indice = Number(raw?.variant ?? 0);
  const versao = Number.isInteger(indice) ? versoes[indice] : undefined;
  if (!versao || !Number.isInteger(versao.price_cents) || versao.price_cents <= 0) {
    return { ok: false, error: 'Versão inválida' };
  }

  const nomeBase = catalogo?.title ?? PRODUCT.name;
  const nome = versoes.length > 1 ? `${nomeBase} — ${versao.label}` : nomeBase;
  const unit = exitOffer ? PRODUCT.exitOfferPrice : versao.price_cents;
  const total = unit * qty + SHIPPING[frete] + bumps.reduce((s, b) => s + b.price, 0);
  return {
    ok: true,
    order: {
      total,
      qty,
      items: {
        product: { id: IDS_ANTIGOS[slug] ?? slug, name: nome.slice(0, 200), qty, unit_price: unit, exit_offer: exitOffer },
        shipping: { type: frete, price: SHIPPING[frete] },
        bumps,
      },
    },
  };
}

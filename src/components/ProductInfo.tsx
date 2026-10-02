import { Star, Truck, Check } from "lucide-react";
import { useProduct } from "@/contexts/ProductContext";
import { useMemo } from "react";

/**
 * Componente para seleção de variantes/tamanhos do produto.
 * Exibe botões com status de estoque (esgotado, poucas unidades).
 */
const SizeSelector = () => {
  const { sizes, selectedSize, setSelectedSize, product } = useProduct();
  return (
    <div className="space-y-2">
      <div className="flex gap-2 flex-wrap">
        {sizes.map((s, i) => {
          const outOfStock = s.stock === 0;
          return (
            <button
              key={s.label}
              onClick={() => !outOfStock && setSelectedSize(i)}
              disabled={outOfStock}
              className="relative flex flex-col items-center justify-center rounded-lg border px-3 py-2 text-sm transition-all"
              style={{
                borderColor: outOfStock ? "#d1d5db" : selectedSize === i ? "#FF2B56" : "#e0e0e0",
                color: outOfStock ? "#9ca3af" : selectedSize === i ? "#FF2B56" : undefined,
                background: outOfStock ? "#f3f4f6" : selectedSize === i ? "rgba(255,43,86,0.04)" : "transparent",
                minWidth: 72,
                opacity: outOfStock ? 0.7 : 1,
                cursor: outOfStock ? "not-allowed" : "pointer",
              }}
            >
              {outOfStock ? (
                <span className="absolute -top-2 -right-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none" style={{ background: "#6b7280", color: "#fff" }}>
                  Esgotado
                </span>
              ) : s.stock <= 6 ? (
                <span className="absolute -top-2 -right-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none" style={{ background: "#FF2B56", color: "#fff" }}>
                  {s.stock}
                </span>
              ) : null}
              <span className={`font-semibold ${outOfStock ? "line-through" : ""}`}>{s.label === "825 GB" ? "Preto" : s.label}</span>
            </button>
          );
        })}
      </div>
      {/* Indicador de urgência de estoque baixo */}
      {sizes[selectedSize]?.stock > 0 && sizes[selectedSize].stock <= 20 && (
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "#FF2B56" }} />
            <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: "#FF2B56" }} />
          </span>
          <span className="text-xs font-medium" style={{ color: "#FF2B56" }}>
            Restam apenas {sizes[selectedSize].stock} unidades no estoque
          </span>
        </div>
      )}
    </div>
  );
};

/**
 * Componente principal de informações do produto.
 * Exibe título, avaliações, seletor de variantes, frete e proteção ao cliente.
 */
const ProductInfo = () => {
  const { product, discount, sizes, selectedSize } = useProduct();
  const prazo = sizes[selectedSize]?.delivery || product.delivery_text;

  // Constrói a lista de selos (badges): o primeiro é sempre o desconto dinâmico
  // Sem desconto de verdade (oldPrice 0), não há selo de "% OFF".
  const dynamicBadges = [...(discount > 0 ? [`${discount}% OFF`] : []), ...product.badges.filter(b => !/^\d+%\s*OFF$/i.test(b))];
  const temDesconto = discount > 0;

  /** Calcula uma data de entrega aproximada (4 dias à frente) */
  const deliveryDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 4);
    const day = d.getDate();
    const months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
    return `${day} de ${months[d.getMonth()]}`;
  }, []);

  return (
    <div className="bg-background px-4 py-3 space-y-3">
      {/* Badges de destaque (Desconto, etc.) */}
      <div className="flex items-center gap-2 flex-wrap">
        {dynamicBadges.map((badge, i) => (
          <div key={i} className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded`}
            style={{
              background: i === 0 && temDesconto ? "rgba(255,43,86,0.1)" : "rgba(255,152,0,0.1)",
              color: i === 0 && temDesconto ? "#FF2B56" : "#FF9800",
            }}>
            {i === 0 && temDesconto && (
              <svg width="14" height="12" viewBox="0 0 667 534" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M666.666 166.667C640.145 166.667 614.71 177.203 595.956 195.956C577.202 214.71 566.666 240.145 566.666 266.667C566.666 293.189 577.202 318.624 595.956 337.378C614.71 356.131 640.145 366.667 666.666 366.667L666.666 466.667C666.666 484.348 659.642 501.305 647.14 513.808C634.637 526.31 617.681 533.334 600 533.334L466.666 533.334L466.666 470.601C466.666 461.76 463.154 453.281 456.903 447.03C450.652 440.779 442.174 437.267 433.333 437.267C424.492 437.267 416.014 440.779 409.763 447.03C403.512 453.281 400 461.76 400 470.601L400 533.334L66.666 533.334C48.9852 533.334 32.0287 526.31 19.5264 513.808C7.02395 501.305 1.13666e-05 484.348 1.01189e-05 466.667L1.44901e-05 366.666C55.4279 366.576 100.333 321.616 100.333 266.167C100.333 210.718 55.4279 165.758 2.3276e-05 165.668L2.76035e-05 66.667C3.0397e-05 48.9859 7.02397 32.0288 19.5264 19.5264C32.0287 7.02422 48.9852 8.86041e-05 66.666 4.76048e-07L400 1.50465e-05L400 62.7334C400 71.5739 403.512 80.0525 409.763 86.3037C416.014 92.5549 424.492 96.0674 433.333 96.0674C442.174 96.0674 450.652 92.5549 456.903 86.3037C463.154 80.0525 466.666 71.5739 466.666 62.7334L466.666 1.79606e-05L600 2.37888e-05C617.681 0.000113468 634.637 7.02425 647.14 19.5264C659.642 32.0288 666.666 48.9859 666.666 66.667L666.666 166.667ZM466.666 156.867C466.666 148.027 463.154 139.548 456.903 133.297C450.652 127.046 442.174 123.533 433.333 123.533C424.492 123.533 416.014 127.046 409.763 133.297C403.512 139.548 400 148.027 400 156.867L400 219.601C400 228.441 403.512 236.92 409.763 243.171C416.014 249.422 424.493 252.934 433.333 252.934C442.174 252.934 450.652 249.422 456.903 243.171C463.154 236.92 466.666 228.441 466.666 219.601L466.666 156.867ZM466.666 313.733C466.666 304.893 463.154 296.414 456.903 290.163C450.652 283.912 442.174 280.4 433.333 280.4C424.493 280.4 416.014 283.912 409.763 290.163C403.512 296.414 400 304.893 400 313.733L400 376.467C400 385.307 403.512 393.786 409.763 400.037C416.014 406.288 424.492 409.801 433.333 409.801C442.174 409.801 450.652 406.288 456.903 400.037C463.154 393.786 466.666 385.307 466.666 376.467L466.666 313.733Z" fill="#FF2B56" />
              </svg>
            )}
            {badge}
          </div>
        ))}
      </div>

      {/* Título do Produto */}
      <h1 className="text-base font-bold leading-snug text-foreground">
        {product.title}
      </h1>

      {/* Avaliações e Contador de Vendas — só para produto que tem */}
      {product.social_proof && <div className="flex items-center gap-1.5 text-sm">
        <Star className="w-4 h-4 fill-star text-star" />
        <span className="text-foreground font-medium">{product.rating}</span>
        <span className="text-muted-foreground">({product.rating_count})</span>
        <span className="text-muted-foreground mx-1">|</span>
        <span className="text-muted-foreground">+{product.sold_count.toLocaleString("pt-BR")} vendido(s)</span>
      </div>}

      {/* Seletor de Variantes (Ex: Tamanhos, Cores) */}
      <div className="border-t border-border pt-3">
        <span className="text-sm text-muted-foreground mb-2 block">{product.variant_label === "Capacidade" ? "Cor:" : `${product.variant_label}:`}</span>
        <SizeSelector />
      </div>

      {/* Informações de Frete */}
      <div className="flex items-start gap-3 pt-3 border-t border-border">
        <Truck className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
        <div>
          {prazo ? (
            <>
              <span className="text-success text-sm font-semibold">Frete incluso</span>
              <div className="text-xs text-muted-foreground mt-0.5">{prazo}</div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="text-success text-sm font-semibold">Frete grátis</span>
                <span className="text-sm text-foreground">Receba até {deliveryDate}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Taxa de envio: <span className="line-through">R$ 29,00</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Seção de Segurança e Proteção do Cliente */}
      <div className="border-t border-border pt-3">
        <div className="flex items-center gap-2 mb-2.5">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B5A2B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            <path d="M9 12l2 2 4-4"></path>
          </svg>
          <span className="text-sm font-semibold" style={{ color: "#8B5A2B" }}>Proteção do cliente</span>
        </div>
        <div className="grid grid-cols-2 gap-y-2 gap-x-4">
          {product.protection.map((item) => (
            <div key={item} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#8B5A2B" }} />
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductInfo;

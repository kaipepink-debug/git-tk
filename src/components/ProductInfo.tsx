import { Star, Truck, ShieldCheck, Zap, BadgeCheck, Award } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useProduct } from "@/contexts/ProductContext";
import FlashSaleTimer from "./FlashSaleTimer";

/**
 * Componente para seleção de tamanho do produto.
 * Exibe uma grade de botões com status de estoque (esgotado, disponível, selecionado).
 */
const SizeSelector = () => {
  const { sizes, selectedSize, setSelectedSize } = useProduct();
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Tamanho</span>
        <a href="#tabela-tamanhos" className="text-xs text-primary font-medium hover:underline">
          Tabela de tamanhos
        </a>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {sizes.map((s, i) => {
          const outOfStock = s.stock === 0;
          const selected = selectedSize === i;
          return (
            <button
              key={s.label}
              onClick={() => !outOfStock && setSelectedSize(i)}
              disabled={outOfStock}
              className={`relative flex items-center justify-center rounded-xl border-2 py-2.5 text-sm font-semibold transition-all ${
                outOfStock
                  ? "border-border bg-muted text-muted-foreground line-through cursor-not-allowed opacity-60"
                  : selected
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-foreground hover:border-primary/50"
              }`}
            >
              {s.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Componente principal de informações do produto.
 * Exibe badges, título, avaliação, seletor de tamanho, preço, entrega e CTAs de compra.
 */
const ProductInfo = () => {
  const { product, price, priceDisplay, oldPriceDisplay, discount } = useProduct();
  const navigate = useNavigate();

  // Extrai a primeira linha da descrição para usar como subtítulo
  const subtitle = product.description.split("\n").map(l => l.trim()).find(Boolean) || "";

  return (
    <div className="space-y-5">
      {/* Selos de confiança */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
          <BadgeCheck className="w-4 h-4" />
          Loja Verificada
        </div>
        <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
          <Award className="w-4 h-4" />
          Conforto Premium
        </div>
      </div>

      {/* Título e subtítulo */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight text-foreground">
          {product.title}
        </h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>

      {/* Avaliação */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 bg-ink text-ink-foreground rounded-full px-2.5 py-1 text-xs font-bold">
          {product.rating} <Star className="w-3 h-3 fill-ink-foreground" />
        </div>
        <span className="text-sm text-muted-foreground">({product.rating_count} avaliações)</span>
      </div>

      {/* Seletor de tamanho */}
      <div className="border-t border-border pt-4">
        <SizeSelector />
      </div>

      {/* Bloco de preço */}
      <div className="border-t border-border pt-4 space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground line-through">R$ {oldPriceDisplay}</span>
          <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">-{discount}% OFF</span>
        </div>
        <div className="text-4xl font-extrabold text-primary">R$ {priceDisplay}</div>
        <div className="flex items-center gap-1.5 text-sm text-foreground">
          <Zap className="w-4 h-4 text-primary" />
          <span>À vista no PIX</span>
        </div>
        <FlashSaleTimer />
      </div>

      {/* Informações de entrega */}
      <div className="border-t border-border pt-4 space-y-2.5">
        <div className="flex items-center gap-2.5 text-sm text-foreground">
          <Truck className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <span>Frete grátis para todo o Brasil</span>
        </div>
        <div className="flex items-center gap-2.5 text-sm text-primary font-medium">
          <Zap className="w-4 h-4 flex-shrink-0" />
          <span>Envios para Capitais em até 2 dias</span>
        </div>
        <div className="flex items-center gap-2.5 text-sm text-foreground">
          <ShieldCheck className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <span>Garantia de 30 dias</span>
        </div>
      </div>

      {/* CTAs */}
      <div className="flex flex-col gap-3 pt-2">
        <button
          onClick={() => navigate("/finalizar-compra")}
          className="w-full rounded-full bg-primary text-primary-foreground font-bold py-3.5 hover:bg-primary-dark transition-colors"
        >
          Comprar agora
        </button>
        <button
          onClick={() => navigate("/finalizar-compra")}
          className="w-full rounded-full border-2 border-primary text-primary font-bold py-3.5 hover:bg-primary/5 transition-colors"
        >
          Adicionar ao carrinho
        </button>
      </div>
    </div>
  );
};

export default ProductInfo;

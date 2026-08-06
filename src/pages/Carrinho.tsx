/**
 * Rota: /carrinho
 * Propósito: Exibe o produto selecionado, permite ajustar a quantidade,
 * informa sobre frete grátis e proteção ao cliente, além de iniciar o checkout.
 */

import { useNavigate } from "react-router-dom";
import { Minus, Plus, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useSessionTracker } from "@/hooks/useSessionTracker";
import { useProduct } from "@/contexts/ProductContext";
import { useOptimizedImage } from "@/hooks/useOptimizedImage";
import { trackTikTokEvent } from "@/hooks/useTikTokPixel";
import { useEffect } from "react";
import CheckoutHeader from "@/components/CheckoutHeader";
import CheckoutTrustRow from "@/components/CheckoutTrustRow";

/**
 * Componente da página de Carrinho.
 * Gerencia a visualização do produto escolhido e cálculos de total.
 */
const Carrinho = () => {
  // Rastreia a navegação do usuário
  useSessionTracker("/carrinho");
  const navigate = useNavigate();
  
  // Estado local para quantidade de itens
  const [qty, setQty] = useState(1);
  
  // Recupera dados do produto do contexto global
  const { price, oldPrice, discount, priceDisplay, oldPriceDisplay, product } = useProduct();

  // Dispara evento de "AddToCart" no TikTok Pixel ao carregar o carrinho
  useEffect(() => {
    trackTikTokEvent("AddToCart", {
      contents: [{
        content_id: product.id || "product",
        content_type: "product",
        content_name: product.title || "Produto",
        quantity: 1,
        price,
      }],
      currency: "BRL",
      value: price,
    });
  }, [price, product.id, product.title]);


  // Otimização de imagem para o carrinho
  const productImageRaw = product.cart_image || "/images/escada-carrinho.webp";
  const productImage = useOptimizedImage(productImageRaw, 160, 0.6);
  const productName = product.title ? product.title.substring(0, 40) + "..." : "Produto";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <CheckoutHeader onBack={() => navigate(-1)} step="carrinho" />

      <div className="flex-1 w-full max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
          Carrinho (1 item)
        </h1>

        {/* Card do Produto com controles de quantidade */}
        <div className="rounded-2xl bg-card border border-border p-4 sm:p-5 flex items-start gap-4">
          <img
            src={productImage}
            alt={productName}
            className="w-20 h-20 sm:w-24 sm:h-24 object-contain rounded-xl bg-muted flex-shrink-0"
            loading="eager"
            decoding="async"
            width={96}
            height={96}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground leading-snug line-clamp-2">{productName}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-lg font-bold text-primary">R$ {priceDisplay}</span>
              <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                -{discount}%
              </span>
            </div>
            <span className="text-xs text-muted-foreground line-through">R$ {oldPriceDisplay}</span>

            {/* Seletor de quantidade */}
            <div className="flex items-center border border-border rounded-full w-fit mt-3">
              <button onClick={() => setQty(q => Math.max(1, q - 1))} className="p-2">
                <Minus className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
              <span className="w-8 text-center text-sm font-semibold text-foreground">{qty}</span>
              <button onClick={() => setQty(q => q + 1)} className="p-2">
                <Plus className="w-3.5 h-3.5 text-foreground" />
              </button>
            </div>
          </div>
        </div>

        {/* Seção de selos de confiança e proteção do cliente */}
        <div className="rounded-2xl bg-card border border-border p-4 sm:p-5 mt-4">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Proteção do cliente</span>
          </div>
          <div className="grid grid-cols-2 gap-y-2 gap-x-4">
            {["Devolução gratuita", "Reembolso automático por danos", "Pagamento seguro", "Cupom por atraso na coleta"].map((item, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                </div>
                <span className="text-xs text-muted-foreground">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Resumo e CTA */}
        <div className="rounded-2xl bg-card border border-border p-4 sm:p-5 mt-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-muted-foreground">Total (1 item)</span>
            <span className="text-xl font-bold text-foreground">R$ {(price * qty).toFixed(2).replace(".", ",")}</span>
          </div>
          <button
            onClick={() => navigate("/finalizar-compra")}
            className="w-full py-4 rounded-full text-base font-bold bg-ink text-ink-foreground hover:bg-black transition-colors shadow-lg shadow-black/10"
          >
            Finalizar Compra (1)
          </button>
        </div>

        <CheckoutTrustRow />
      </div>
    </div>
  );
};

export default Carrinho;

/**
 * Rota: /carrinho
 * Propósito: Exibe o produto selecionado, permite ajustar a quantidade,
 * informa sobre frete grátis e proteção ao cliente, além de iniciar o checkout.
 */

import { useNavigate } from "react-router-dom";
import { ChevronLeft, Minus, Plus } from "lucide-react";
import { useState } from "react";
import { useSessionTracker } from "@/hooks/useSessionTracker";
import { useProduct } from "@/contexts/ProductContext";
import { useOptimizedImage } from "@/hooks/useOptimizedImage";
import { ORDER_BUMPS, saveSelectedBumps, getSelectedBumps, formatBRL } from "@/lib/orderBumps";

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

  // Ofertas adicionais (order bumps) escolhidas pelo cliente
  const [bumpIds, setBumpIds] = useState<string[]>(() => getSelectedBumps().map((b) => b.id));

  /** Adiciona ou remove uma oferta adicional e persiste a escolha na sessão. */
  const toggleBump = (id: string) => {
    setBumpIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      saveSelectedBumps(next);
      return next;
    });
  };

  // Soma dos itens extras selecionados
  const bumpsTotal = ORDER_BUMPS.filter((b) => bumpIds.includes(b.id)).reduce((s, b) => s + b.price, 0);
  
  // Recupera dados do produto do contexto global
  const { price, oldPrice, discount, priceDisplay, oldPriceDisplay, product } = useProduct();

  // O evento "InitiateCheckout" do TikTok é disparado uma única vez, na tela de
  // finalização da compra (/finalizar-compra), com o valor real do pedido.



  // Otimização de imagem para o carrinho
  const productImageRaw = product.cart_image || "/images/escada-carrinho.webp";
  const productImage = useOptimizedImage(productImageRaw, 160, 0.6);
  const productName = product.title ? product.title.substring(0, 40) + "..." : "Produto";

  return (
    <div className="min-h-screen bg-secondary max-w-lg mx-auto flex flex-col" style={{ fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,sans-serif" }}>
      {/* Header com botão de voltar */}
      <div className="sticky top-0 z-50 bg-background flex items-center px-4 py-3 border-b border-border">
        <button onClick={() => navigate(-1)} className="mr-3">
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="text-base font-semibold text-foreground flex-1 text-center pr-9">Carrinho (1)</h1>
      </div>

      {/* Nome da loja e contagem de itens */}
      <div className="bg-background px-4 py-3 flex items-center gap-2 mt-2">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="10" fill="#FF2B56"/><path d="M6 10.5L9 13.5L14.5 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        <span className="font-semibold text-sm text-foreground">Loja dos Virais (1)</span>
      </div>

      {/* Banner de frete grátis */}
      <div className="bg-[hsl(170,60%,95%)] px-4 py-2 flex items-center gap-2 mx-0">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M1 12L5 5H19L23 12V19C23 19.5 22.5 20 22 20H2C1.5 20 1 19.5 1 19V12Z" stroke="#00BFA5" strokeWidth="1.5"/><path d="M1 12H23" stroke="#00BFA5" strokeWidth="1.5"/><circle cx="7" cy="20" r="2" stroke="#00BFA5" strokeWidth="1.5"/><circle cx="17" cy="20" r="2" stroke="#00BFA5" strokeWidth="1.5"/></svg>
        <span className="text-xs font-medium" style={{ color: "#00BFA5" }}>Você ganhou frete grátis!</span>
      </div>

      {/* Card do Produto com controles de quantidade */}
      <div className="bg-background px-4 py-3 flex items-start gap-3">
        <div className="relative flex-shrink-0">
          <div className="absolute -left-1 -top-1">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="10" fill="#FF2B56"/><path d="M6 10.5L9 13.5L14.5 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <img src={productImage} alt={productName} className="w-20 h-20 object-contain rounded bg-secondary" loading="eager" decoding="async" width={80} height={80} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground leading-tight line-clamp-2">{productName}</p>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-base font-bold" style={{ color: "#FF2B56", fontFamily: "'Segoe UI',Roboto,sans-serif" }}>R$ {priceDisplay}</span>
            {/* Ícone decorativo de cupom/desconto */}
            <svg fill="#FF2B56" width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}><path d="M10,5V7m0,10v2m0-6V11" style={{ fill: "none", stroke: "#FF2B56", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2 }} /><path d="M18,12a3,3,0,0,0,3,3v3a1,1,0,0,1-1,1H4a1,1,0,0,1-1-1V15A3,3,0,0,0,3,9V6A1,1,0,0,1,4,5H20a1,1,0,0,1,1,1V9A3,3,0,0,0,18,12Z" style={{ fill: "none", stroke: "#FF2B56", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2 }} /></svg>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-muted-foreground line-through">R$ {oldPriceDisplay}</span>
            <span className="text-xs font-semibold px-1 rounded" style={{ background: "#FFE8ED", color: "#FF2B56" }}>-{discount}%</span>
          </div>
        </div>
        {/* Seletor de quantidade */}
        <div className="flex items-center border border-border rounded self-center">
          <button onClick={() => setQty(q => Math.max(1, q - 1))} className="p-1.5">
            <Minus className="w-4 h-4 text-muted-foreground" />
          </button>
          <span className="w-8 text-center text-sm text-foreground">{qty}</span>
          <button onClick={() => setQty(q => q + 1)} className="p-1.5">
            <Plus className="w-4 h-4 text-foreground" />
          </button>
        </div>
      </div>

      <div className="h-2 bg-secondary" />

      {/* Seção de selos de confiança e proteção do cliente */}
      <div className="bg-background px-4 py-4">
        <div className="flex items-center gap-2 mb-3">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2L3 7V12C3 17.5 7 22 12 22C17 22 21 17.5 21 12V7L12 2Z" fill="#FF2B56" stroke="#FF2B56" strokeWidth="1.5"/><path d="M8 12L11 15L16 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span className="font-semibold text-sm text-foreground">Proteção do cliente</span>
        </div>
        <div className="grid grid-cols-2 gap-y-2 gap-x-4">
          {["Devolução gratuita", "Reembolso automático por danos", "Pagamento seguro", "Cupom por atraso na coleta"].map((item, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 8L6.5 11.5L13 4.5" stroke="#00BFA5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <span className="text-xs text-muted-foreground">{item}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 bg-secondary" />

      {/* Barra fixa inferior com total e botão de finalização */}
      <div className="sticky bottom-0 bg-background border-t border-border px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-muted-foreground">Total (1 item):</span>
          <span className="text-lg font-bold" style={{ color: "#FF2B56", fontFamily: "'Segoe UI',Roboto,sans-serif" }}>R$ {(price * qty).toFixed(2).replace(".", ",")}</span>
        </div>
        <button
          onClick={() => navigate("/finalizar-compra")}
          className="w-full py-3 rounded-full text-base font-semibold text-background"
          style={{ background: "#FF2B56", border: "none" }}
        >
          Finalizar Compra (1)
        </button>
      </div>
    </div>
  );
};

export default Carrinho;

import { useNavigate } from "react-router-dom";
import { useProduct } from "@/contexts/ProductContext";
import { useState } from "react";
import { MessageCircle, Loader2 } from "lucide-react";
import ProductChat from "./ProductChat";

/**
 * Componente de barra inferior fixa (somente mobile) para compra rápida.
 * Exibe o preço atual, um atalho para o chat de suporte e o botão principal de compra.
 */
const BottomBar = () => {
  const navigate = useNavigate();
  const { priceDisplay } = useProduct();
  const [chatOpen, setChatOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleBuy = () => {
    setLoading(true);
    setTimeout(() => {
      navigate("/finalizar-compra");
    }, 600);
  };

  return (
    <>
      <ProductChat open={chatOpen} onClose={() => setChatOpen(false)} />
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border px-4 py-3 flex items-center gap-3 shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
        {/* Atalho para o chat de suporte */}
        <button
          onClick={() => setChatOpen(true)}
          className="flex-shrink-0 w-11 h-11 rounded-full bg-muted flex items-center justify-center text-foreground"
          aria-label="Abrir chat"
        >
          <MessageCircle className="w-5 h-5" />
        </button>

        {/* Preço atual */}
        <div className="flex flex-col leading-tight">
          <span className="text-[10px] text-muted-foreground">A partir de</span>
          <span className="text-lg font-extrabold text-primary">R$ {priceDisplay}</span>
        </div>

        {/* CTA principal */}
        <button
          onClick={handleBuy}
          disabled={loading}
          className="flex-1 rounded-full bg-primary text-primary-foreground font-bold py-3 flex items-center justify-center disabled:opacity-70"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Comprar agora"}
        </button>
      </div>
    </>
  );
};

export default BottomBar;

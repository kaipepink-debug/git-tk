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
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border px-4 py-3 pb-safe flex items-center gap-4 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
        {/* Atalho para o chat de suporte */}
        <button
          onClick={() => setChatOpen(true)}
          className="flex-shrink-0 w-12 h-12 rounded-full bg-[#25D366]/10 flex items-center justify-center text-[#25D366] transition-transform active:scale-95"
          aria-label="Abrir chat"
        >
          <MessageCircle className="w-6 h-6 fill-current" />
        </button>

        {/* CTA principal robusto */}
        <button
          onClick={handleBuy}
          disabled={loading}
          className="flex-1 h-12 rounded-xl bg-primary text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-70"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <span>Comprar agora</span>
              <span className="text-white/50 font-normal">|</span>
              <span>R$ {priceDisplay}</span>
            </>
          )}
        </button>
      </div>
    </>
  );
};

export default BottomBar;

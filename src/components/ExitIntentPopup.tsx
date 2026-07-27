import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { useProduct } from "@/contexts/ProductContext";

/**
 * Componente que exibe um popup de intenção de saída ou oferta especial.
 * É acionado quando o usuário tenta sair da página, volta no histórico
 * ou quando retorna após gerar um PIX.
 */
const ExitIntentPopup = () => {
  const [show, setShow] = useState(false);
  const navigate = useNavigate();
  const { product } = useProduct();
  const productImage = product.cart_image || (product.images?.[0] as string) || "";

  // Caso 1: Usuário gerou um PIX e voltou para a página do produto
  useEffect(() => {
    const cameFromPix = sessionStorage.getItem("pix_generated") === "true";
    if (cameFromPix) {
      sessionStorage.removeItem("pix_generated");
      setShow(true);
    }
  }, []);

  /**
   * Detecta quando o mouse sai da área superior do navegador (intenção de fechar aba)
   */
  const handleExitIntent = useCallback((e: MouseEvent) => {
    if (e.clientY <= 5 && !sessionStorage.getItem("exit_popup_shown")) {
      sessionStorage.setItem("exit_popup_shown", "true");
      setShow(true);
    }
  }, []);

  /**
   * Detecta quando a visibilidade da aba muda (usuário trocou de aba)
   */
  const handleVisibility = useCallback(() => {
    if (document.visibilityState === "hidden" && !sessionStorage.getItem("exit_popup_shown")) {
      sessionStorage.setItem("exit_popup_shown", "true");
      setShow(true);
    }
  }, []);

  // Interceptação do botão de voltar do navegador
  useEffect(() => {
    const alreadyShown = sessionStorage.getItem("exit_popup_shown") === "true";
    if (alreadyShown) return;

    window.history.pushState({ exitPopup: true }, "");

    const handlePopState = () => {
      if (!sessionStorage.getItem("exit_popup_shown")) {
        sessionStorage.setItem("exit_popup_shown", "true");
        setShow(true);
        // BUGFIX: antes chamávamos pushState novamente aqui, o que prendia o botão
        // "Voltar" do navegador em loop. Deixamos o histórico seguir normalmente.
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Configuração dos listeners de saída após um pequeno atraso
  useEffect(() => {
    const timer = setTimeout(() => {
      document.addEventListener("mouseout", handleExitIntent);
      document.addEventListener("visibilitychange", handleVisibility);
    }, 3000);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mouseout", handleExitIntent);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [handleExitIntent, handleVisibility]);

  /**
   * Aplica o preço promocional de oferta de saída e redireciona para o checkout
   */
  const handleAccept = () => {
    sessionStorage.setItem("exit_offer_price", "48.00");
    setShow(false);
    navigate("/finalizar-compra");
  };

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={() => setShow(false)}
    >
      <div
        className="relative mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setShow(false)}
          className="absolute right-3 top-3 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
        >
          <X size={20} />
        </button>

        <div className="mx-auto mb-3 w-fit rounded-full bg-red-100 px-4 py-1">
          <span className="text-xs font-bold uppercase tracking-wide text-red-600">
            🔥 Oferta exclusiva
          </span>
        </div>

        {productImage && (
          <div className="mx-auto mb-3 flex justify-center">
            <img
              src={productImage}
              alt={product.title || "Produto"}
              className="w-28 h-28 object-contain rounded-xl"
            />
          </div>
        )}

        <h2 className="text-center text-lg font-bold text-gray-900 leading-tight">
          Espera! Essa é sua
          <br />
          <span className="text-red-500">primeira compra?</span>
        </h2>

        <p className="mt-2 text-center text-sm text-gray-500">
          Temos um desconto especial pra você!
        </p>

        <div className="mt-4 flex items-center justify-center gap-3">
          <span className="text-sm text-gray-400 line-through">R$ 68,20</span>
          <span className="text-3xl font-extrabold text-red-500">R$ 48,00</span>
        </div>

        <p className="mt-1 text-center text-xs text-green-600 font-semibold">
          Frete grátis • Oferta de primeira compra
        </p>

        <button
          onClick={handleAccept}
          className="mt-5 w-full rounded-xl py-3.5 text-base font-bold text-white transition-all active:scale-95"
          style={{
            background: "linear-gradient(135deg, #FF2B56 0%, #e91e63 100%)",
            boxShadow: "0 4px 15px rgba(255,43,86,0.4)",
          }}
        >
          QUERO ESSA OFERTA! 🎉
        </button>

        <button
          onClick={() => setShow(false)}
          className="mt-2 w-full py-2 text-xs text-gray-400 hover:text-gray-500 transition"
        >
          Não, obrigado
        </button>
      </div>
    </div>
  );
};

export default ExitIntentPopup;

import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/**
 * Componente utilitário que reseta a posição do scroll para o topo ao navegar.
 * É acionado sempre que a rota muda, exceto em navegações do tipo "POP" (botão voltar).
 */
export const ScrollToTop = () => {
  const { pathname } = useLocation();
  const navType = useNavigationType();

  useEffect(() => {
    // Só reseta o scroll se não for uma navegação de histórico (back/forward)
    if (navType !== "POP") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, [pathname, navType]);

  return null;
};

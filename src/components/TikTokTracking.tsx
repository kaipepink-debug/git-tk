/**
 * @file TikTokTracking.tsx
 * @description Componente sem interface responsável por:
 * 1. Capturar e preservar os identificadores de atribuição (ttclid, _ttp, UTMs)
 *    na primeira visita e em cada mudança de rota.
 * 2. Disparar o Pageview do TikTok uma única vez por rota — só nas telas do
 *    checkout. O pixel não carrega na vitrine (home, produto, carrinho).
 *
 * Nenhum token da Events API trafega aqui — o envio pelo servidor usa secrets.
 */

import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { captureAttribution } from "@/lib/tracking/attribution";
import { trackPageView } from "@/lib/tracking/tiktok";

/** Telas do checkout: as únicas onde o pixel do TikTok é carregado. */
const CHECKOUT_PATHS = ["/finalizar-compra", "/adicionar-endereco", "/pagamento-pix", "/obrigado"];

/**
 * Componente de rastreamento global.
 *
 * @returns {null} Nada é renderizado.
 */
const TikTokTracking = () => {
  const location = useLocation();


  useEffect(() => {
    // Captura imediata: garante que o ttclid não seja perdido em redirects.
    captureAttribution();
    // Captura acima vale para todas as telas (o ttclid chega pela página do anúncio);
    // o pixel em si só entra no checkout.
    if (CHECKOUT_PATHS.includes(location.pathname)) void trackPageView(location.pathname);
  }, [location.pathname, location.search]);

  return null;
};

export default TikTokTracking;

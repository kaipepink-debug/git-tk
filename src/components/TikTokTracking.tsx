/**
 * @file TikTokTracking.tsx
 * @description Componente sem interface responsável por:
 * 1. Capturar e preservar os identificadores de atribuição (ttclid, _ttp, UTMs)
 *    na primeira visita e em cada mudança de rota.
 * 2. Disparar o Pageview do TikTok uma única vez por rota (evita duplicidade em
 *    re-renderizações do React e em navegação SPA).
 *
 * Nenhum token da Events API trafega aqui — o envio pelo servidor usa secrets.
 */

import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { captureAttribution } from "@/lib/tracking/attribution";
import { trackPageView } from "@/lib/tracking/tiktok";
import { initUtmifyPixel } from "@/lib/tracking/utmify";

/**
 * Componente de rastreamento global.
 *
 * @returns {null} Nada é renderizado.
 */
const TikTokTracking = () => {
  const location = useLocation();

  // Pixel da Utmify: carregado uma única vez, respeitando o consentimento.
  useEffect(() => initUtmifyPixel(), []);

  useEffect(() => {
    // Captura imediata: garante que o ttclid não seja perdido em redirects.
    captureAttribution();
    // Pageview: protegido contra duplicidade por rota/sessão.
    void trackPageView(location.pathname);
  }, [location.pathname, location.search]);

  return null;
};

export default TikTokTracking;

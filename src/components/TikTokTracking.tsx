/**
 * @file TikTokTracking.tsx
 * @description Instala o Pixel do TikTok em todo o site e registra a visualização
 * de página em cada mudança de rota (aplicação de página única).
 */

import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useTikTokPixel, trackTikTokPageView } from "@/hooks/useTikTokPixel";
import { captureTikTokClickId } from "@/lib/tiktokClickId";

/**
 * Componente sem interface: apenas ativa o rastreamento.
 *
 * @returns {null} Nada é renderizado.
 */
const TikTokTracking = () => {
  const { ready } = useTikTokPixel();
  const location = useLocation();
  const firstPath = useRef<string | null>(null);

  useEffect(() => {
    if (!ready) return;

    // O carregamento do pixel já dispara a primeira visualização de página.
    if (firstPath.current === null) {
      firstPath.current = location.pathname;
      return;
    }
    if (firstPath.current === location.pathname) return;

    firstPath.current = location.pathname;
    trackTikTokPageView();
  }, [ready, location.pathname]);

  return null;
};

export default TikTokTracking;

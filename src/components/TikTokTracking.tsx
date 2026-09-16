/**
 * @file TikTokTracking.tsx
 * @description O script do Pixel do TikTok foi REMOVIDO do site. Este componente
 * apenas preserva o identificador de clique do anúncio (ttclid) presente na URL,
 * usado para atribuir a venda no envio de conversão feito pelo servidor.
 */

import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { captureTikTokClickId } from "@/lib/tiktokClickId";

/**
 * Componente sem interface: nenhum script de terceiros é carregado.
 *
 * @returns {null} Nada é renderizado.
 */
const TikTokTracking = () => {
  const location = useLocation();

  // Mantém o identificador de clique guardado durante todo o funil.
  useEffect(() => {
    captureTikTokClickId();
  }, [location.pathname, location.search]);

  return null;
};

export default TikTokTracking;

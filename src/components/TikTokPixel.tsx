/**
 * @file TikTokPixel.tsx
 * @description Componente global que carrega o Pixel do TikTok e dispara o evento
 * de PageView a cada troca de rota (necessário em SPAs como React Router).
 */

import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useTikTokPixel, trackTikTokPageView } from "@/hooks/useTikTokPixel";

/**
 * @component TikTokPixel
 * @description Deve ser renderizado uma única vez dentro do BrowserRouter.
 */
const TikTokPixel = () => {
  useTikTokPixel();
  const location = useLocation();
  /** Evita PageView duplicado no primeiro render (o script já dispara ttq.page()) */
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    trackTikTokPageView();
  }, [location.pathname]);

  return null;
};

export default TikTokPixel;

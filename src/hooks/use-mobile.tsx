/**
 * @file use-mobile.tsx
 * @description Hook utilitário para detecção de dispositivos móveis baseado em largura de tela.
 */

import * as React from "react";

/** Largura em pixels que define o limite para dispositivos móveis */
const MOBILE_BREAKPOINT = 768;

/**
 * @hook useIsMobile
 * @description Monitora a largura da janela e retorna verdadeiro se o dispositivo for considerado móvel.
 * @returns {boolean} True se a largura da tela for menor que o breakpoint móvel.
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    // Define a query de mídia para monitorar o breakpoint
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    
    /** Atualiza o estado quando o tamanho da janela muda */
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    
    mql.addEventListener("change", onChange);
    
    // Define o valor inicial
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    
    // Limpeza do listener ao desmontar
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}

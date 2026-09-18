/**
 * @file useSessionTracker.ts
 * @description Mantido por compatibilidade com as páginas do funil. Não faz mais
 * chamadas de rede: apenas informa ao rastreador global (SessionTracker) qual
 * rótulo de página deve ser reportado enquanto a página estiver montada.
 *
 * O envio de heartbeats e a detecção de saída ficam centralizados em
 * src/components/SessionTracker.tsx, garantindo uma única fonte de verdade.
 */

import { useEffect } from "react";
import { setPageOverride } from "@/lib/sessionPage";

/**
 * @hook useSessionTracker
 * @param {string} page Rótulo da página exibido no LiveView do painel.
 */
export function useSessionTracker(page: string) {
  useEffect(() => {
    setPageOverride(page);
    return () => setPageOverride(null);
  }, [page]);
}

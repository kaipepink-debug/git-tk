/**
 * @file useSessionTracker.ts
 * @description Hook para rastreamento de tempo de permanência na página. Envia sinais de
 * "pulso" (heartbeat) regulares e detecta quando o usuário sai da página.
 */

import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

/** Chave usada para persistir o ID da sessão no sessionStorage */
const SESSION_KEY = "tracker_session_id";

/**
 * @function getSessionId
 * @description Recupera o ID de sessão atual do armazenamento ou gera um novo UUID.
 * @returns {string} O ID da sessão.
 */
function getSessionId() {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

/**
 * @hook useSessionTracker
 * @description Monitora a sessão do usuário, enviando pings periódicos para indicar atividade.
 * @param {string} page Nome da página que o usuário está visualizando.
 */
export function useSessionTracker(page: string) {
  /** Referência para o intervalo de heartbeat */
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    const sessionId = getSessionId();
    const userAgent = navigator.userAgent;

    /** Envia sinal de atividade para o backend */
    const track = () => {
      supabase.functions.invoke("track-session", {
        body: { session_id: sessionId, page, user_agent: userAgent, action: "heartbeat" },
      });
    };

    // Rastro inicial
    track();
    // Inicia intervalo de atualização a cada 15 segundos
    intervalRef.current = setInterval(track, 15000);

    /** Lida com o fechamento da aba/navegador */
    const handleUnload = () => {
      // Usa sendBeacon para garantir o envio mesmo que a página esteja fechando
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-session`;
      navigator.sendBeacon(
        url,
        JSON.stringify({ session_id: sessionId, action: "leave" })
      );
    };

    window.addEventListener("beforeunload", handleUnload);

    return () => {
      clearInterval(intervalRef.current);
      window.removeEventListener("beforeunload", handleUnload);
      
      // Tenta registrar a saída ao desmontar o componente via hook padrão
      supabase.functions.invoke("track-session", {
        body: { session_id: sessionId, action: "leave" },
      });
    };
  }, [page]);
}

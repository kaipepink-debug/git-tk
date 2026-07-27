/**
 * @file useAnalyticsTracker.ts
 * @description Hook para rastreamento de comportamento do usuário, capturando cliques,
 * rolagem de página e enviando-os periodicamente para o backend.
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
 * @interface AnalyticsEvent
 * @description Estrutura de dados para um evento capturado pelo rastreador.
 */
interface AnalyticsEvent {
  /** ID único da sessão do usuário */
  session_id: string;
  /** Tipo do evento (ex: 'click', 'scroll') */
  event_type: string;
  /** Nome ou URL da página onde ocorreu o evento */
  page: string;
  /** Tag HTML do elemento interagido */
  element_tag?: string;
  /** Texto contido no elemento */
  element_text?: string;
  /** ID do elemento HTML */
  element_id?: string;
  /** Classes CSS do elemento */
  element_class?: string;
  /** Posição X do clique */
  x_position?: number;
  /** Posição Y do clique */
  y_position?: number;
  /** Largura da janela do navegador no momento */
  viewport_width?: number;
  /** Altura da janela do navegador no momento */
  viewport_height?: number;
  /** Profundidade da rolagem em percentual (0-100) */
  scroll_depth?: number;
}

/**
 * @hook useAnalyticsTracker
 * @description Inicializa listeners de clique e rolagem para monitorar o comportamento do usuário.
 * @param {string} page Nome da página que está sendo rastreada.
 */
export function useAnalyticsTracker(page: string) {
  /** Buffer para acumular eventos antes do envio */
  const buffer = useRef<AnalyticsEvent[]>([]);
  /** Rastreia a maior profundidade de rolagem atingida */
  const maxScrollDepth = useRef(0);
  /** Armazena quais marcos de rolagem (25%, 50%, etc) já foram registrados */
  const scrollMilestones = useRef(new Set<number>());
  /** Referência para o timer de envio periódico */
  const flushTimer = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    const sessionId = getSessionId();

    /**
     * Envia os eventos acumulados no buffer para a Edge Function do Supabase.
     */
    const flush = () => {
      if (buffer.current.length === 0) return;
      const events = [...buffer.current];
      buffer.current = [];
      supabase.functions.invoke("track-event", { body: { events } });
    };

    // Tenta enviar os eventos a cada 5 segundos
    flushTimer.current = setInterval(flush, 5000);

    /**
     * Captura interações de clique e identifica elementos relevantes.
     */
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      // Busca o elemento significativo mais próximo (botão, link ou marcado para rastreio)
      const meaningful = target.closest("button, a, [role='button'], input[type='submit'], [data-track]") || target;

      buffer.current.push({
        session_id: sessionId,
        event_type: "click",
        page,
        element_tag: meaningful.tagName,
        element_text: (meaningful.textContent || "").trim().slice(0, 100),
        element_id: meaningful.id || undefined,
        element_class: meaningful.className ? String(meaningful.className).slice(0, 200) : undefined,
        x_position: Math.round(e.pageX),
        y_position: Math.round(e.pageY),
        viewport_width: window.innerWidth,
        viewport_height: window.innerHeight,
      });
    };

    /**
     * Monitora a profundidade da rolagem e registra marcos importantes.
     */
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;

      // Calcula a porcentagem de rolagem
      const depth = Math.min(100, Math.round((scrollTop / docHeight) * 100));
      if (depth > maxScrollDepth.current) {
        maxScrollDepth.current = depth;
      }

      // Marcos de rolagem: 25%, 50%, 75%, 100%
      const milestones = [25, 50, 75, 100];
      for (const m of milestones) {
        if (depth >= m && !scrollMilestones.current.has(m)) {
          scrollMilestones.current.add(m);
          buffer.current.push({
            session_id: sessionId,
            event_type: "scroll",
            page,
            scroll_depth: m,
            viewport_width: window.innerWidth,
            viewport_height: window.innerHeight,
          });
        }
      }
    };

    document.addEventListener("click", handleClick, { capture: true });
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("scroll", handleScroll);
      clearInterval(flushTimer.current);
      flush(); // Envia eventos remanescentes ao desmontar
    };
  }, [page]);
}

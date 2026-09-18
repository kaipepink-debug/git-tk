/**
 * @file SessionTracker.tsx
 * @description Rastreador global de presença em tempo real. Montado uma única vez
 * no App, ele:
 *  - identifica a sessão do visitante (sessionStorage);
 *  - envia um heartbeat imediato a cada entrada/troca de página;
 *  - repete o heartbeat a cada 5 segundos enquanto a aba estiver visível;
 *  - avisa a saída via sendBeacon em pagehide/visibilitychange (funciona no mobile).
 */

import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getPageOverride, subscribePageOverride } from "@/lib/sessionPage";

/** Chave usada para persistir o ID da sessão */
const SESSION_KEY = "tracker_session_id";
/** Intervalo entre heartbeats (ms) */
const HEARTBEAT_MS = 5000;

/** Recupera/gera o ID da sessão do visitante. */
function getSessionId() {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

/** URL pública da função de rastreamento (usada pelo sendBeacon). */
const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-session`;

const SessionTracker = () => {
  const location = useLocation();
  /** Página atual reportada (rota ou rótulo customizado) */
  const pageRef = useRef<string>("/");
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  /** Evita marcar "saída" duas vezes (pagehide + visibilitychange) */
  const leftRef = useRef(false);

  // Mantém a página atual sincronizada com a rota e com o rótulo customizado
  pageRef.current = getPageOverride() || location.pathname;

  useEffect(() => {
    const sessionId = getSessionId();
    const userAgent = navigator.userAgent;

    /** Envia heartbeat com a página atual */
    const beat = () => {
      leftRef.current = false;
      supabase.functions.invoke("track-session", {
        body: {
          session_id: sessionId,
          page: pageRef.current,
          user_agent: userAgent,
          action: "heartbeat",
        },
      });
    };

    /** Marca a saída imediatamente (sem depender do timeout do servidor) */
    const leave = () => {
      if (leftRef.current) return;
      leftRef.current = true;
      try {
        navigator.sendBeacon(
          FN_URL,
          new Blob([JSON.stringify({ session_id: sessionId, action: "leave" })], {
            type: "application/json",
          }),
        );
      } catch {
        /* navegadores sem sendBeacon: o servidor expira a sessão sozinho */
      }
    };

    const startTimer = () => {
      clearInterval(timerRef.current);
      timerRef.current = setInterval(beat, HEARTBEAT_MS);
    };

    /**
     * Aba em segundo plano: continuamos batendo (a página segue aberta). Se o
     * navegador congelar os timers, o servidor expira a sessão em 15s sozinho.
     * Ao voltar a ficar visível, batemos na hora para reaparecer no LiveView.
     */
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        beat();
        startTimer();
      }
    };

    beat();
    startTimer();

    // Heartbeat imediato quando a página muda (rota ou rótulo)
    const unsubscribe = subscribePageOverride(() => beat());

    window.addEventListener("pagehide", leave);
    window.addEventListener("beforeunload", leave);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(timerRef.current);
      unsubscribe();
      window.removeEventListener("pagehide", leave);
      window.removeEventListener("beforeunload", leave);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  // Troca de rota: reporta a nova página na hora
  useEffect(() => {
    const sessionId = getSessionId();
    supabase.functions.invoke("track-session", {
      body: {
        session_id: sessionId,
        page: getPageOverride() || location.pathname,
        user_agent: navigator.userAgent,
        action: "heartbeat",
      },
    });
  }, [location.pathname]);

  return null;
};

export default SessionTracker;

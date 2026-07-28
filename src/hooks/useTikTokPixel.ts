/**
 * @file useTikTokPixel.ts
 * @description Hook e utilitários para integração com o Pixel do TikTok, permitindo
 * rastreio de visualização de página e eventos de conversão do funil de compra.
 */

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * ID padrão do Pixel do TikTok.
 * Usado como fallback caso não exista configuração salva em `site_settings`.
 */
export const DEFAULT_TIKTOK_PIXEL_ID = "D9KA513C77U7C1P7T9NG";

/**
 * @hook useTikTokPixel
 * @description Busca o ID do Pixel do TikTok no banco de dados (com fallback para o ID padrão)
 * e injeta o script oficial de rastreamento no cabeçalho do documento uma única vez.
 * @returns {string | null} O ID do pixel efetivamente carregado.
 */
export function useTikTokPixel() {
  /** Garante que o script seja carregado apenas uma vez */
  const loaded = useRef(false);
  /** Armazena o ID do pixel configurado */
  const [pixelId, setPixelId] = useState<string | null>(DEFAULT_TIKTOK_PIXEL_ID);

  // Busca o ID do pixel nas configurações do site; mantém o padrão em caso de falha
  useEffect(() => {
    const fetchPixelId = async () => {
      try {
        const { data } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", "tiktok_pixel_id")
          .maybeSingle();
        if (data?.value) setPixelId(data.value);
      } catch {
        // Silencioso: mantém o DEFAULT_TIKTOK_PIXEL_ID
      }
    };
    fetchPixelId();
  }, []);

  // Injeta o script do TikTok quando o ID estiver disponível
  useEffect(() => {
    if (loaded.current || !pixelId) return;
    loaded.current = true;

    const script = document.createElement("script");
    script.innerHTML = `
      !function (w, d, t) {
        w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var i=document.createElement("script");i.type="text/javascript",i.async=!0,i.src=r+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(i,a)};
        ttq.load('${pixelId}');
        ttq.page();
      }(window, document, 'ttq');
    `;
    document.head.appendChild(script);
  }, [pixelId]);

  return pixelId;
}

/**
 * @function trackTikTokEvent
 * @description Envia um evento de conversão ou atividade personalizada para o TikTok.
 * @param {string} eventName Nome do evento (ex: 'AddToCart', 'CompletePayment').
 * @param {Record<string, any>} [params] Parâmetros adicionais do evento (preço, moeda, etc).
 */
export function trackTikTokEvent(eventName: string, params?: Record<string, any>) {
  try {
    if (typeof window !== "undefined" && (window as any).ttq) {
      (window as any).ttq.track(eventName, params);
    }
  } catch (err) {
    console.warn("Falha ao enviar evento TikTok:", err);
  }
}

/**
 * @function trackTikTokPageView
 * @description Dispara o evento de visualização de página (SPA navigation).
 */
export function trackTikTokPageView() {
  try {
    if (typeof window !== "undefined" && (window as any).ttq) {
      (window as any).ttq.page();
    }
  } catch (err) {
    console.warn("Falha ao enviar PageView TikTok:", err);
  }
}

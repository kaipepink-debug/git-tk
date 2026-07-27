/**
 * @file useTikTokPixel.ts
 * @description Hook e utilitário para integração com o Pixel do TikTok, permitindo
 * rastreio de visualização de página e conversões personalizadas.
 */

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * @hook useTikTokPixel
 * @description Busca o ID do Pixel do TikTok no banco de dados e injeta o script
 * oficial de rastreamento no cabeçalho do documento.
 */
export function useTikTokPixel() {
  /** Garante que o script seja carregado apenas uma vez */
  const loaded = useRef(false);
  /** Armazena o ID do pixel configurado */
  const [pixelId, setPixelId] = useState<string | null>(null);

  // Busca o ID do pixel nas configurações do site no Supabase
  useEffect(() => {
    const fetchPixelId = async () => {
      // BUGFIX: usar maybeSingle para não lançar erro quando a linha não existe
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "tiktok_pixel_id")
        .maybeSingle();
      if (data?.value) setPixelId(data.value);
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
}

/**
 * @function trackTikTokEvent
 * @description Envia um evento de conversão ou atividade personalizada para o TikTok.
 * @param {string} eventName Nome do evento (ex: 'AddToCart', 'CompletePayment').
 * @param {Record<string, any>} [params] Parâmetros adicionais do evento (preço, moeda, etc).
 */
export function trackTikTokEvent(eventName: string, params?: Record<string, any>) {
  // Verifica se o script do TikTok foi carregado e está disponível no escopo global
  if (typeof window !== "undefined" && (window as any).ttq) {
    (window as any).ttq.track(eventName, params);
  }
}

/**
 * @file useTikTokPixel.ts
 * @description Integração com o Pixel do TikTok: carrega o script oficial (somente
 * quando o rastreamento de publicidade é permitido), registra visualizações de página
 * e dispara os eventos padrão de e-commerce.
 *
 * O ID do pixel vem da tabela `site_settings` (chave `tiktok_pixel_id`), com um
 * valor padrão de segurança para o pixel desta loja.
 */

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isAdsTrackingAllowed, onConsentChange } from "@/lib/consent";

/** ID do pixel usado quando as configurações do site não trouxerem outro valor. */
const DEFAULT_PIXEL_ID = "DAIOGE3C77UC8FLK3JB0";

/** Indica se o script já foi injetado nesta sessão de página. */
let scriptInjected = false;

/** Última decisão de consentimento conhecida (evita enviar eventos sem permissão). */
let trackingAllowed = false;

/**
 * Injeta o script oficial do Pixel do TikTok uma única vez.
 *
 * @param {string} pixelId - ID do pixel (sdkid) a ser carregado.
 */
function injectPixel(pixelId: string) {
  if (scriptInjected || typeof window === "undefined") return;
  scriptInjected = true;

  const script = document.createElement("script");
  script.innerHTML = `
    !function (w, d, t) {
      w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var i=document.createElement("script");i.type="text/javascript",i.async=!0,i.src=r+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(i,a)};
      ttq.load('${pixelId}');
      ttq.page();
    }(window, document, 'ttq');
  `;
  document.head.appendChild(script);
}

/**
 * @hook useTikTokPixel
 * @description Busca o ID do pixel, avalia o consentimento e carrega o script quando
 * permitido. Reavalia automaticamente quando o visitante muda sua escolha de cookies.
 *
 * @returns {{ ready: boolean }} `ready` indica que o pixel está carregado e ativo.
 */
export function useTikTokPixel() {
  const [pixelId, setPixelId] = useState<string>(DEFAULT_PIXEL_ID);
  const [ready, setReady] = useState(false);
  const fetched = useRef(false);

  // Busca o ID configurado no painel (se houver).
  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

    const fetchPixelId = async () => {
      try {
        const { data } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", "tiktok_pixel_id")
          .maybeSingle();
        if (data?.value) setPixelId(data.value);
      } catch (err) {
        console.warn("Não foi possível ler o ID do pixel; usando o padrão.", err);
      }
    };
    fetchPixelId();
  }, []);

  // Carrega o pixel somente com permissão e reage a mudanças de consentimento.
  useEffect(() => {
    let active = true;

    const evaluate = async () => {
      const allowed = await isAdsTrackingAllowed();
      trackingAllowed = allowed;
      if (!active) return;
      if (allowed && pixelId) {
        injectPixel(pixelId);
        setReady(true);
      } else {
        setReady(false);
      }
    };

    evaluate();
    const unsubscribe = onConsentChange(() => evaluate());

    return () => {
      active = false;
      unsubscribe();
    };
  }, [pixelId]);

  return { ready };
}

/**
 * @function logBrowserEvent
 * @description Registra o evento na tabela `tiktok_events` para que o administrador
 * acompanhe no painel quantos eventos o pixel recebeu. Nunca lança erro.
 *
 * @param {string} eventName - Nome do evento enviado ao pixel.
 * @param {Record<string, any>} [params] - Parâmetros do evento (valor, moeda).
 * @param {string} [eventId] - Identificador único, quando houver.
 */
function logBrowserEvent(eventName: string, params?: Record<string, any>, eventId?: string) {
  const value = Number(params?.value);
  supabase
    .from("tiktok_events")
    .insert({
      event_name: eventName,
      event_id: eventId ?? null,
      source: "browser",
      value: Number.isFinite(value) && value > 0 ? value : null,
      currency: typeof params?.currency === "string" ? params.currency : "BRL",
      page: typeof window !== "undefined" ? window.location.pathname : null,
      status: "sent",
    })
    .then(({ error }) => {
      if (error) console.warn("Não foi possível registrar o evento no painel:", error.message);
    });
}

/**
 * @function trackTikTokPageView
 * @description Registra uma visualização de página (usado em navegações internas do site).
 */
export function trackTikTokPageView() {
  if (!trackingAllowed) return;
  const ttq = (window as any)?.ttq;
  if (ttq?.page) {
    ttq.page();
    logBrowserEvent("Pageview");
  }
}

/**
 * @function trackTikTokEvent
 * @description Envia um evento padrão do TikTok (ViewContent, AddToCart, InitiateCheckout,
 * AddPaymentInfo, PlaceAnOrder, CompletePayment, etc.), respeitando o consentimento.
 *
 * @param {string} eventName - Nome do evento padrão do TikTok.
 * @param {Record<string, any>} [params] - Parâmetros do evento (conteúdo, valor, moeda).
 * @param {string} [eventId] - Identificador único do evento, usado para não contar
 * duas vezes o mesmo evento quando ele também é enviado pelo servidor.
 */
export function trackTikTokEvent(
  eventName: string,
  params?: Record<string, any>,
  eventId?: string,
) {
  if (typeof window === "undefined" || !trackingAllowed) return;
  const ttq = (window as any).ttq;
  if (!ttq?.track) return;
  try {
    if (eventId) ttq.track(eventName, params, { event_id: eventId });
    else ttq.track(eventName, params);
    logBrowserEvent(eventName, params, eventId);
  } catch (err) {
    console.warn(`Falha ao enviar evento ${eventName} para o TikTok:`, err);
  }
}

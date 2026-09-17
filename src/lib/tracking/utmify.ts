/**
 * @file utmify.ts
 * @description Carrega o pixel da Utmify (script informado pelo cliente) uma única
 * vez, apenas quando o rastreamento de publicidade é permitido pela região/consentimento.
 *
 * O script original vinha ofuscado em base64; ele apenas define a variável global
 * `tikTokPixelId` e injeta o arquivo `pixel-tiktok.js` da Utmify no <head>.
 * Aqui a mesma ação é feita de forma explícita e auditável.
 */

import { isAdsTrackingAllowed, onConsentChange } from "@/lib/consent";

/** URL oficial do pixel da Utmify. */
const UTMIFY_PIXEL_SRC = "https://cdn.utmify.com.br/scripts/pixel/pixel-tiktok.js";

/** Identificador do pixel na Utmify (valor público, informado pelo cliente). */
const UTMIFY_PIXEL_ID = "6aab2d8db8bb8726a77f52f3";

/** Atributo usado para identificar o script já injetado. */
const SCRIPT_MARK = "data-utmify-pixel";

/** Evita tentativas concorrentes de carregamento. */
let loading = false;

/**
 * @function loadUtmifyPixel
 * @description Injeta o script da Utmify (uma única vez) respeitando o consentimento.
 *
 * @returns {Promise<boolean>} true quando o script está presente/injetado.
 */
export async function loadUtmifyPixel(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (document.querySelector(`script[${SCRIPT_MARK}]`)) return true;
  if (loading) return false;

  if (!(await isAdsTrackingAllowed())) return false;

  loading = true;

  // Variável global exigida pelo script da Utmify.
  (window as unknown as Record<string, unknown>).tikTokPixelId = UTMIFY_PIXEL_ID;

  const script = document.createElement("script");
  script.src = UTMIFY_PIXEL_SRC;
  script.async = true;
  script.defer = true;
  script.setAttribute(SCRIPT_MARK, "true");
  script.onerror = () => {
    loading = false;
  };
  (document.head || document.documentElement).appendChild(script);

  observeUtmifyEvents();

  return true;
}

/** Garante que o observador de eventos da Utmify seja instalado apenas uma vez. */
let observerReady = false;

/**
 * @function observeUtmifyEvents
 * @description Observa os eventos que o pixel da Utmify dispara no TikTok e registra
 * cada um no log técnico (tabela `tiktok_events`, origem "utmify"), com ttclid,
 * event_id, valor e parâmetros de campanha — para acompanhar o fluxo completo no /admin.
 *
 * Disparos feitos pela nossa própria camada são ignorados (já são registrados como
 * "Navegador"), evitando duplicidade no painel.
 */
function observeUtmifyEvents() {
  if (observerReady || typeof window === "undefined") return;
  observerReady = true;

  const install = () => {
    const ttq = (window as unknown as { ttq?: any }).ttq;
    if (!ttq || typeof ttq.track !== "function" || (ttq as any).__utmifyWrapped) return false;

    const originalTrack = ttq.track.bind(ttq);
    (ttq as any).__utmifyWrapped = true;
    ttq.track = (...args: any[]) => {
      const isInternal = Boolean((window as unknown as Record<string, unknown>).__ttInternalTrack);
      const result = originalTrack(...args);
      if (!isInternal) void logUtmifyEvent(args[0], args[1], args[2]);
      return result;
    };
    return true;
  };

  if (install()) return;

  // O script da Utmify é assíncrono: tenta instalar por alguns segundos.
  let attempts = 0;
  const timer = window.setInterval(() => {
    attempts += 1;
    if (install() || attempts > 40) window.clearInterval(timer);
  }, 250);
}

/**
 * @function logUtmifyEvent
 * @description Grava no log técnico um evento disparado pelo pixel da Utmify.
 *
 * @param {string} event - Nome do evento enviado ao TikTok.
 * @param {Record<string, unknown>} properties - Propriedades enviadas com o evento.
 * @param {Record<string, unknown>} options - Opções (pode conter o event_id).
 */
async function logUtmifyEvent(
  event: unknown,
  properties?: Record<string, unknown>,
  options?: Record<string, unknown>,
) {
  try {
    const attribution = getAttribution();
    const rawValue = properties?.value;
    const value = typeof rawValue === "number" ? rawValue : Number(rawValue);
    const eventId =
      (options?.event_id as string | undefined) ??
      (properties?.event_id as string | undefined) ??
      `utmify-${Date.now()}`;

    await supabase.from("tiktok_events").insert({
      event_name: String(event ?? "Desconhecido"),
      event_id: eventId,
      source: "utmify",
      value: Number.isFinite(value) && value > 0 ? value : null,
      currency: (properties?.currency as string | undefined) || "BRL",
      page: window.location.pathname,
      status: "sent",
      ttclid: attribution.ttclid,
      ttp: attribution.ttp,
      content_id: (properties?.content_id as string | undefined) ?? null,
      utm: Object.keys(attribution.utm).length ? attribution.utm : null,
      dedup_blocked: false,
    });
  } catch (err) {
    console.warn("Não foi possível registrar o evento da Utmify:", err);
  }
}

/**
 * @function initUtmifyPixel
 * @description Tenta carregar o pixel agora e, caso o visitante ainda não tenha
 * aceitado o aviso de cookies, novamente quando a escolha mudar.
 *
 * @returns {() => void} Função para cancelar a observação do consentimento.
 */
export function initUtmifyPixel(): () => void {
  void loadUtmifyPixel();
  return onConsentChange(() => {
    void loadUtmifyPixel();
  });
}

/**
 * @file tiktok.ts
 * @description Camada ÚNICA e centralizada de rastreamento do TikTok.
 *
 * Responsabilidades:
 * - Carregar o Pixel do TikTok uma única vez, respeitando o consentimento.
 * - Disparar cada evento do funil com parâmetros completos e `event_id` determinístico.
 * - Espelhar o mesmo evento (mesmo `event_id`) na Events API pelo servidor, permitindo
 *   que o TikTok deduplique navegador + servidor.
 * - Bloquear duplicidade local (refresh, clique duplo, múltiplas abas, re-render do React).
 *
 * IMPORTANTE: nenhum token da Events API existe neste arquivo. O token vive apenas
 * como secret no servidor (`TIKTOK_ACCESS_TOKEN`), usado pela função `tiktok-event`.
 */

import { supabase } from "@/integrations/supabase/client";
import { isAdsTrackingAllowed, onConsentChange } from "@/lib/consent";
import { captureAttribution, getAttribution, getTrackingSessionId } from "@/lib/tracking/attribution";

/** ID público do Pixel do TikTok (valor público, pode ficar no navegador). */
export const TIKTOK_PIXEL_ID = "DAIOGE3C77UC8FLK3JB0";

/** Chave onde guardamos os event_id já disparados (proteção contra duplicidade). */
const FIRED_KEY = "tt_fired_events_v1";

/** Validade do registro de duplicidade (24 h). */
const FIRED_TTL_MS = 24 * 60 * 60 * 1000;

/** Eventos padrão suportados. */
export type TikTokEventName =
  | "Pageview"
  | "ViewContent"
  | "ClickButton"
  | "AddToCart"
  | "InitiateCheckout"
  | "AddPaymentInfo"
  | "PlaceAnOrder"
  | "CompletePayment";

/**
 * @interface TrackParams
 * @description Parâmetros aceitos por qualquer evento do funil.
 */
export interface TrackParams {
  /** Identificador único e determinístico do evento (mesmo no navegador e no servidor). */
  eventId: string;
  /** Valor monetário do evento, quando aplicável. */
  value?: number;
  /** Moeda (padrão BRL). */
  currency?: string;
  /** Identificador do produto. */
  contentId?: string;
  /** Nome do produto. */
  contentName?: string;
  /** Quantidade de itens. */
  quantity?: number;
  /** Descrição curta do evento/produto. */
  description?: string;
  /** E-mail do cliente (Advanced Matching) — só enviado quando realmente existe. */
  email?: string;
  /** Telefone do cliente (Advanced Matching). */
  phone?: string;
  /** Identificador próprio do cliente/pedido (Advanced Matching). */
  externalId?: string;
  /** Envia também pela Events API do servidor (padrão: true). */
  mirrorToServer?: boolean;
}

declare global {
  interface Window {
    ttq?: any;
    TiktokAnalyticsObject?: string;
  }
}

/** Evita carregar o pixel mais de uma vez por página. */
let pixelLoading = false;

/** Item aguardando o consentimento do cliente para ser enviado. */
type PendingItem =
  | { kind: "event"; event: TikTokEventName; params: TrackParams }
  | { kind: "page"; path: string };

/** Fila de eventos capturados antes da resposta ao aviso de cookies. */
const pending: PendingItem[] = [];

/** Indica se o ouvinte de mudança de consentimento já foi registrado. */
let consentListenerReady = false;

/**
 * Coloca um evento na fila e garante que ele será enviado quando (e se) o cliente
 * autorizar o rastreamento de publicidade.
 *
 * @param {PendingItem} item - Evento ou visualização de página pendente.
 */
function enqueue(item: PendingItem) {
  // Evita acumular o mesmo evento várias vezes na fila.
  const key = item.kind === "event" ? item.params.eventId : `pv-${item.path}`;
  const exists = pending.some((p) => (p.kind === "event" ? p.params.eventId : `pv-${p.path}`) === key);
  if (!exists) pending.push(item);

  if (consentListenerReady) return;
  consentListenerReady = true;
  onConsentChange(async () => {
    if (!(await isAdsTrackingAllowed())) return;
    const items = pending.splice(0, pending.length);
    for (const p of items) {
      if (p.kind === "event") await trackTikTokEvent(p.event, p.params);
      else await trackPageView(p.path);
    }
  });
}

/**
 * Lê o mapa de eventos já disparados, descartando registros expirados.
 *
 * @returns {Record<string, number>} Mapa event_id → timestamp.
 */
function readFired(): Record<string, number> {
  try {
    const raw = localStorage.getItem(FIRED_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, number>;
    const now = Date.now();
    return Object.fromEntries(Object.entries(parsed).filter(([, ts]) => now - ts < FIRED_TTL_MS));
  } catch {
    return {};
  }
}

/**
 * Marca um event_id como já disparado.
 *
 * @param {string} eventId - Identificador do evento.
 */
function markFired(eventId: string) {
  try {
    const fired = readFired();
    fired[eventId] = Date.now();
    localStorage.setItem(FIRED_KEY, JSON.stringify(fired));
  } catch { /* sem armazenamento: a proteção vale apenas nesta página */ }
}

/**
 * @function wasFired
 * @description Indica se um evento já foi disparado nas últimas 24 h.
 *
 * @param {string} eventId - Identificador do evento.
 * @returns {boolean} true quando o evento já foi enviado.
 */
export function wasFired(eventId: string): boolean {
  return Boolean(readFired()[eventId]);
}

/**
 * @function loadTikTokPixel
 * @description Carrega o script do Pixel do TikTok uma única vez, apenas quando o
 * rastreamento de publicidade é permitido pela região/consentimento.
 *
 * @returns {Promise<boolean>} true quando o pixel está disponível.
 */
export async function loadTikTokPixel(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (window.ttq) return true;
  if (pixelLoading) return false;

  if (!(await isAdsTrackingAllowed())) return false;

  pixelLoading = true;

  // Snippet oficial do TikTok (versão 1.1), adaptado para TypeScript.
  (function (w: any, d: Document, t: string) {
    w.TiktokAnalyticsObject = t;
    const ttq: any = (w[t] = w[t] || []);
    ttq.methods = [
      "page", "track", "identify", "instances", "debug", "on", "off", "once",
      "ready", "alias", "group", "enableCookie", "disableCookie", "holdConsent",
      "revokeConsent", "grantConsent",
    ];
    ttq.setAndDefer = function (obj: any, method: string) {
      obj[method] = function () {
        obj.push([method].concat(Array.prototype.slice.call(arguments, 0)));
      };
    };
    for (let i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
    ttq.instance = function (id: string) {
      const inst = ttq._i?.[id] || [];
      for (let n = 0; n < ttq.methods.length; n++) ttq.setAndDefer(inst, ttq.methods[n]);
      return inst;
    };
    ttq.load = function (id: string, options?: any) {
      const url = "https://analytics.tiktok.com/i18n/pixel/events.js";
      const cdn = options?.cdnUrl ?? url;
      ttq._i = ttq._i || {};
      ttq._i[id] = [];
      ttq._i[id]._u = cdn;
      ttq._t = ttq._t || {};
      ttq._t[id] = +new Date();
      ttq._o = ttq._o || {};
      ttq._o[id] = options || {};
      const script = d.createElement("script");
      script.type = "text/javascript";
      script.async = true;
      script.src = `${cdn}?sdkid=${id}&lib=${t}`;
      d.getElementsByTagName("head")[0].appendChild(script);
    };
    ttq.load(TIKTOK_PIXEL_ID);
  })(window, document, "ttq");

  return true;
}

/**
 * Registra o evento no log técnico (tabela `tiktok_events`) com origem "browser".
 *
 * @param {TikTokEventName} event - Nome do evento.
 * @param {TrackParams} params - Parâmetros usados.
 * @param {string} status - Resultado ("sent" ou "duplicado").
 */
async function logBrowserEvent(event: TikTokEventName, params: TrackParams, status: string) {
  const attribution = getAttribution();
  try {
    await supabase.from("tiktok_events").insert({
      event_name: event,
      event_id: params.eventId,
      source: "browser",
      value: params.value ?? null,
      currency: params.currency || "BRL",
      page: typeof window !== "undefined" ? window.location.pathname : null,
      status,
      ttclid: attribution.ttclid,
      ttp: attribution.ttp,
      content_id: params.contentId ?? null,
      external_id: params.externalId ?? null,
      utm: Object.keys(attribution.utm).length ? attribution.utm : null,
      dedup_blocked: status === "duplicado",
    });
  } catch (err) {
    console.warn("Não foi possível registrar o evento no painel:", err);
  }
}

/**
 * Envia o MESMO evento pela Events API (servidor), reaproveitando o `event_id`
 * para que o TikTok deduplique navegador + servidor.
 *
 * @param {TikTokEventName} event - Nome do evento.
 * @param {TrackParams} params - Parâmetros do evento.
 */
async function mirrorToServer(event: TikTokEventName, params: TrackParams) {
  const attribution = getAttribution();
  try {
    await supabase.functions.invoke("tiktok-event", {
      body: {
        event,
        event_id: params.eventId,
        value: params.value,
        currency: params.currency || "BRL",
        content_id: params.contentId,
        content_name: params.contentName,
        quantity: params.quantity,
        description: params.description,
        email: params.email,
        phone: params.phone,
        external_id: params.externalId,
        ttclid: attribution.ttclid,
        ttp: attribution.ttp,
        utm: attribution.utm,
        url: window.location.href,
        referrer: document.referrer || undefined,
        user_agent: navigator.userAgent,
      },
    });
  } catch (err) {
    // Falha de rastreamento nunca deve afetar a experiência de compra.
    console.warn(`Falha ao espelhar ${event} no servidor:`, err);
  }
}

/**
 * @function trackTikTokEvent
 * @description Função central de rastreamento: valida consentimento, bloqueia
 * duplicidade, dispara no Pixel e espelha na Events API.
 *
 * @param {TikTokEventName} event - Nome do evento padrão do TikTok.
 * @param {TrackParams} params - Parâmetros do evento (inclui o `event_id`).
 * @returns {Promise<boolean>} true quando o evento foi realmente enviado.
 */
export async function trackTikTokEvent(event: TikTokEventName, params: TrackParams): Promise<boolean> {
  if (typeof window === "undefined") return false;

  // Garante que os identificadores da URL já estejam guardados antes do envio.
  captureAttribution();

  // Sem consentimento ainda: o evento fica na fila e é enviado assim que o cliente
  // aceitar o aviso — nada é perdido e nada é enviado sem permissão.
  if (!(await isAdsTrackingAllowed())) {
    enqueue({ kind: "event", event, params });
    return false;
  }

  // Proteção contra duplicidade (refresh, clique duplo, duas abas, re-render).
  if (wasFired(params.eventId)) {
    console.info(`Evento ${event} bloqueado por duplicidade (${params.eventId}).`);
    return false;
  }
  markFired(params.eventId);

  await loadTikTokPixel();

  const properties: Record<string, unknown> = {
    currency: params.currency || "BRL",
    event_id: params.eventId,
  };
  if (typeof params.value === "number" && params.value > 0) properties.value = params.value;
  if (params.description) properties.description = params.description;

  // Parâmetros de campanha (Utmify/UTMs) + identificador de clique: enviados junto
  // ao evento para o TikTok reconhecer o anúncio de origem de ponta a ponta.
  const attributionNow = getAttribution();
  for (const [key, value] of Object.entries(attributionNow.utm)) {
    if (value) properties[key] = String(value).slice(0, 255);
  }
  if (attributionNow.ttclid) properties.ttclid = attributionNow.ttclid;
  if (params.contentId) {
    properties.content_type = "product";
    properties.content_id = params.contentId;
    properties.contents = [
      {
        content_id: params.contentId,
        content_type: "product",
        content_name: params.contentName,
        quantity: params.quantity && params.quantity > 0 ? params.quantity : 1,
        price: typeof params.value === "number" && params.quantity
          ? Number((params.value / params.quantity).toFixed(2))
          : params.value,
      },
    ];
  }

  try {
    // Advanced Matching: apenas dados realmente disponíveis. O pixel aplica o hash.
    if (window.ttq && (params.email || params.phone || params.externalId)) {
      window.ttq.identify({
        email: params.email || undefined,
        phone_number: params.phone ? `+55${params.phone.replace(/\D/g, "")}` : undefined,
        external_id: params.externalId || undefined,
      });
    }
    window.ttq?.track(event, properties, { event_id: params.eventId });
  } catch (err) {
    console.warn(`Falha ao disparar ${event} no pixel:`, err);
  }

  void logBrowserEvent(event, params, "sent");
  if (params.mirrorToServer !== false) void mirrorToServer(event, params);

  return true;
}

/**
 * @function trackPageView
 * @description Registra a visualização de uma página (uma vez por rota por sessão).
 *
 * @param {string} path - Caminho da rota visitada.
 */
export async function trackPageView(path: string) {
  if (typeof window === "undefined") return;
  captureAttribution();
  if (!(await isAdsTrackingAllowed())) {
    enqueue({ kind: "page", path });
    return;
  }
  await loadTikTokPixel();

  const eventId = `pv-${getTrackingSessionId()}-${path}`;
  if (wasFired(eventId)) return;
  markFired(eventId);

  try {
    window.ttq?.page();
  } catch (err) {
    console.warn("Falha ao registrar a visualização de página:", err);
  }
  void logBrowserEvent("Pageview", { eventId, currency: "BRL" }, "sent");
}

/**
 * @function trackViewContent
 * @description Visualização da oferta/produto.
 *
 * @param {object} p - Dados do produto exibido.
 */
export function trackViewContent(p: { contentId: string; contentName?: string; value?: number }) {
  return trackTikTokEvent("ViewContent", {
    eventId: `vc-${getTrackingSessionId()}-${p.contentId}`,
    contentId: p.contentId,
    contentName: p.contentName,
    value: p.value,
    quantity: 1,
  });
}

/**
 * @function trackAddToCart
 * @description Produto adicionado ao carrinho.
 *
 * @param {object} p - Dados do item adicionado.
 */
export function trackAddToCart(p: { contentId: string; contentName?: string; value?: number; quantity?: number }) {
  return trackTikTokEvent("AddToCart", {
    eventId: `atc-${getTrackingSessionId()}-${p.contentId}`,
    contentId: p.contentId,
    contentName: p.contentName,
    value: p.value,
    quantity: p.quantity ?? 1,
  });
}

/**
 * @function trackClickButton
 * @description Interação relevante com um botão (usado apenas quando há ação real).
 *
 * @param {string} label - Identificação do botão.
 */
export function trackClickButton(label: string) {
  return trackTikTokEvent("ClickButton", {
    eventId: `btn-${getTrackingSessionId()}-${label}`,
    description: label,
    mirrorToServer: false,
  });
}

/**
 * @function trackInitiateCheckout
 * @description Início real do checkout (usuário entrou na finalização da compra).
 *
 * @param {object} p - Dados do pedido em formação.
 */
export function trackInitiateCheckout(p: { contentId: string; contentName?: string; value: number; quantity?: number }) {
  return trackTikTokEvent("InitiateCheckout", {
    eventId: `ic-${getTrackingSessionId()}-${p.contentId}`,
    contentId: p.contentId,
    contentName: p.contentName,
    value: p.value,
    quantity: p.quantity ?? 1,
  });
}

/**
 * @function trackAddPaymentInfo
 * @description Cliente escolheu a forma de pagamento e confirmou o pedido.
 *
 * @param {object} p - Dados do pedido, incluindo contato para Advanced Matching.
 */
export function trackAddPaymentInfo(p: {
  contentId: string;
  contentName?: string;
  value: number;
  quantity?: number;
  email?: string;
  phone?: string;
}) {
  return trackTikTokEvent("AddPaymentInfo", {
    eventId: `api-${getTrackingSessionId()}-${p.contentId}`,
    contentId: p.contentId,
    contentName: p.contentName,
    value: p.value,
    quantity: p.quantity ?? 1,
    email: p.email,
    phone: p.phone,
  });
}

/**
 * @function trackPlaceAnOrder
 * @description PIX gerado: pedido criado, aguardando pagamento. O `event_id` é
 * determinístico pela transação, então refresh/duplo clique não geram novo evento.
 *
 * @param {object} p - Dados da transação criada.
 */
export function trackPlaceAnOrder(p: {
  transactionId: string;
  contentId: string;
  contentName?: string;
  value: number;
  quantity?: number;
  email?: string;
  phone?: string;
}) {
  return trackTikTokEvent("PlaceAnOrder", {
    eventId: `order-${p.transactionId}`,
    contentId: p.contentId,
    contentName: p.contentName,
    value: p.value,
    quantity: p.quantity ?? 1,
    email: p.email,
    phone: p.phone,
    externalId: p.transactionId,
  });
}

/**
 * @function purchaseEventId
 * @description Monta o `event_id` determinístico da compra. O MESMO valor é usado
 * pelo servidor (webhook do gateway), garantindo a deduplicação no TikTok.
 *
 * @param {string} transactionId - Identificador da transação no gateway.
 * @returns {string} event_id da compra.
 */
export function purchaseEventId(transactionId: string): string {
  return `purchase-${transactionId}`;
}

/**
 * @file attribution.ts
 * @description Captura e persistência de TODOS os identificadores de atribuição de
 * tráfego (TikTok e campanhas em geral).
 *
 * Regras aplicadas:
 * - A captura acontece na primeira visita e em cada mudança de rota (SPA).
 * - Os valores são guardados EXATAMENTE como recebidos (sem truncar, sem normalizar).
 * - O primeiro clique (`first`) nunca é sobrescrito; o último clique válido (`last`)
 *   é atualizado quando um novo parâmetro válido chega na URL.
 * - Um valor vazio/inválido NUNCA sobrescreve um valor já guardado.
 * - Persistência redundante em localStorage + sessionStorage (sobrevive a navegação,
 *   refresh, redirect do gateway, checkout, upsell e retorno posterior).
 */

/** Chave do primeiro toque (nunca sobrescrito). */
const FIRST_KEY = "tt_attribution_first_v1";

/** Chave do último toque (atualizada por cliques mais recentes). */
const LAST_KEY = "tt_attribution_last_v1";

/** Chave da sessão de rastreamento (usada para montar event_id determinístico). */
const SESSION_KEY = "tt_tracking_session_v1";

/** Nomes de parâmetro aceitos para o Click ID do TikTok, em ordem de prioridade. */
const CLICK_ID_PARAMS = ["ttclid", "ttclickid", "tt_clickid", "click_id", "clickid"];

/** Parâmetros de campanha preservados quando presentes na URL. */
const CAMPAIGN_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "utm_id",
  "campaign_id",
  "adgroup_id",
  "ad_id",
  "creative_id",
  "placement",
  "site_source_name",
  "gclid",
  "fbclid",
];

/**
 * @interface Attribution
 * @description Conjunto de identificadores de atribuição guardados no navegador.
 */
export interface Attribution {
  /** Click ID do TikTok, exatamente como veio na URL. */
  ttclid: string | null;
  /** Identificador de visitante do pixel do TikTok (cookie `_ttp`). */
  ttp: string | null;
  /** Parâmetros de campanha (UTMs, IDs de campanha/anúncio etc.). */
  utm: Record<string, string>;
  /** URL de entrada registrada no momento da captura. */
  landing_url: string | null;
  /** Momento (ISO) da captura. */
  captured_at: string | null;
}

/** Estrutura vazia usada como padrão. */
const EMPTY: Attribution = { ttclid: null, ttp: null, utm: {}, landing_url: null, captured_at: null };

/**
 * Lê um objeto JSON guardado, tentando os dois armazenamentos.
 *
 * @param {string} key - Chave consultada.
 * @returns {Attribution | null} Objeto guardado ou null.
 */
function read(key: string): Attribution | null {
  try {
    const raw = localStorage.getItem(key) || sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return { ...EMPTY, ...parsed, utm: parsed.utm && typeof parsed.utm === "object" ? parsed.utm : {} };
  } catch {
    return null;
  }
}

/**
 * Grava um objeto de atribuição nos dois armazenamentos.
 *
 * @param {string} key - Chave de gravação.
 * @param {Attribution} value - Dados a gravar.
 */
function write(key: string, value: Attribution) {
  const raw = JSON.stringify(value);
  try { localStorage.setItem(key, raw); } catch { /* armazenamento indisponível */ }
  try { sessionStorage.setItem(key, raw); } catch { /* idem */ }
}

/**
 * Lê o cookie `_ttp` criado pelo pixel do TikTok.
 *
 * @returns {string | null} Valor do cookie ou null quando o pixel ainda não gravou.
 */
function readTtpCookie(): string | null {
  try {
    const match = document.cookie.match(/(?:^|;\s*)_ttp=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

/**
 * @function getTrackingSessionId
 * @description Identificador estável da sessão de rastreamento, usado para gerar
 * `event_id` determinístico (evita duplicidade entre refresh e múltiplas abas).
 *
 * @returns {string} Identificador da sessão.
 */
export function getTrackingSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "no-storage";
  }
}

/**
 * @function captureAttribution
 * @description Captura os identificadores presentes na URL atual e no cookie do pixel,
 * preservando o primeiro toque e atualizando o último toque válido.
 *
 * @returns {Attribution} Atribuição em uso após a captura.
 */
export function captureAttribution(): Attribution {
  if (typeof window === "undefined") return EMPTY;

  const previousLast = read(LAST_KEY) ?? EMPTY;
  let ttclid: string | null = null;
  const utm: Record<string, string> = {};

  try {
    const params = new URLSearchParams(window.location.search);

    for (const name of CLICK_ID_PARAMS) {
      const value = params.get(name);
      if (value && value.trim()) { ttclid = value; break; }
    }

    for (const name of CAMPAIGN_PARAMS) {
      const value = params.get(name);
      if (value && value.trim()) utm[name] = value;
    }
  } catch (err) {
    console.warn("Não foi possível ler os parâmetros de rastreamento da URL.", err);
  }

  const ttp = readTtpCookie();

  // Mescla: valores novos válidos ganham; ausentes preservam o que já existia.
  const merged: Attribution = {
    ttclid: ttclid || previousLast.ttclid || null,
    ttp: ttp || previousLast.ttp || null,
    utm: Object.keys(utm).length ? { ...previousLast.utm, ...utm } : previousLast.utm,
    landing_url: previousLast.landing_url || window.location.href,
    captured_at: ttclid || Object.keys(utm).length ? new Date().toISOString() : previousLast.captured_at,
  };

  write(LAST_KEY, merged);

  // Primeiro toque: gravado apenas uma vez, quando há algum identificador real.
  const first = read(FIRST_KEY);
  if (!first?.ttclid && (merged.ttclid || Object.keys(merged.utm).length)) {
    write(FIRST_KEY, { ...merged, landing_url: window.location.href, captured_at: new Date().toISOString() });
  }

  return merged;
}

/**
 * @function getAttribution
 * @description Devolve a atribuição atual (último clique válido), sem alterar nada.
 *
 * @returns {Attribution} Identificadores guardados.
 */
export function getAttribution(): Attribution {
  if (typeof window === "undefined") return EMPTY;
  const last = read(LAST_KEY) ?? EMPTY;
  // O cookie do pixel é sempre a fonte mais atual do `_ttp`.
  return { ...last, ttp: readTtpCookie() || last.ttp };
}

/**
 * @function getFirstAttribution
 * @description Devolve o primeiro toque registrado (para diagnóstico/auditoria).
 *
 * @returns {Attribution} Primeiro conjunto de identificadores capturado.
 */
export function getFirstAttribution(): Attribution {
  if (typeof window === "undefined") return EMPTY;
  return read(FIRST_KEY) ?? EMPTY;
}

/**
 * @function getTikTokClickId
 * @description Atalho para o Click ID do TikTok em uso.
 *
 * @returns {string | null} Click ID ou null.
 */
export function getTikTokClickId(): string | null {
  return getAttribution().ttclid;
}

/**
 * @function getTikTokTtp
 * @description Atalho para o identificador de visitante do pixel (`_ttp`).
 *
 * @returns {string | null} Valor do `_ttp` ou null.
 */
export function getTikTokTtp(): string | null {
  return getAttribution().ttp;
}

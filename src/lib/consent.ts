/**
 * @file consent.ts
 * @description Controle de consentimento de publicidade/marketing.
 *
 * Regra aplicada:
 * - Visitantes de regiões que exigem consentimento (EEE, Reino Unido, Suíça e casos
 *   não resolvidos) começam com o consentimento NEGADO e veem o aviso de cookies.
 * - Nas demais regiões (ex.: Brasil) o rastreamento fica ativo sem aviso, respeitando
 *   uma recusa explícita já registrada.
 *
 * O registro da escolha (quem aceitou, quando, e a versão do texto exibido) fica em
 * localStorage e pode ser consultado/alterado pelo visitante a qualquer momento.
 */

/** Chave usada no localStorage para guardar a escolha do visitante. */
const STORAGE_KEY = "ads_consent_v1";

/** Versão do texto do aviso exibido — muda quando o texto/finalidades mudarem. */
export const CONSENT_NOTICE_VERSION = "2026-09-aviso-tiktok-v1";

/** Evento interno disparado quando a escolha muda (mesma aba). */
const CHANGE_EVENT = "ads-consent-change";

/** Países/territórios que exigem consentimento prévio para cookies de publicidade. */
const CONSENT_REGIONS = [
  // EEE
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU",
  "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES",
  "SE", "IS", "LI", "NO",
  // Reino Unido e Suíça
  "GB", "CH",
];

/** Estrutura do registro de consentimento guardado no navegador. */
export interface ConsentRecord {
  /** "granted" quando o visitante aceitou publicidade; "denied" quando recusou. */
  choice: "granted" | "denied";
  /** Momento (ISO) da escolha. */
  at: string;
  /** Versão do aviso exibido no momento da escolha. */
  noticeVersion: CONSENT_NOTICE_VERSION | string;
  /** País detectado no momento da escolha (pode ser null). */
  region: string | null;
}

/** Cache do país detectado durante esta visita de página. */
let cachedRegion: string | null | undefined;

/**
 * Lê a escolha registrada pelo visitante.
 *
 * @returns {ConsentRecord | null} Registro salvo ou null quando ainda não houve escolha.
 */
export function getConsentRecord(): ConsentRecord | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.choice === "granted" || parsed?.choice === "denied") return parsed as ConsentRecord;
    return null;
  } catch {
    return null;
  }
}

/**
 * Registra (ou atualiza) a escolha do visitante e notifica a aplicação.
 *
 * @param {"granted" | "denied"} choice - Aceite ou recusa de publicidade.
 */
export function setConsentChoice(choice: "granted" | "denied") {
  const record: ConsentRecord = {
    choice,
    at: new Date().toISOString(),
    noticeVersion: CONSENT_NOTICE_VERSION,
    region: cachedRegion ?? null,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {
    // Navegador sem armazenamento disponível — a escolha vale apenas para esta página.
  }
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: record }));
}

/**
 * Detecta o país do visitante usando o endpoint same-origin /cdn-cgi/trace.
 * Falhas, respostas inválidas, "XX" (desconhecido) e "T1" (Tor) são tratadas como
 * região que exige consentimento.
 *
 * @returns {Promise<string | null>} Código do país em maiúsculas, ou null quando desconhecido.
 */
export async function detectRegion(): Promise<string | null> {
  if (cachedRegion !== undefined) return cachedRegion;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);
    const res = await fetch("/cdn-cgi/trace", { signal: controller.signal, cache: "no-store" });
    clearTimeout(timer);
    if (!res.ok) {
      cachedRegion = null;
      return cachedRegion;
    }
    const text = await res.text();
    const match = text.match(/loc=([A-Z0-9]{2})/i);
    const loc = match ? match[1].toUpperCase() : null;
    cachedRegion = !loc || loc === "XX" || loc === "T1" ? null : loc;
  } catch {
    cachedRegion = null;
  }
  return cachedRegion;
}

/**
 * Indica se a região atual exige consentimento antes de qualquer rastreamento de anúncios.
 *
 * @returns {Promise<boolean>} true quando o aviso precisa ser exibido nessa região.
 */
export async function regionRequiresConsent(): Promise<boolean> {
  const region = await detectRegion();
  if (!region) return true; // desconhecido → trata como região regulada
  return CONSENT_REGIONS.includes(region);
}

/**
 * Decide se o rastreamento de publicidade pode ser executado agora.
 *
 * @returns {Promise<boolean>} true quando há permissão (aceite explícito ou região livre).
 */
export async function isAdsTrackingAllowed(): Promise<boolean> {
  const record = getConsentRecord();
  if (record?.choice === "granted") return true;
  if (record?.choice === "denied") return false;
  return !(await regionRequiresConsent());
}

/**
 * Observa mudanças na escolha de consentimento (inclusive em outras abas).
 *
 * @param {(record: ConsentRecord | null) => void} callback - Chamado a cada mudança.
 * @returns {() => void} Função para cancelar a observação.
 */
export function onConsentChange(callback: (record: ConsentRecord | null) => void): () => void {
  const handleCustom = () => callback(getConsentRecord());
  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) callback(getConsentRecord());
  };
  window.addEventListener(CHANGE_EVENT, handleCustom);
  window.addEventListener("storage", handleStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handleCustom);
    window.removeEventListener("storage", handleStorage);
  };
}

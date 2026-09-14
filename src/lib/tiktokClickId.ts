/**
 * @file tiktokClickId.ts
 * @description Captura e persistência do identificador de clique do TikTok (ttclid)
 * e do identificador de visitante do pixel (ttp).
 *
 * Regras aplicadas:
 * - O ttclid chega na URL do anúncio (?ttclid=...). É capturado na primeira página
 *   visitada e guardado no navegador (localStorage + sessionStorage) para sobreviver
 *   à navegação entre páginas, recarregamentos e ao checkout.
 * - O valor é mantido EXATAMENTE como recebido: sem recorte, sem troca de caracteres
 *   e sem normalização (apenas a decodificação padrão da URL feita pelo navegador).
 * - Um ttclid novo (clique mais recente) substitui o anterior; sem ttclid na URL,
 *   o valor já guardado é preservado.
 */

/** Chave de armazenamento do identificador de clique. */
const TTCLID_KEY = "tt_click_id";

/** Chave de armazenamento do identificador de visitante do pixel. */
const TTP_KEY = "tt_ttp";

/** Limite defensivo de tamanho (bem acima do tamanho real de um ttclid). */
const MAX_LENGTH = 512;

/**
 * Lê um valor guardado, tentando os dois armazenamentos disponíveis.
 *
 * @param {string} key - Chave a consultar.
 * @returns {string | null} Valor guardado ou null.
 */
function readStored(key: string): string | null {
  try {
    return localStorage.getItem(key) || sessionStorage.getItem(key) || null;
  } catch {
    return null;
  }
}

/**
 * Guarda um valor nos dois armazenamentos (redundância contra limpeza de sessão).
 *
 * @param {string} key - Chave a gravar.
 * @param {string} value - Valor a gravar, sem alterações.
 */
function writeStored(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Armazenamento indisponível — segue com a sessão apenas.
  }
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // Nada a fazer: o valor ainda estará disponível em memória nesta página.
  }
}

/**
 * Lê o cookie `_ttp` criado pelo pixel do TikTok (identificador de visitante).
 *
 * @returns {string | null} Valor do cookie ou null quando o pixel não gravou nada.
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
 * @function captureTikTokClickId
 * @description Captura o ttclid da URL atual (quando presente) e o guarda no
 * navegador. Também guarda o `_ttp` do pixel, quando já existir. Deve ser chamada
 * o mais cedo possível em cada navegação.
 *
 * @returns {string | null} O ttclid em uso após a captura (novo ou já guardado).
 */
export function captureTikTokClickId(): string | null {
  if (typeof window === "undefined") return null;

  try {
    const params = new URLSearchParams(window.location.search);
    // Aceita as variações usadas por encurtadores e redirecionadores.
    const fromUrl =
      params.get("ttclid") || params.get("ttclickid") || params.get("tt_clickid");

    if (fromUrl && fromUrl.length <= MAX_LENGTH) {
      writeStored(TTCLID_KEY, fromUrl);
    }
  } catch (err) {
    console.warn("Não foi possível ler o identificador de clique da URL.", err);
  }

  const ttp = readTtpCookie();
  if (ttp) writeStored(TTP_KEY, ttp);

  return readStored(TTCLID_KEY);
}

/**
 * @function getTikTokClickId
 * @description Devolve o ttclid guardado, exatamente como foi recebido.
 *
 * @returns {string | null} Identificador de clique ou null.
 */
export function getTikTokClickId(): string | null {
  if (typeof window === "undefined") return null;
  return readStored(TTCLID_KEY);
}

/**
 * @function getTikTokTtp
 * @description Devolve o identificador de visitante do pixel (`_ttp`), preferindo
 * sempre o cookie atual e caindo no valor guardado.
 *
 * @returns {string | null} Identificador do visitante ou null.
 */
export function getTikTokTtp(): string | null {
  if (typeof window === "undefined") return null;
  return readTtpCookie() || readStored(TTP_KEY);
}

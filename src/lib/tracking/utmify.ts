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

  return true;
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

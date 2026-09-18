/**
 * @file sessionPage.ts
 * @description Pequeno store global que permite a uma página informar um rótulo
 * customizado (ex: "/produto/presell") para o rastreador de sessão ao vivo.
 * Evita que dois rastreadores concorram e fiquem alternando a página do visitante.
 */

let override: string | null = null;
const listeners = new Set<(page: string | null) => void>();

/** Retorna o rótulo customizado atual (ou null quando a rota deve ser usada). */
export function getPageOverride() {
  return override;
}

/** Define/limpa o rótulo customizado e notifica o rastreador. */
export function setPageOverride(page: string | null) {
  if (override === page) return;
  override = page;
  listeners.forEach((l) => l(override));
}

/** Inscreve um ouvinte para mudanças do rótulo. Retorna a função de limpeza. */
export function subscribePageOverride(listener: (page: string | null) => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

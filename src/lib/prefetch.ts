// Baixa o código da próxima tela quando o navegador fica ocioso (não bloqueia a página atual).
const loaders = {
  carrinho: () => import("@/pages/Carrinho"),
  checkout: () => { import("@/pages/FinalizarCompra"); return import("@/pages/AdicionarEndereco"); },
  pix: () => import("@/pages/PagamentoPix"),
};
export function prefetchPage(name: keyof typeof loaders) {
  const run = () => { loaders[name]().catch(() => {}); };
  const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => void };
  if (w.requestIdleCallback) w.requestIdleCallback(run, { timeout: 3000 }); else setTimeout(run, 1500);
}

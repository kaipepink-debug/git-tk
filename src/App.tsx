import { lazy, Suspense, type ComponentType } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { ProductProvider } from "@/contexts/ProductContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ScrollToTop } from "./components/ScrollToTop";
import TikTokTracking from "./components/TikTokTracking";
import ConsentBanner from "./components/ConsentBanner";
/**
 * Cada tela do site é um arquivo separado, buscado só quando o cliente entra
 * nela. Os nomes desses arquivos carregam o hash do conteúdo, então PUBLICAR
 * UMA VERSÃO NOVA APAGA OS ARQUIVOS DA ANTERIOR.
 *
 * Quem já estava navegando fica com a página velha na memória. No próximo
 * clique ela pede um arquivo que não existe mais e a tela apaga — branca,
 * sem mensagem, sem nada no que clicar. Não é erro do cliente nem do
 * navegador: é a publicação passando por baixo de quem estava no meio da
 * compra, que é justamente quem a gente não pode perder.
 *
 * A saída é recarregar uma vez, o que traz a versão nova e devolve a pessoa
 * à mesma rota. A marca na sessão existe para isso acontecer UMA vez: se o
 * arquivo faltar por outro motivo, recarregar de novo só trocaria a tela
 * branca por um site piscando para sempre.
 */
const MARCA_RECARGA = "recarregado_apos_publicacao";

const carregaTela = <P,>(importa: () => Promise<{ default: ComponentType<P> }>) =>
  lazy(() =>
    importa()
      .then((modulo) => {
        try { sessionStorage.removeItem(MARCA_RECARGA); } catch { /* sessão indisponível */ }
        return modulo;
      })
      .catch((erro) => {
        let jaRecarregou = false;
        try { jaRecarregou = sessionStorage.getItem(MARCA_RECARGA) === "1"; } catch { /* idem */ }
        if (jaRecarregou) throw erro;
        try { sessionStorage.setItem(MARCA_RECARGA, "1"); } catch { /* idem */ }
        window.location.reload();
        // Segura o carregamento até a recarga acontecer, para o React não
        // renderizar um estado de erro que vai durar um piscar de olhos.
        return new Promise<never>(() => {});
      }),
  );

// Página de vendas carregada de imediato (primeira tela); demais páginas sob demanda.
import Index from "./pages/Index";
import Produto from "./pages/Produto";

const MinhaConta = carregaTela(() => import("./pages/MinhaConta"));
const Carrinho = carregaTela(() => import("./pages/Carrinho"));
const FinalizarCompra = carregaTela(() => import("./pages/FinalizarCompra"));
const AdicionarEndereco = carregaTela(() => import("./pages/AdicionarEndereco"));
const PagamentoPix = carregaTela(() => import("./pages/PagamentoPix"));
const NotFound = carregaTela(() => import("./pages/NotFound"));
const SobreNos = carregaTela(() => import("./pages/SobreNos"));
const QuemSomos = carregaTela(() => import("./pages/QuemSomos"));
const PoliticaPrivacidade = carregaTela(() => import("./pages/PoliticaPrivacidade"));
const TermosCondicoes = carregaTela(() => import("./pages/TermosCondicoes"));
const PoliticaTrocas = carregaTela(() => import("./pages/PoliticaTrocas"));
const PoliticaReembolso = carregaTela(() => import("./pages/PoliticaReembolso"));
const PoliticaEnvio = carregaTela(() => import("./pages/PoliticaEnvio"));
const PoliticaCookies = carregaTela(() => import("./pages/PoliticaCookies"));
const CentralAtendimento = carregaTela(() => import("./pages/CentralAtendimento"));
const PrazoEntrega = carregaTela(() => import("./pages/PrazoEntrega"));
const RastreamentoPedido = carregaTela(() => import("./pages/RastreamentoPedido"));
const Obrigado = carregaTela(() => import("./pages/Obrigado"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ProductProvider>
        <BrowserRouter>
          <ScrollToTop />
          {/* Rastreamento do TikTok (respeita o consentimento) e aviso de cookies */}
          <TikTokTracking />
          <ConsentBanner />
          <Suspense fallback={<div className="min-h-screen bg-background" />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/produto" element={<Produto />} />
              <Route path="/minha-conta" element={<MinhaConta />} />
              <Route path="/carrinho" element={<Carrinho />} />
              <Route path="/finalizar-compra" element={<FinalizarCompra />} />
              <Route path="/adicionar-endereco" element={<AdicionarEndereco />} />
              <Route path="/pagamento-pix" element={<PagamentoPix />} />
              <Route path="/obrigado" element={<Obrigado />} />
              <Route path="/sobre-nos" element={<SobreNos />} />
              <Route path="/quem-somos" element={<QuemSomos />} />
              <Route path="/politica-privacidade" element={<PoliticaPrivacidade />} />
              <Route path="/termos-condicoes" element={<TermosCondicoes />} />
              <Route path="/politica-trocas" element={<PoliticaTrocas />} />
              <Route path="/politica-reembolso" element={<PoliticaReembolso />} />
              <Route path="/politica-envio" element={<PoliticaEnvio />} />
              <Route path="/politica-cookies" element={<PoliticaCookies />} />
              <Route path="/central-atendimento" element={<CentralAtendimento />} />
              <Route path="/prazo-entrega" element={<PrazoEntrega />} />
              <Route path="/rastreamento-pedido" element={<RastreamentoPedido />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ProductProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

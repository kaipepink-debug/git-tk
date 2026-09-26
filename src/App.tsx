import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { ProductProvider } from "@/contexts/ProductContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ScrollToTop } from "./components/ScrollToTop";
import TikTokTracking from "./components/TikTokTracking";
import ConsentBanner from "./components/ConsentBanner";
// Página de vendas carregada de imediato (primeira tela); demais páginas sob demanda.
import Index from "./pages/Index";
import Produto from "./pages/Produto";

const MinhaConta = lazy(() => import("./pages/MinhaConta"));
const Carrinho = lazy(() => import("./pages/Carrinho"));
const FinalizarCompra = lazy(() => import("./pages/FinalizarCompra"));
const AdicionarEndereco = lazy(() => import("./pages/AdicionarEndereco"));
const PagamentoPix = lazy(() => import("./pages/PagamentoPix"));
const NotFound = lazy(() => import("./pages/NotFound"));
const SobreNos = lazy(() => import("./pages/SobreNos"));
const QuemSomos = lazy(() => import("./pages/QuemSomos"));
const PoliticaPrivacidade = lazy(() => import("./pages/PoliticaPrivacidade"));
const TermosCondicoes = lazy(() => import("./pages/TermosCondicoes"));
const PoliticaTrocas = lazy(() => import("./pages/PoliticaTrocas"));
const PoliticaReembolso = lazy(() => import("./pages/PoliticaReembolso"));
const PoliticaEnvio = lazy(() => import("./pages/PoliticaEnvio"));
const PoliticaCookies = lazy(() => import("./pages/PoliticaCookies"));
const CentralAtendimento = lazy(() => import("./pages/CentralAtendimento"));
const PrazoEntrega = lazy(() => import("./pages/PrazoEntrega"));
const RastreamentoPedido = lazy(() => import("./pages/RastreamentoPedido"));
const Obrigado = lazy(() => import("./pages/Obrigado"));

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

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { ProductProvider } from "@/contexts/ProductContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ScrollToTop } from "./components/ScrollToTop";
import TikTokTracking from "./components/TikTokTracking";
import ConsentBanner from "./components/ConsentBanner";
import Index from "./pages/Index";
import Produto from "./pages/Produto";
import MinhaConta from "./pages/MinhaConta";
import Carrinho from "./pages/Carrinho";
import FinalizarCompra from "./pages/FinalizarCompra";
import AdicionarEndereco from "./pages/AdicionarEndereco";
import PagamentoPix from "./pages/PagamentoPix";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import SobreNos from "./pages/SobreNos";
import QuemSomos from "./pages/QuemSomos";
import PoliticaPrivacidade from "./pages/PoliticaPrivacidade";
import TermosCondicoes from "./pages/TermosCondicoes";
import PoliticaTrocas from "./pages/PoliticaTrocas";
import PoliticaReembolso from "./pages/PoliticaReembolso";
import PoliticaEnvio from "./pages/PoliticaEnvio";
import PoliticaCookies from "./pages/PoliticaCookies";
import CentralAtendimento from "./pages/CentralAtendimento";
import PrazoEntrega from "./pages/PrazoEntrega";
import RastreamentoPedido from "./pages/RastreamentoPedido";
import Obrigado from "./pages/Obrigado";

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
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/produto" element={<Produto />} />
            <Route path="/minha-conta" element={<MinhaConta />} />
            <Route path="/carrinho" element={<Carrinho />} />
            <Route path="/finalizar-compra" element={<FinalizarCompra />} />
            <Route path="/adicionar-endereco" element={<AdicionarEndereco />} />
            <Route path="/pagamento-pix" element={<PagamentoPix />} />
            <Route path="/obrigado" element={<Obrigado />} />
            <Route path="/escala" element={<AdminDashboard />} />
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
        </BrowserRouter>
      </ProductProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

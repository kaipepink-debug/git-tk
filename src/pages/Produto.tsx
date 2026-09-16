/**
 * @file Produto.tsx
 * @description Página principal de visualização de produto, integrando diversos componentes de UI e trackers.
 */

import { useState, useEffect } from "react";
import TopBar from "@/components/TopBar";
import ImageCarousel from "@/components/ImageCarousel";
import FlashSaleTimer from "@/components/FlashSaleTimer";
import ProductInfo from "@/components/ProductInfo";
import ProductDescription from "@/components/ProductDescription";
import StoreInfo from "@/components/StoreInfo";
import ReviewsSection from "@/components/ReviewsSection";
import Footer from "@/components/Footer";
import BottomBar from "@/components/BottomBar";
import PreSell from "@/components/PreSell";
import ExitIntentPopup from "@/components/ExitIntentPopup";

import { useSessionTracker } from "@/hooks/useSessionTracker";
import { useProduct } from "@/contexts/ProductContext";
import { useAnalyticsTracker } from "@/hooks/useAnalyticsTracker";
import { supabase } from "@/integrations/supabase/client";
import { trackViewContent } from "@/lib/tracking/tiktok";

/**
 * Componente principal da página de produto.
 * 
 * @returns {JSX.Element} A estrutura completa da página de produto, incluindo carrossel, informações e seções de prova social.
 * @description Gerencia o estado de pré-venda (PreSell), rastreamento de sessão e pixels de marketing.
 */
const Produto = () => {
  // Estado para controlar se a pré-venda foi desbloqueada pelo usuário através do sessionStorage
  const [unlocked, setUnlocked] = useState(() => {
    return sessionStorage.getItem("presell_unlocked") === "true";
  });
  
  // Estado que armazena se a funcionalidade de pré-venda está ativa nas configurações do banco de dados
  const [presellEnabled, setPresellEnabled] = useState<boolean | null>(null);

  // Dados do produto usados no evento de visualização de conteúdo
  const { product, price } = useProduct();

  useEffect(() => {
    /**
     * Carrega as configurações do site assincronamente para verificar o status da pré-venda.
     */
    const load = async () => {
      // BUGFIX: .single() lança erro quando a chave 'presell_enabled' não existe.
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "presell_enabled")
        .maybeSingle();
      setPresellEnabled(data?.value === "true");
    };
    load();
  }, []);

  /**
   * Função chamada para liberar o acesso ao produto após interação com o componente PreSell.
   */
  const handleUnlock = () => {
    sessionStorage.setItem("presell_unlocked", "true");
    setUnlocked(true);
  };

  // Lógica para decidir se deve exibir a interface de pré-venda ou o produto direto
  const showPresell = presellEnabled === true && !unlocked;

  /**
   * ViewContent: disparado quando a oferta é realmente exibida (não na pré-venda)
   * e o preço já foi carregado. Protegido contra duplicidade pelo event_id.
   */
  useEffect(() => {
    if (showPresell) return;
    if (!product?.id || !(price > 0)) return;
    void trackViewContent({ contentId: product.id, contentName: product.title, value: price });
  }, [showPresell, product?.id, product?.title, price]);

  // Trackers de análise de tráfego
  useSessionTracker(showPresell ? "/produto/presell" : "/produto");
  useAnalyticsTracker(showPresell ? "/produto/presell" : "/produto");

  return (
    <>
      {showPresell && <PreSell onUnlock={handleUnlock} />}
      <ExitIntentPopup />
      <div className="min-h-screen bg-secondary max-w-lg mx-auto pb-20">
        <TopBar />
        <ImageCarousel />
        <FlashSaleTimer />
        <ProductInfo />
        <ProductDescription />
        <StoreInfo />
        <ReviewsSection />
        <Footer />
        <BottomBar />
      </div>
    </>
  );
};

export default Produto;

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
import { useTikTokPixel } from "@/hooks/useTikTokPixel";
import { useAnalyticsTracker } from "@/hooks/useAnalyticsTracker";
import { supabase } from "@/integrations/supabase/client";

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

  useEffect(() => {
    /**
     * Carrega as configurações do site assincronamente para verificar o status da pré-venda.
     */
    const load = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "presell_enabled")
        .single();
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

  // Trackers de análise de tráfego
  useSessionTracker(showPresell ? "/produto/presell" : "/produto");
  useTikTokPixel();
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

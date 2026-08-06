/**
 * @file Produto.tsx
 * @description Página principal de visualização de produto, integrando diversos componentes de UI e trackers.
 */

import { useState, useEffect } from "react";
import TopBar from "@/components/TopBar";
import ImageCarousel from "@/components/ImageCarousel";
import ProductInfo from "@/components/ProductInfo";
import ProductDescription from "@/components/ProductDescription";
import StoreInfo from "@/components/StoreInfo";
import ReviewsSection from "@/components/ReviewsSection";
import Footer from "@/components/Footer";
import BottomBar from "@/components/BottomBar";
import PreSell from "@/components/PreSell";
import ExitIntentPopup from "@/components/ExitIntentPopup";
import { SEO } from "@/components/SEO";

import { useSessionTracker } from "@/hooks/useSessionTracker";
import { useTikTokPixel, trackTikTokEvent } from "@/hooks/useTikTokPixel";
import { useAnalyticsTracker } from "@/hooks/useAnalyticsTracker";
import { useProduct } from "@/contexts/ProductContext";
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

  // Trackers de análise de tráfego
  useSessionTracker(showPresell ? "/produto/presell" : "/produto");
  useTikTokPixel();
  useAnalyticsTracker(showPresell ? "/produto/presell" : "/produto");

  // Evento ViewContent do TikTok quando o produto é exibido (após a pré-venda)
  const { product, price } = useProduct();
  useEffect(() => {
    if (showPresell || !product.id) return;
    trackTikTokEvent("ViewContent", {
      contents: [{
        content_id: product.id,
        content_type: "product",
        content_name: product.title || "Produto",
        quantity: 1,
        price,
      }],
      currency: "BRL",
      value: price,
    });
  }, [showPresell, product.id, product.title, price]);


  return (
    <>
      <SEO 
        title={product.title}
        description={product.description ? product.description.substring(0, 160) + "..." : "Confira o novo Chunta 6.0 na Chiqueb Loja."}
        image={product.images?.[0]}
      />
      {showPresell && <PreSell onUnlock={handleUnlock} />}
      <ExitIntentPopup />
      <div className="min-h-screen bg-background pb-28 lg:pb-0">
        <TopBar />

        <div className="max-w-6xl mx-auto px-0 sm:px-4 py-0 sm:py-6 lg:py-10">
          {/* Bloco principal do produto: galeria + informações */}
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            <ImageCarousel />
            <ProductInfo />
          </div>

          {/* Seções de conteúdo complementar */}
          <ProductDescription />
          <StoreInfo />
          <ReviewsSection />
        </div>

        <Footer />
        <BottomBar />
      </div>
    </>
  );
};

export default Produto;

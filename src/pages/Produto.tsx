/**
 * @file Produto.tsx
 * @description Página principal de visualização de produto, integrando diversos componentes de UI e trackers.
 */

import { useState, useEffect } from "react";
import { prefetchPage } from "@/lib/prefetch";
import { prefetchBumpImages } from "@/lib/orderBumps";
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

import { useProduct } from "@/contexts/ProductContext";
import { PRESELL } from "@/data/storeContent";
import { trackViewContent } from "@/lib/tracking/tiktok";


/**
 * Componente principal da página de produto.
 * 
 * @returns {JSX.Element} A estrutura completa da página de produto, incluindo carrossel, informações e seções de prova social.
 * @description Gerencia o estado de pré-venda (PreSell), rastreamento de sessão e pixels de marketing.
 */
const Produto = () => {
  useEffect(() => { prefetchPage("carrinho"); prefetchPage("checkout"); }, []);
  useEffect(() => {
    if (PRESELL.enabled) return;
    const hero = document.querySelector<HTMLImageElement>('img[fetchpriority="high"][alt$=" - imagem 1"]');
    if (!hero) return;

    let idleId: number | undefined;
    let timerId: number | undefined;
    const prefetch = () => prefetchBumpImages();
    const schedule = () => {
      if ("requestIdleCallback" in window) {
        idleId = window.requestIdleCallback(prefetch, { timeout: 5000 });
      } else {
        timerId = setTimeout(prefetch, 1500);
      }
    };
    if (hero.complete && hero.naturalWidth > 0) schedule();
    else hero.addEventListener("load", schedule, { once: true });

    return () => {
      hero.removeEventListener("load", schedule);
      if (idleId !== undefined) window.cancelIdleCallback(idleId);
      if (timerId !== undefined) window.clearTimeout(timerId);
    };
  }, []);
  // Estado para controlar se a pré-venda foi desbloqueada pelo usuário através do sessionStorage
  const [unlocked, setUnlocked] = useState(() => {
    return sessionStorage.getItem("presell_unlocked") === "true";
  });
  
  // Pré-venda configurada localmente
  const presellEnabled = PRESELL.enabled;

  // Dados do produto usados no evento de visualização de conteúdo
  const { product, price } = useProduct();

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

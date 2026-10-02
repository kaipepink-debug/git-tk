/**
 * @file Buggy.tsx
 * @description Página do buggy elétrico (/buggy). Mesma vitrine do produto
 * principal, sem o que só faz sentido lá: pré-venda, cronômetro, avaliações e
 * oferta de saída.
 */

import { useEffect } from "react";
import { prefetchPage } from "@/lib/prefetch";
import TopBar from "@/components/TopBar";
import ImageCarousel from "@/components/ImageCarousel";
import PriceBanner from "@/components/PriceBanner";
import ProductInfo from "@/components/ProductInfo";
import ProductDescription from "@/components/ProductDescription";
import StoreInfo from "@/components/StoreInfo";
import Footer from "@/components/Footer";
import BottomBar from "@/components/BottomBar";
import { useProduct } from "@/contexts/ProductContext";

const Buggy = () => {
  const { setActiveSlug, product } = useProduct();
  useEffect(() => { setActiveSlug("buggy"); }, [setActiveSlug]);
  useEffect(() => {
    const antes = document.title;
    document.title = "Monster Tools - Buggy Elétrico Off-Road 2000W";
    return () => { document.title = antes; };
  }, []);
  useEffect(() => { prefetchPage("carrinho"); prefetchPage("checkout"); }, []);

  // Até o contexto trocar de produto, não desenha o anterior.
  if (product.slug !== "buggy") return <div className="min-h-screen bg-secondary" />;

  return (
    <div className="min-h-screen bg-secondary max-w-lg mx-auto pb-20">
      <TopBar />
      <ImageCarousel />
      <PriceBanner />
      <ProductInfo />
      <ProductDescription />
      <StoreInfo />
      <Footer />
      <BottomBar />
    </div>
  );
};

export default Buggy;

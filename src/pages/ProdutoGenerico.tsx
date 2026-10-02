/**
 * @file ProdutoGenerico.tsx
 * @description Página de qualquer produto criado pelo painel (/p/:slug) — e do
 * buggy, em /buggy. Mesma vitrine do produto principal, sem o que só existe lá:
 * pré-venda, cronômetro, avaliações e oferta de saída.
 */

import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { prefetchPage } from "@/lib/prefetch";
import TopBar from "@/components/TopBar";
import ImageCarousel from "@/components/ImageCarousel";
import PriceBanner from "@/components/PriceBanner";
import ProductInfo from "@/components/ProductInfo";
import ProductDescription from "@/components/ProductDescription";
import StoreInfo from "@/components/StoreInfo";
import Footer from "@/components/Footer";
import BottomBar from "@/components/BottomBar";
import NotFound from "@/pages/NotFound";
import { useProduct } from "@/contexts/ProductContext";
import { STORE_NAME } from "@/data/storeContent";

const ProdutoGenerico = ({ slug: fixo }: { slug?: string }) => {
  const { slug: daRota } = useParams();
  const slug = fixo ?? daRota ?? "";
  const { setActiveSlug, product, loading, encontrado } = useProduct();

  useEffect(() => { setActiveSlug(slug); }, [setActiveSlug, slug]);
  useEffect(() => { prefetchPage("carrinho"); prefetchPage("checkout"); }, []);
  useEffect(() => {
    if (product.slug !== slug) return;
    const antes = document.title;
    document.title = `${STORE_NAME} - ${product.title.split("—")[0].trim()}`;
    return () => { document.title = antes; };
  }, [product.slug, product.title, slug]);

  // Enquanto o catálogo não chega, ou o contexto ainda aponta para o anterior,
  // não desenha nada — para não mostrar o preço de outro produto.
  if (loading || (encontrado && product.slug !== slug)) return <div className="min-h-screen bg-secondary" />;
  if (!encontrado) return <NotFound />;

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

export default ProdutoGenerico;

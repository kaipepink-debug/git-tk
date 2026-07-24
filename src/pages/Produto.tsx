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

const Produto = () => {
  const [unlocked, setUnlocked] = useState(() => {
    return sessionStorage.getItem("presell_unlocked") === "true";
  });
  const [presellEnabled, setPresellEnabled] = useState<boolean | null>(null);

  useEffect(() => {
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

  const handleUnlock = () => {
    sessionStorage.setItem("presell_unlocked", "true");
    setUnlocked(true);
  };

  const showPresell = presellEnabled === true && !unlocked;

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

import { useState, useRef, useEffect, useCallback } from "react";
import { useProduct } from "@/contexts/ProductContext";
import { supabase } from "@/integrations/supabase/client";
import { ChevronRight } from "lucide-react";

interface PreSellConfig {
  buttonText: string;
  instructionText: string;
  buttonColor: string;
}

const PreSell = ({ onUnlock }: { onUnlock: () => void }) => {
  const { product } = useProduct();
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const unlocked = useRef(false);

  const [config, setConfig] = useState<PreSellConfig>({
    buttonText: "Deslize para obter a oferta →",
    instructionText: "Arraste o botão para a direita para liberar a oferta",
    buttonColor: "#FE2C55",
  });

  const [info, setInfo] = useState({
    company_name: "JP VARIEDADES LTDA",
    cnpj: "64.482.958/0001-00",
    contact_email: "contato@JPvariedadesltda.com.br",
    contact_phone: "(89) 98102-5918",
    company_address: "",
  });

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", [
          "company_name", "cnpj", "contact_email", "contact_phone", "company_address",
          "presell_button_text", "presell_instruction_text", "presell_button_color",
        ]);
      if (data) {
        const map: Record<string, string> = {};
        data.forEach(r => { map[r.key] = r.value; });
        setInfo(prev => ({ ...prev, ...map }));
        setConfig(prev => ({
          buttonText: map.presell_button_text || prev.buttonText,
          instructionText: map.presell_instruction_text || prev.instructionText,
          buttonColor: map.presell_button_color || prev.buttonColor,
        }));
      }
    };
    load();
  }, []);

  const getTrackWidth = () => {
    if (!trackRef.current) return 1;
    return trackRef.current.offsetWidth - 48;
  };

  const handleStart = useCallback((clientX: number) => {
    if (unlocked.current) return;
    setIsDragging(true);
    startXRef.current = clientX;
  }, []);

  const handleMove = useCallback((clientX: number) => {
    if (!isDragging || unlocked.current) return;
    const delta = clientX - startXRef.current;
    const maxTravel = getTrackWidth();
    const pct = Math.min(Math.max((delta / maxTravel) * 100, 0), 100);
    setProgress(pct);

    if (pct >= 97) {
      unlocked.current = true;
      setProgress(100);
      setIsDragging(false);
      const sessionId = sessionStorage.getItem("session_id") || "unknown";
      supabase.from("analytics_events").insert({
        session_id: sessionId,
        event_type: "presell_unlocked",
        page: "/produto",
      }).then(() => {});
      setTimeout(() => onUnlock(), 300);
    }
  }, [isDragging, onUnlock]);

  const handleEnd = useCallback(() => {
    if (unlocked.current) return;
    setIsDragging(false);
    setProgress(0);
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const onMouseUp = () => handleEnd();
    if (isDragging) {
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [isDragging, handleMove, handleEnd]);

  const [hintOffset, setHintOffset] = useState(0);
  useEffect(() => {
    if (unlocked.current || isDragging || progress > 0) return;
    const interval = setInterval(() => {
      setHintOffset(30);
      setTimeout(() => setHintOffset(0), 400);
    }, 2500);
    const initial = setTimeout(() => {
      setHintOffset(30);
      setTimeout(() => setHintOffset(0), 400);
    }, 1000);
    return () => { clearInterval(interval); clearTimeout(initial); };
  }, [isDragging, progress]);

  const mainImage = product.images.length > 0 ? product.images[0] : "/placeholder.svg";
  const thumbOffset = (progress / 100) * getTrackWidth();

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center min-h-screen overflow-auto"
      style={{ background: "#fff" }}>

      <div className="flex flex-col items-center w-full max-w-lg mx-auto px-6 pt-16">
        <div className="w-full max-w-[260px] aspect-square rounded-xl overflow-hidden mb-4">
          <img src={mainImage} alt={product.title} className="w-full h-full object-contain" />
        </div>

        <h1 className="text-base font-bold text-center leading-snug px-4 mb-8" style={{ color: "#333" }}>
          {product.title}
        </h1>

        <div
          ref={trackRef}
          className="relative w-full h-14 rounded-full overflow-hidden select-none touch-none"
          style={{ background: config.buttonColor }}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              background: "rgba(0,0,0,0.12)",
              width: `${Math.min(progress + 12, 100)}%`,
              transition: !isDragging ? "width 0.3s ease" : "none",
            }}
          />
          <span
            className="absolute inset-0 flex items-center justify-center text-sm font-medium pointer-events-none"
            style={{
              color: "rgba(255,255,255,0.9)",
              opacity: 1 - progress / 80,
              transition: "opacity 0.2s",
            }}
          >
            {config.buttonText}
          </span>
          <div
            className="absolute top-1 left-1 w-12 h-12 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing shadow-lg"
            style={{
              background: "#fff",
              transform: `translateX(${thumbOffset > 0 ? thumbOffset : hintOffset}px)`,
              transition: !isDragging ? "transform 0.4s ease" : "none",
            }}
            onMouseDown={(e) => { e.preventDefault(); handleStart(e.clientX); }}
            onTouchStart={(e) => handleStart(e.touches[0].clientX)}
            onTouchMove={(e) => handleMove(e.touches[0].clientX)}
            onTouchEnd={handleEnd}
          >
            <ChevronRight className="w-6 h-6" style={{ color: config.buttonColor }} />
          </div>
        </div>

        <p className="mt-3 text-xs text-center" style={{ color: "#999" }}>
          {config.instructionText}
        </p>
      </div>

      <div className="mt-auto w-full max-w-lg mx-auto px-8 pb-6 pt-4">
        <div className="text-center space-y-0.5">
          <p className="text-[10px]" style={{ color: "#999" }}>{info.company_name}</p>
          <p className="text-[10px]" style={{ color: "#999" }}>CNPJ: {info.cnpj}</p>
          {info.company_address && (
            <p className="text-[10px]" style={{ color: "#999" }}>{info.company_address}</p>
          )}
          <p className="text-[10px]" style={{ color: "#999" }}>{info.contact_email}</p>
        </div>
      </div>
    </div>
  );
};

export default PreSell;

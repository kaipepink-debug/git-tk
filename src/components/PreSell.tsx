import { useState, useRef, useEffect, useCallback } from "react";
import { useProduct } from "@/contexts/ProductContext";
import { supabase } from "@/integrations/supabase/client";
import { COMPANY_INFO, PRESELL } from "@/data/storeContent";
import { ChevronRight } from "lucide-react";

/**
 * Interface de configuração para o componente de Pré-venda.
 */
interface PreSellConfig {
  buttonText: string;
  instructionText: string;
  buttonColor: string;
}

/**
 * Componente de Pré-venda (Pre-Sell) com mecânica de "Deslize para liberar".
 * Utilizado para aumentar o engajamento e a retenção antes de mostrar o produto principal.
 * 
 * @param props.onUnlock Função chamada quando o usuário completa o desafio de deslizar.
 */
const PreSell = ({ onUnlock }: { onUnlock: () => void }) => {
  const { product } = useProduct();
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const unlocked = useRef(false);

  const config: PreSellConfig = { buttonText: PRESELL.buttonText, instructionText: PRESELL.instructionText, buttonColor: PRESELL.buttonColor };
  const info = COMPANY_INFO;

  /** Retorna a largura útil do trilho para cálculo de porcentagem */
  const getTrackWidth = () => {
    if (!trackRef.current) return 1;
    return trackRef.current.offsetWidth - 48;
  };

  /** Inicia o arrasto (mouse ou touch) */
  const handleStart = useCallback((clientX: number) => {
    if (unlocked.current) return;
    setIsDragging(true);
    startXRef.current = clientX;
  }, []);

  /** Processa a movimentação do arrasto e verifica se atingiu o fim */
  const handleMove = useCallback((clientX: number) => {
    if (!isDragging || unlocked.current) return;
    const delta = clientX - startXRef.current;
    const maxTravel = getTrackWidth();
    const pct = Math.min(Math.max((delta / maxTravel) * 100, 0), 100);
    setProgress(pct);

    // Se o progresso chegar a 97%, desbloqueia a oferta
    if (pct >= 97) {
      unlocked.current = true;
      setProgress(100);
      setIsDragging(false);
      
      // Envia evento de analytics
      const sessionId = sessionStorage.getItem("session_id") || "unknown";
      supabase.from("analytics_events").insert({
        session_id: sessionId,
        event_type: "presell_unlocked",
        page: "/produto",
      }).then(() => {});
      
      // Notifica o componente pai após uma pequena pausa
      setTimeout(() => onUnlock(), 300);
    }
  }, [isDragging, onUnlock]);

  /** Finaliza o arrasto e reseta o progresso se não foi desbloqueado */
  const handleEnd = useCallback(() => {
    if (unlocked.current) return;
    setIsDragging(false);
    setProgress(0);
  }, []);

  // Listeners globais para arrasto com mouse
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

  // Efeito visual de "pulo" no botão para chamar atenção
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
        {/* Imagem do produto em destaque */}
        <div className="w-full max-w-[260px] aspect-square rounded-xl overflow-hidden mb-4">
          <img src={mainImage} alt={product.title} className="w-full h-full object-contain" />
        </div>

        <h1 className="text-base font-bold text-center leading-snug px-4 mb-8" style={{ color: "#333" }}>
          {product.title}
        </h1>

        {/* Trilho de deslize */}
        <div
          ref={trackRef}
          className="relative w-full h-14 rounded-full overflow-hidden select-none touch-none"
          style={{ background: config.buttonColor }}
        >
          {/* Overlay de preenchimento */}
          <div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              background: "rgba(0,0,0,0.12)",
              width: `${Math.min(progress + 12, 100)}%`,
              transition: !isDragging ? "width 0.3s ease" : "none",
            }}
          />
          {/* Texto de instrução que some conforme o progresso */}
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
          {/* Botão de arrasto (Thumb) */}
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

      {/* Informações da empresa no rodapé da pré-venda */}
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

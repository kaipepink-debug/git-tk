import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useProduct } from "@/contexts/ProductContext";

/**
 * Componente de carrossel de imagens para visualização do produto.
 * Suporta navegação por botões, toque (swipe que acompanha o dedo) e indicador de posição.
 */
const ImageCarousel = () => {
  const { product } = useProduct();
  const images = product.images.length > 0 ? product.images : ["/placeholder.svg"];
  const [current, setCurrent] = useState(0);
  const [drag, setDrag] = useState(0);
  const touch = useRef<{ x: number; y: number; axis: "x" | "y" | null; w: number } | null>(null);

  /** Avança para a próxima imagem */
  const next = () => setCurrent((c) => (c === images.length - 1 ? 0 : c + 1));
  
  /** Volta para a imagem anterior */
  const prev = () => setCurrent((c) => (c === 0 ? images.length - 1 : c - 1));

  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length > 1) { touch.current = null; setDrag(0); return; }
    const t = e.touches[0];
    touch.current = { x: t.clientX, y: t.clientY, axis: null, w: e.currentTarget.clientWidth || 1 };
  };

  const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const s = touch.current;
    if (!s || e.touches.length > 1) return;
    const dx = e.touches[0].clientX - s.x;
    const dy = e.touches[0].clientY - s.y;
    // Decide a direção só depois de um pequeno movimento (evita toques acidentais)
    if (!s.axis) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      s.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
    }
    if (s.axis === "x") setDrag(dx);
  };

  const onTouchEnd = () => {
    const s = touch.current;
    touch.current = null;
    if (s?.axis === "x") {
      const threshold = Math.min(60, s.w * 0.18);
      if (drag < -threshold) next();
      else if (drag > threshold) prev();
    }
    setDrag(0);
  };

  return (
    <div className="relative w-full aspect-square bg-background overflow-hidden">
      {/* Container das imagens com transição suave */}
      <div
        className={`flex h-full ${drag ? "" : "transition-transform duration-300"}`}
        style={{ transform: `translateX(calc(-${current * 100}% + ${drag}px))`, touchAction: "pan-y pinch-zoom" }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
      >
        {images.map((src, i) => (
          <img
            key={i}
            src={src}
            alt={`${product.title} - imagem ${i + 1}`}
            className="w-full h-full object-contain flex-shrink-0"
            loading={i === 0 ? "eager" : "lazy"}
            decoding={i === 0 ? "sync" : "async"}
            fetchPriority={i === 0 ? "high" : "low"}
            width={500}
            height={500}
          />
        ))}
      </div>

      {/* Botões de navegação lateral */}
      <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 bg-foreground/20 rounded-full p-1">
        <ChevronLeft className="w-5 h-5 text-background" />
      </button>
      <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 bg-foreground/20 rounded-full p-1">
        <ChevronRight className="w-5 h-5 text-background" />
      </button>

      {/* Indicador numérico (ex: 1 / 5) */}
      <div className="absolute bottom-3 right-3 bg-foreground/60 text-background text-xs px-2 py-0.5 rounded-full">
        {current + 1} / {images.length}
      </div>
    </div>
  );
};

export default ImageCarousel;

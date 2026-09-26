import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useProduct } from "@/contexts/ProductContext";

/**
 * Carrossel de imagens do produto.
 * - O arrasto move a faixa direto no DOM (translate3d + requestAnimationFrame), sem re-render a cada pixel.
 * - Só a imagem atual e as vizinhas (anterior/próxima) são baixadas e decodificadas antes do gesto.
 */
const ImageCarousel = () => {
  const { product } = useProduct();
  const images = product.images.length > 0 ? product.images : ["/placeholder.svg"];
  const n = images.length;
  const [current, setCurrent] = useState(0);
  const [firstLoaded, setFirstLoaded] = useState(false);
  const [ready, setReady] = useState<Set<number>>(() => new Set([0]));

  const trackRef = useRef<HTMLDivElement>(null);
  const currentRef = useRef(0);
  const frame = useRef(0);
  const touch = useRef<{ x: number; y: number; dx: number; axis: "x" | "y" | null; w: number } | null>(null);

  /** Posiciona a faixa (com ou sem animação) sem passar pelo React. */
  const place = useCallback((index: number, offset: number, animate: boolean) => {
    const el = trackRef.current;
    if (!el) return;
    el.style.transition = animate ? "transform 300ms cubic-bezier(0.22, 0.61, 0.36, 1)" : "none";
    el.style.transform = `translate3d(calc(${-index * 100}% + ${offset}px), 0, 0)`;
  }, []);

  const goTo = useCallback((index: number) => {
    const i = (index + n) % n;
    currentRef.current = i;
    place(i, 0, true);
    setCurrent(i);
  }, [n, place]);

  const next = () => goTo(currentRef.current + 1);
  const prev = () => goTo(currentRef.current - 1);

  // Pré-carrega e decodifica anterior + próxima (depois que a primeira foto terminou de carregar)
  useEffect(() => {
    if (!firstLoaded || n < 2) return;
    const want = [current, (current + 1) % n, (current - 1 + n) % n];
    want.forEach((i) => {
      if (ready.has(i)) return;
      const img = new Image();
      img.src = images[i];
      const done = () => setReady((s) => (s.has(i) ? s : new Set(s).add(i)));
      (img.decode ? img.decode() : Promise.resolve()).then(done, done);
    });
  }, [current, firstLoaded, n, images, ready]);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length > 1) {
      touch.current = null;
      place(currentRef.current, 0, true);
      return;
    }
    const t = e.touches[0];
    touch.current = { x: t.clientX, y: t.clientY, dx: 0, axis: null, w: e.currentTarget.clientWidth || 1 };
  };

  const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const s = touch.current;
    if (!s || e.touches.length > 1) return;
    const dx = e.touches[0].clientX - s.x;
    const dy = e.touches[0].clientY - s.y;
    // Só decide a direção depois de um pequeno movimento (evita toques acidentais)
    if (!s.axis) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      s.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
    }
    if (s.axis !== "x") return;
    s.dx = dx;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => place(currentRef.current, s.dx, false));
  };

  const onTouchEnd = () => {
    const s = touch.current;
    touch.current = null;
    cancelAnimationFrame(frame.current);
    if (s?.axis !== "x") return;
    const threshold = Math.min(60, s.w * 0.18);
    if (s.dx < -threshold) next();
    else if (s.dx > threshold) prev();
    else place(currentRef.current, 0, true);
  };

  return (
    <div className="relative w-full aspect-square bg-background overflow-hidden">
      {/* Faixa de imagens: movida por translate3d (GPU) */}
      <div
        ref={trackRef}
        className="flex h-full will-change-transform"
        style={{ transform: "translate3d(0, 0, 0)", touchAction: "pan-y pinch-zoom" }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
      >
        {images.map((src, i) => (
          <div key={i} className="w-full h-full flex-shrink-0">
            {(i === 0 || ready.has(i)) && (
              <img
                src={src}
                alt={`${product.title} - imagem ${i + 1}`}
                className="w-full h-full object-contain select-none"
                draggable={false}
                loading={i === 0 ? "eager" : "lazy"}
                decoding={i === 0 ? "sync" : "async"}
                fetchPriority={i === 0 ? "high" : "low"}
                width={500}
                height={500}
                onLoad={i === 0 ? () => setFirstLoaded(true) : undefined}
              />
            )}
          </div>
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
        {current + 1} / {n}
      </div>
    </div>
  );
};

export default ImageCarousel;

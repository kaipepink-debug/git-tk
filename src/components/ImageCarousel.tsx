import { useState } from "react";
import { useProduct } from "@/contexts/ProductContext";

/**
 * Componente de galeria de imagens do produto.
 * No desktop exibe uma coluna vertical de miniaturas ao lado de uma imagem grande;
 * no mobile funciona como um carrossel deslizável (swipe) com miniaturas abaixo.
 */
const ImageCarousel = () => {
  const { product } = useProduct();
  const images = product.images.length > 0 ? product.images : ["/placeholder.svg"];
  const [current, setCurrent] = useState(0);
  const [touchStart, setTouchStart] = useState(0);

  /** Avança para a próxima imagem */
  const next = () => setCurrent((c) => (c === images.length - 1 ? 0 : c + 1));

  /** Volta para a imagem anterior */
  const prev = () => setCurrent((c) => (c === 0 ? images.length - 1 : c - 1));

  return (
    <div className="flex flex-col-reverse lg:flex-row gap-3">
      {/* Coluna de miniaturas (vertical no desktop, horizontal no mobile) */}
      {images.length > 1 && (
        <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible lg:w-20">
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`flex-shrink-0 w-16 h-16 lg:w-20 lg:h-20 rounded-lg overflow-hidden border-2 transition-all ${
                current === i ? "border-primary" : "border-border"
              }`}
            >
              <img src={src} alt={`Miniatura ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      )}

      {/* Imagem principal */}
      <div className="relative flex-1 bg-card rounded-2xl overflow-hidden aspect-square">
        {/* Selo de últimas unidades */}
        <div className="absolute top-3 left-3 z-10 bg-ink text-ink-foreground text-[10px] font-semibold uppercase tracking-wide px-3 py-1 rounded-full">
          Últimas unidades
        </div>

        <div
          className="flex transition-transform duration-300 h-full"
          style={{ transform: `translateX(-${current * 100}%)` }}
          onTouchStart={(e) => setTouchStart(e.touches[0].clientX)}
          onTouchEnd={(e) => {
            const diff = touchStart - e.changedTouches[0].clientX;
            if (diff > 50) next();
            if (diff < -50) prev();
          }}
        >
          {images.map((src, i) => (
            <img
              key={i}
              src={src}
              alt={`${product.title} - imagem ${i + 1}`}
              className="w-full h-full object-contain flex-shrink-0 p-6"
              loading={i === 0 ? "eager" : "lazy"}
              decoding={i === 0 ? "sync" : "async"}
              fetchPriority={i === 0 ? "high" : "low"}
              width={600}
              height={600}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ImageCarousel;

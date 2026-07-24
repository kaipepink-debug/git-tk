import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useProduct } from "@/contexts/ProductContext";

const ImageCarousel = () => {
  const { product } = useProduct();
  const images = product.images.length > 0 ? product.images : ["/placeholder.svg"];
  const [current, setCurrent] = useState(0);
  const [touchStart, setTouchStart] = useState(0);

  const prev = () => setCurrent((c) => (c === 0 ? images.length - 1 : c - 1));
  const next = () => setCurrent((c) => (c === images.length - 1 ? 0 : c + 1));

  return (
    <div className="relative w-full aspect-square bg-background overflow-hidden">
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
            className="w-full h-full object-contain flex-shrink-0"
            loading={i === 0 ? "eager" : "lazy"}
            decoding={i === 0 ? "sync" : "async"}
            fetchPriority={i === 0 ? "high" : "low"}
            width={500}
            height={500}
          />
        ))}
      </div>

      <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 bg-foreground/20 rounded-full p-1">
        <ChevronLeft className="w-5 h-5 text-background" />
      </button>
      <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 bg-foreground/20 rounded-full p-1">
        <ChevronRight className="w-5 h-5 text-background" />
      </button>

      <div className="absolute bottom-3 right-3 bg-foreground/60 text-background text-xs px-2 py-0.5 rounded-full">
        {current + 1} / {images.length}
      </div>
    </div>
  );
};

export default ImageCarousel;

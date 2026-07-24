import { useState, useEffect } from "react";

const cache = new Map<string, string>();

export function useOptimizedImage(
  src: string,
  maxSize = 160,
  quality = 0.6
): string {
  const [optimized, setOptimized] = useState(() => cache.get(src) || src);

  useEffect(() => {
    if (!src || cache.has(src)) {
      if (cache.has(src)) setOptimized(cache.get(src)!);
      return;
    }

    // Skip data URLs that are already small
    if (src.startsWith("data:")) {
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        let w = img.naturalWidth;
        let h = img.naturalHeight;

        if (w > h) {
          if (w > maxSize) { h = Math.round(h * (maxSize / w)); w = maxSize; }
        } else {
          if (h > maxSize) { w = Math.round(w * (maxSize / h)); h = maxSize; }
        }

        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, w, h);

        canvas.toBlob(
          (blob) => {
            if (!blob) return;
            const url = URL.createObjectURL(blob);
            cache.set(src, url);
            setOptimized(url);
          },
          "image/webp",
          quality
        );
      } catch {
        // CORS or other error — keep original
      }
    };
    img.src = src;
  }, [src, maxSize, quality]);

  return optimized;
}

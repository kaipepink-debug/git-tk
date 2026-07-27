/**
 * @file useOptimizedImage.ts
 * @description Hook para otimização de imagens no lado do cliente. Redimensiona imagens e as converte
 * para o formato WebP usando o elemento Canvas, reduzindo o consumo de banda.
 */

import { useState, useEffect } from "react";

/** Cache global em memória para imagens já otimizadas (Original URL -> Optimized Data URL) */
const cache = new Map<string, string>();

/**
 * @hook useOptimizedImage
 * @description Recebe uma URL de imagem e retorna uma versão otimizada (WebP redimensionada).
 * @param {string} src URL original da imagem.
 * @param {number} maxSize Tamanho máximo (largura ou altura) da imagem otimizada. Padrão: 160px.
 * @param {number} quality Qualidade da compressão WebP (0 a 1). Padrão: 0.6.
 * @returns {string} URL da imagem (original ou otimizada via URL.createObjectURL).
 */
export function useOptimizedImage(
  src: string,
  maxSize = 160,
  quality = 0.6
): string {
  // Inicializa com o cache se disponível, ou a URL original
  const [optimized, setOptimized] = useState(() => cache.get(src) || src);

  useEffect(() => {
    // Se não há fonte ou já está no cache, atualiza o estado e sai
    if (!src || cache.has(src)) {
      if (cache.has(src)) setOptimized(cache.get(src)!);
      return;
    }

    // Ignora Data URLs que normalmente já são pequenos ou processados
    if (src.startsWith("data:")) {
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous"; // Necessário para ler dados de imagens de outros domínios via Canvas
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        let w = img.naturalWidth;
        let h = img.naturalHeight;

        // Mantém a proporção da imagem ao redimensionar
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

        // Converte o conteúdo do canvas para um Blob WebP
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
        // Em caso de erro (ex: CORS), mantém a imagem original
      }
    };
    img.src = src;
  }, [src, maxSize, quality]);

  return optimized;
}

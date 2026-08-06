import { Star, X, ChevronLeft, ChevronRight, Play, BadgeCheck } from "lucide-react";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useProduct } from "@/contexts/ProductContext";
import { supabase } from "@/integrations/supabase/client";

/** Lista de abreviações dos meses em português */
const months = ["jan.", "fev.", "mar.", "abr.", "mai.", "jun.", "jul.", "ago.", "set.", "out.", "nov.", "dez."];

/**
 * Formata uma data baseada em quantos dias atrás a avaliação foi feita.
 * @param daysAgo Quantidade de dias passados
 * @returns String formatada (ex: 12 jan. 2024)
 */
const formatDate = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return `${String(d.getDate()).padStart(2, "0")} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

/**
 * Verifica se uma URL aponta para um arquivo de vídeo.
 * @param url URL do arquivo
 */
const isVideo = (url: string) => /\.(mp4|webm|mov)$/i.test(url);

/** Interface para o objeto de avaliação do produto */
interface Review {
  id: string;
  reviewer_name: string;
  reviewer_initial: string;
  avatar_url: string | null;
  rating: number;
  review_text: string;
  photos: string[];
  days_ago: number;
}

const INITIAL_COUNT = 5;
const LOAD_MORE_COUNT = 10;

/**
 * Componente de Carrossel de Mídia em Tela Cheia.
 * Exibe fotos e vídeos das avaliações em um modal interativo.
 */
const MediaCarousel = ({
  items,
  startIndex,
  onClose,
}: {
  /** Lista de URLs de mídia */
  items: string[];
  /** Índice da mídia inicial */
  startIndex: number;
  /** Função para fechar o carrossel */
  onClose: () => void;
}) => {
  const [idx, setIdx] = useState(startIndex);

  const prev = useCallback(() => setIdx((i) => (i === 0 ? items.length - 1 : i - 1)), [items.length]);
  const next = useCallback(() => setIdx((i) => (i === items.length - 1 ? 0 : i + 1)), [items.length]);

  // Suporte a gestos de swipe
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = e.changedTouches[0].clientX - touchStart;
    if (Math.abs(diff) > 50) {
      diff > 0 ? prev() : next();
    }
    setTouchStart(null);
  };

  // Suporte a navegação por teclado
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, prev, next]);

  // Bloqueia o scroll do corpo da página quando o modal está aberto
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const current = items[idx];

  return (
    <div
      className="fixed inset-0 z-[9999] bg-ink/95 flex flex-col"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Cabeçalho do modal */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <span className="text-ink-foreground/70 text-sm">{idx + 1} / {items.length}</span>
        <button onClick={onClose} className="text-ink-foreground p-1">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Visualizador de mídia central */}
      <div className="flex-1 flex items-center justify-center relative min-h-0 px-2">
        {items.length > 1 && (
          <button onClick={prev} className="absolute left-2 z-10 text-ink-foreground/70 hover:text-ink-foreground p-1">
            <ChevronLeft className="w-8 h-8" />
          </button>
        )}

        {isVideo(current) ? (
          <video
            key={current}
            src={current}
            className="max-h-full max-w-full rounded-lg"
            controls
            autoPlay
            playsInline
            muted
          />
        ) : (
          <img
            key={current}
            src={current}
            alt=""
            className="max-h-full max-w-full object-contain rounded-lg"
          />
        )}

        {items.length > 1 && (
          <button onClick={next} className="absolute right-2 z-10 text-ink-foreground/70 hover:text-ink-foreground p-1">
            <ChevronRight className="w-8 h-8" />
          </button>
        )}
      </div>

      {/* Miniaturas de navegação rápida na parte inferior */}
      {items.length > 1 && (
        <div className="flex gap-2 justify-center py-3 px-4 overflow-x-auto shrink-0">
          {items.map((item, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className="w-12 h-12 rounded flex-shrink-0 overflow-hidden border-2 transition-all"
              style={{ borderColor: i === idx ? "hsl(var(--primary))" : "transparent", opacity: i === idx ? 1 : 0.5 }}
            >
              {isVideo(item) ? (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <Play className="w-4 h-4 text-ink-foreground" />
                </div>
              ) : (
                <img src={item} alt="" className="w-full h-full object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Componente de Seção de Avaliações.
 * Exibe a nota média, distribuição por estrelas e a lista de feedbacks dos clientes
 * com suporte a fotos, vídeos e paginação (carregar mais).
 */
const ReviewsSection = () => {
  const { product } = useProduct();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);
  const [loading, setLoading] = useState(true);
  const [carousel, setCarousel] = useState<{ items: string[]; index: number } | null>(null);

  // Carrega as avaliações do Supabase para o produto atual
  useEffect(() => {
    if (!product.id) return;
    const load = async () => {
      const { data } = await supabase
        .from("product_reviews")
        .select("*")
        .eq("product_id", product.id)
        .order("display_order", { ascending: true });
      if (data) {
        setReviews(data.map(r => ({
          ...r,
          photos: (r.photos as any) || [],
        })));
      }
      setLoading(false);
    };
    load();
  }, [product.id]);

  // Calcula a distribuição de notas (5 a 1 estrelas) para o gráfico de barras
  const distribution = useMemo(() => {
    const counts = [0, 0, 0, 0, 0];
    reviews.forEach((r) => {
      const idx = Math.min(5, Math.max(1, Math.round(r.rating))) - 1;
      counts[idx]++;
    });
    const max = Math.max(...counts, 1);
    return counts.map((c, i) => ({ star: i + 1, count: c, pct: (c / max) * 100 })).reverse();
  }, [reviews]);

  if (loading || reviews.length === 0) return null;

  const totalReviews = reviews.length;
  const displayTotal = product.rating_count || totalReviews;
  const visibleReviews = reviews.slice(0, visibleCount);
  const remaining = displayTotal - visibleCount;

  return (
    <>
      <section id="avaliacoes" className="border-t border-border py-10 scroll-mt-24 px-4 sm:px-0">
        <h2 className="text-2xl font-extrabold text-foreground mb-1">Avaliações</h2>
        <p className="text-sm text-muted-foreground mb-6">O que nossos clientes dizem</p>

        {/* Resumo geral: nota média e distribuição por estrelas */}
        <div className="grid sm:grid-cols-[auto_1fr] gap-6 items-center bg-muted rounded-2xl p-6 mb-8">
          <div className="text-center sm:border-r sm:border-border sm:pr-6">
            <div className="text-5xl font-extrabold text-foreground">{product.rating}</div>
            <div className="flex items-center justify-center gap-0.5 my-1">
              {Array.from({ length: 5 }).map((_, s) => (
                <Star key={s} className="w-4 h-4" style={{ fill: s < Math.round(product.rating) ? "hsl(var(--star))" : "transparent", color: "hsl(var(--star))" }} />
              ))}
            </div>
            <div className="text-xs text-muted-foreground">{displayTotal} avaliações</div>
          </div>
          <div className="space-y-1.5">
            {distribution.map((d) => (
              <div key={d.star} className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="w-3">{d.star}</span>
                <Star className="w-3 h-3 fill-star text-star flex-shrink-0" />
                <div className="flex-1 h-2 rounded-full bg-border overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${d.pct}%` }} />
                </div>
                <span className="w-6 text-right">{d.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Lista de avaliações individuais */}
        <div className="space-y-6">
          {visibleReviews.map((review) => (
            <div key={review.id} className="border-b border-border pb-6 last:border-0">
              {/* Autor da avaliação */}
              <div className="flex items-center gap-2 mb-2">
                {review.avatar_url ? (
                  <img src={review.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" loading="lazy" decoding="async" width={36} height={36} />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                    {review.reviewer_initial}
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-foreground">{review.reviewer_name}</span>
                    <span className="inline-flex items-center gap-0.5 text-[10px] text-primary font-medium">
                      <BadgeCheck className="w-3 h-3" /> Compra verificada
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">{formatDate(review.days_ago)}</div>
                </div>
              </div>
              {/* Estrelas da avaliação */}
              <div className="flex items-center gap-0.5 mb-1.5">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star
                    key={s}
                    className="w-3.5 h-3.5"
                    style={{
                      fill: s < review.rating ? "hsl(var(--star))" : "transparent",
                      color: s < review.rating ? "hsl(var(--star))" : "hsl(var(--muted-foreground))",
                    }}
                  />
                ))}
              </div>
              {/* Texto da avaliação */}
              {review.review_text && (
                <p className="text-sm text-foreground/80 mb-2">{review.review_text}</p>
              )}
              {/* Fotos e vídeos anexados pelo cliente */}
              {review.photos.length > 0 && (
                <div className="flex gap-2 overflow-x-auto">
                  {review.photos.map((media, j) => (
                    <button
                      key={j}
                      onClick={() => setCarousel({ items: review.photos, index: j })}
                      className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0"
                    >
                      {isVideo(media) ? (
                        <>
                          <video src={media} className="w-full h-full object-cover" muted playsInline preload="metadata" width={80} height={80} />
                          <div className="absolute inset-0 flex items-center justify-center bg-ink/30">
                            <Play className="w-6 h-6 text-ink-foreground fill-ink-foreground" />
                          </div>
                        </>
                      ) : (
                        <img src={media} alt="Foto da avaliação" className="w-full h-full object-cover" loading="lazy" decoding="async" width={80} height={80} />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Botão para carregar mais avaliações */}
        {remaining > 0 && (
          <button
            onClick={() => setVisibleCount((prev) => Math.min(prev + LOAD_MORE_COUNT, totalReviews))}
            className="w-full text-center text-sm text-primary font-semibold mt-4 py-2 border border-primary rounded-full hover:bg-primary/5 transition-colors"
          >
            Ver mais avaliações ({displayTotal - visibleCount} restantes)
          </button>
        )}
      </section>

      {/* Modal de visualização de mídia (Carousel) */}
      {carousel && (
        <MediaCarousel
          items={carousel.items}
          startIndex={carousel.index}
          onClose={() => setCarousel(null)}
        />
      )}
    </>
  );
};

export default ReviewsSection;

import { Star, X, ChevronLeft, ChevronRight, Play } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useProduct } from "@/contexts/ProductContext";
import { supabase } from "@/integrations/supabase/client";

const months = ["jan.", "fev.", "mar.", "abr.", "mai.", "jun.", "jul.", "ago.", "set.", "out.", "nov.", "dez."];

const formatDate = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return `${String(d.getDate()).padStart(2, "0")} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

const isVideo = (url: string) => /\.(mp4|webm|mov)$/i.test(url);

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

/* ── Fullscreen media carousel ── */
const MediaCarousel = ({
  items,
  startIndex,
  onClose,
}: {
  items: string[];
  startIndex: number;
  onClose: () => void;
}) => {
  const [idx, setIdx] = useState(startIndex);

  const prev = useCallback(() => setIdx((i) => (i === 0 ? items.length - 1 : i - 1)), [items.length]);
  const next = useCallback(() => setIdx((i) => (i === items.length - 1 ? 0 : i + 1)), [items.length]);

  // swipe support
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

  // keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, prev, next]);

  // lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const current = items[idx];

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/95 flex flex-col"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* header */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <span className="text-white/70 text-sm">{idx + 1} / {items.length}</span>
        <button onClick={onClose} className="text-white p-1">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* media */}
      <div className="flex-1 flex items-center justify-center relative min-h-0 px-2">
        {items.length > 1 && (
          <button onClick={prev} className="absolute left-2 z-10 text-white/70 hover:text-white p-1">
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
          <button onClick={next} className="absolute right-2 z-10 text-white/70 hover:text-white p-1">
            <ChevronRight className="w-8 h-8" />
          </button>
        )}
      </div>

      {/* thumbnails */}
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
                  <Play className="w-4 h-4 text-white" />
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

/* ── Reviews Section ── */
const ReviewsSection = () => {
  const { product } = useProduct();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);
  const [loading, setLoading] = useState(true);
  const [carousel, setCarousel] = useState<{ items: string[]; index: number } | null>(null);

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

  if (loading || reviews.length === 0) return null;

  const totalReviews = reviews.length;
  const displayTotal = product.rating_count || totalReviews;
  const visibleReviews = reviews.slice(0, visibleCount);
  const remaining = displayTotal - visibleCount;

  return (
    <>
      <div className="bg-background px-4 py-4 mt-2">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-foreground">Avaliações dos clientes ({displayTotal})</h3>
          <div className="flex items-center gap-1">
            <span className="text-lg font-bold text-foreground">{product.rating}</span>
            <span className="text-muted-foreground text-sm">/5</span>
          </div>
        </div>

        <div className="space-y-4">
          {visibleReviews.map((review) => (
            <div key={review.id} className="border-b border-border pb-4 last:border-0">
              <div className="flex items-center gap-2 mb-2">
                {review.avatar_url ? (
                  <img src={review.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" loading="lazy" decoding="async" width={32} height={32} />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                    {review.reviewer_initial}
                  </div>
                )}
                <div>
                  <div className="text-sm font-medium text-foreground">{review.reviewer_name}</div>
                  <div className="text-xs text-muted-foreground">{formatDate(review.days_ago)}</div>
                </div>
              </div>
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
              {review.review_text && (
                <p className="text-sm text-foreground/80 mb-2">{review.review_text}</p>
              )}
              {review.photos.length > 0 && (
                <div className="flex gap-2 overflow-x-auto">
                  {review.photos.map((media, j) => (
                    <button
                      key={j}
                      onClick={() => setCarousel({ items: review.photos, index: j })}
                      className="relative w-20 h-20 rounded overflow-hidden flex-shrink-0"
                    >
                      {isVideo(media) ? (
                        <>
                          <video src={media} className="w-full h-full object-cover" muted playsInline preload="metadata" width={80} height={80} />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <Play className="w-6 h-6 text-white fill-white" />
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

        {remaining > 0 && (
          <button
            onClick={() => setVisibleCount((prev) => Math.min(prev + LOAD_MORE_COUNT, totalReviews))}
            className="w-full text-center text-sm text-primary font-semibold mt-3 py-2"
          >
            Ver mais avaliações ({displayTotal - visibleCount} restantes)
          </button>
        )}
      </div>

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

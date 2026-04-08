import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronUp, ChevronDown, Loader2, AlertCircle } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { ReelCard } from "@/components/reels/ReelCard";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface Reel {
  id: string;
  video_url: string;
  thumbnail_url: string | null;
  caption: string | null;
  likes_count: number;
  views_count: number;
  product_id: string | null;
  user_id: string;
  created_at: string;
  status?: string;
  is_featured?: boolean;
  product?: {
    id: string;
    name: string;
    price: number;
    image: string;
    category: string;
  } | null;
}

export default function ReelsPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  /* ---------- FETCH REELS ---------- */
  const { data: reels = [], isLoading, error } = useQuery({
    queryKey: ["live-reels"],
    queryFn: async () => {
      // Try with status filter first; fall back to all reels if column missing
      const { data, error } = await supabase
        .from("reels")
        .select(`*, product:products(id, name, price, image, category)`)
        .or("status.eq.approved,status.eq.live")
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("Status filter failed, fetching all reels:", error.message);
        const { data: fallback, error: fallbackErr } = await supabase
          .from("reels")
          .select(`*, product:products(id, name, price, image, category)`)
          .order("created_at", { ascending: false });
        if (fallbackErr) throw fallbackErr;
        return (fallback ?? []) as Reel[];
      }
      return (data ?? []) as Reel[];
    },
  });

  /* Clamp index on reels change */
  useEffect(() => {
    if (reels.length === 0) { setCurrentIndex(0); return; }
    setCurrentIndex(i => Math.min(Math.max(i, 0), reels.length - 1));
  }, [reels.length]);

  /* ---------- NAVIGATION ---------- */
  const goToNext = useCallback(() => {
    setCurrentIndex(prev => Math.min(prev + 1, reels.length - 1));
  }, [reels.length]);

  const goToPrev = useCallback(() => {
    setCurrentIndex(prev => Math.max(prev - 1, 0));
  }, []);

  /* ---------- KEYBOARD ---------- */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "j") goToNext();
      if (e.key === "ArrowUp" || e.key === "k") goToPrev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goToNext, goToPrev]);

  /* ---------- WHEEL (desktop scroll) ---------- */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let lastScroll = 0;
    const THROTTLE_MS = 600;

    const onWheel = (e: WheelEvent) => {
      // If the event came from inside a comment panel, ignore
      const target = e.target as HTMLElement;
      if (target.closest('[data-comments-panel]')) return;

      e.preventDefault();
      const now = Date.now();
      if (now - lastScroll < THROTTLE_MS) return;
      lastScroll = now;
      e.deltaY > 0 ? goToNext() : goToPrev();
    };

    container.addEventListener("wheel", onWheel, { passive: false });
    return () => container.removeEventListener("wheel", onWheel);
  }, [goToNext, goToPrev]);

  /* ---------- TOUCH ---------- */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let startY = 0;

    const onTouchStart = (e: TouchEvent) => {
      startY = e.touches[0]?.clientY ?? 0;
    };

    const onTouchEnd = (e: TouchEvent) => {
      const endY = e.changedTouches[0]?.clientY ?? 0;
      const diff = startY - endY;
      if (Math.abs(diff) > 60) {
        diff > 0 ? goToNext() : goToPrev();
      }
    };

    container.addEventListener("touchstart", onTouchStart);
    container.addEventListener("touchend", onTouchEnd);
    return () => {
      container.removeEventListener("touchstart", onTouchStart);
      container.removeEventListener("touchend", onTouchEnd);
    };
  }, [goToNext, goToPrev]);

  /* ---------- STATES ---------- */
  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-black">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <section className="min-h-screen flex flex-col items-center justify-center bg-black text-white gap-4">
          <AlertCircle className="w-12 h-12 text-red-400 opacity-70" />
          <h1 className="font-display text-3xl">Jewelry Reels</h1>
          <p className="text-white/50 text-sm">{(error as Error).message}</p>
        </section>
      </Layout>
    );
  }

  if (reels.length === 0) {
    return (
      <Layout>
        <section className="min-h-screen flex flex-col items-center justify-center bg-black text-white gap-4">
          <h1 className="font-display text-4xl">Jewelry Reels</h1>
          <p className="text-white/50">No reels yet. Be the first to share!</p>
        </section>
      </Layout>
    );
  }

  /* ---------- MAIN FULLSCREEN VIEW ---------- */
  return (
    <Layout>
      {/* Full-screen black container */}
      <div ref={containerRef} className="fixed inset-0 bg-black" style={{ paddingTop: '80px' }}>

        {/* Reels stack — each reel is 100% height of the viewport minus header */}
        <div
          className="h-full transition-transform duration-300 ease-out will-change-transform"
          style={{ transform: `translateY(-${currentIndex * 100}%)` }}
          role="list"
          aria-live="polite"
          aria-label={`Reel ${currentIndex + 1} of ${reels.length}`}
        >
          {reels.map((reel, index) => {
            // Only render current ± 1 for performance
            const shouldRender = Math.abs(index - currentIndex) <= 1;
            return (
              <div
                key={reel.id}
                className="h-full flex items-center justify-center"
                role="listitem"
                aria-label={`Reel ${index + 1}`}
              >
                {shouldRender ? (
                  // Center column: max 430px wide (phone portrait ratio)
                  <div className="h-full w-full max-w-[430px] mx-auto relative">
                    <ReelCard reel={reel} isActive={index === currentIndex} />
                  </div>
                ) : (
                  // Placeholder to keep layout correct
                  <div className="h-full w-full max-w-[430px] mx-auto bg-black" />
                )}
              </div>
            );
          })}
        </div>

        {/* Navigation arrows (desktop) */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2">
          <button
            onClick={goToPrev}
            disabled={currentIndex === 0}
            aria-label="Previous reel"
            className="p-2.5 bg-white/15 hover:bg-white/30 rounded-full disabled:opacity-20 transition-all text-white"
          >
            <ChevronUp className="w-5 h-5" />
          </button>
          <button
            onClick={goToNext}
            disabled={currentIndex === reels.length - 1}
            aria-label="Next reel"
            className="p-2.5 bg-white/15 hover:bg-white/30 rounded-full disabled:opacity-20 transition-all text-white"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>

        {/* Reel counter */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-4 z-20 flex gap-1.5">
          {reels.slice(0, 8).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`rounded-full transition-all ${
                i === currentIndex
                  ? 'w-4 h-2 bg-amber-500'
                  : 'w-2 h-2 bg-white/30 hover:bg-white/50'
              }`}
              aria-label={`Go to reel ${i + 1}`}
            />
          ))}
          {reels.length > 8 && (
            <span className="text-white/40 text-xs self-center ml-1">+{reels.length - 8}</span>
          )}
        </div>
      </div>
    </Layout>
  );
}
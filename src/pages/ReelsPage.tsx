import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronUp, ChevronDown, Loader2 } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { ReelCard } from "@/components/reels/ReelCard";
import { ReelUploadForm } from "@/components/reels/ReelUploadForm";
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
  status: string;
  is_featured: boolean;
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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const ADMIN_EMAIL = "2022ucp1720@mnit.ac.in";

  const [isAdmin, setIsAdmin] = useState(false);

useEffect(() => {
  const checkUser = async () => {
    const { data } = await supabase.auth.getUser();

    if (data?.user?.email === ADMIN_EMAIL) {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  };

  checkUser();
}, []);

  /* ---------- AUTH CHECK (PREVENT BLANK PAGE) ---------- */
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const resp = await supabase.auth.getSession();
        if (!mounted) return;
        setIsLoggedIn(!!resp.data?.session);
      } catch (err) {
        console.error("auth check error:", err);
        if (mounted) setIsLoggedIn(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  /* ---------- FETCH REELS ---------- */
  const { data: reels = [], isLoading, refetch } = useQuery({
  queryKey: ["live-reels"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("reels")
      .select(`
        *,
        product:products(id, name, price, image, category)
      `)
      .eq("status", "live")   // ✅ only public reels
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },
});

  /* If reels length shrinks, clamp the index */
  useEffect(() => {
    if (reels.length === 0) {
      setCurrentIndex(0);
      return;
    }
    setCurrentIndex((idx) => {
      if (idx >= reels.length) return reels.length - 1;
      if (idx < 0) return 0;
      return idx;
    });
  }, [reels.length]);

  /* ---------- NAVIGATION ---------- */
  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => {
      if (reels.length === 0) return 0;
      return Math.min(prev + 1, reels.length - 1);
    });
  }, [reels.length]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
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

  /* ---------- TOUCH / SCROLL (mobile + mouse wheel) ---------- */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let startY = 0;
    const passiveOptions = { passive: false } as AddEventListenerOptions;

    const touchStart = (e: TouchEvent) => {
      startY = e.touches[0]?.clientY ?? 0;
    };

    const touchEnd = (e: TouchEvent) => {
      const endY = e.changedTouches[0]?.clientY ?? 0;
      const diff = startY - endY;
      if (Math.abs(diff) > 50) {
        diff > 0 ? goToNext() : goToPrev();
      }
    };

    const wheel = (e: WheelEvent) => {
      // prevent default to avoid the page from scrolling while we're navigating reels
      e.preventDefault();
      e.deltaY > 0 ? goToNext() : goToPrev();
    };

    container.addEventListener("touchstart", touchStart);
    container.addEventListener("touchend", touchEnd);
    // wheel must be non-passive so e.preventDefault works
    container.addEventListener("wheel", wheel, passiveOptions);

    return () => {
      container.removeEventListener("touchstart", touchStart);
      container.removeEventListener("touchend", touchEnd);
      container.removeEventListener("wheel", wheel, passiveOptions);
    };
  }, [goToNext, goToPrev]);

  /* ---------- LOADING ---------- */
  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-gold" />
        </div>
      </Layout>
    );
  }

  /* ---------- EMPTY STATE ---------- */
  if (reels.length === 0) {
  return (
    <Layout>
      <section className="py-20 text-center">
        <h1 className="font-display text-4xl mb-4">
          Jewelry Reels
        </h1>

        <p className="text-muted-foreground mb-8">
          No reels yet. Be the first to share!
        </p>

        {/* ✅ Only admin can see upload */}
        {isAdmin && <ReelUploadForm onSuccess={refetch} />}
      </section>
    </Layout>
  );
}

  /* ---------- MAIN VIEW ---------- */
  return (
    <Layout>
      <div className="fixed inset-0 bg-black pt-20">
        {/* Admin / authenticated uploader button */}
        {isLoggedIn && (
          <div className="absolute left-4 top-24 z-20">
            <ReelUploadForm onSuccess={() => refetch()} />
          </div>
        )}

        {/* next/prev controls */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2">
          <button
            onClick={goToPrev}
            disabled={currentIndex === 0}
            aria-label="Previous reel"
            className="p-2 bg-white/20 rounded-full disabled:opacity-30"
          >
            <ChevronUp className="text-white" />
          </button>
          <button
            onClick={goToNext}
            disabled={currentIndex === reels.length - 1}
            aria-label="Next reel"
            className="p-2 bg-white/20 rounded-full disabled:opacity-30"
          >
            <ChevronDown className="text-white" />
          </button>
        </div>

        {/* scrolling container */}
        <div ref={containerRef} className="h-full overflow-hidden">
          <div
            className="h-full transition-transform duration-300"
            style={{ transform: `translateY(-${currentIndex * 100}%)` }}
            role="list"
            aria-live="polite"
          >
            {reels.map((reel, index) => (
              <div key={reel.id} className="h-full max-w-md mx-auto" role="listitem">
                <ReelCard reel={reel} isActive={index === currentIndex} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
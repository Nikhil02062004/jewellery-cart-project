import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
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

  /* Observer to track current visible reel for autoplay/pause logic */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute("data-index"));
            setCurrentIndex(index);
          }
        });
      },
      { threshold: 0.6 }
    );

    const elements = document.querySelectorAll("[data-reel-item]");
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [reels.length]);

  if (isLoading) {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  if (error || reels.length === 0) {
    return (
      <Layout>
        <section className="h-[calc(100dvh-80px)] flex flex-col items-center justify-center bg-black text-white gap-4">
          <AlertCircle className="w-12 h-12 text-red-400 opacity-70" />
          <h1 className="font-display text-3xl">Jewelry Reels</h1>
          <p className="text-white/50">{error ? (error as Error).message : "No reels found"}</p>
        </section>
      </Layout>
    );
  }

  return (
    <div className="fixed inset-0 bg-black overflow-hidden lg:static lg:h-screen lg:pt-20">
      {/* Mobile Header Overlay */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-6 bg-gradient-to-b from-black/60 to-transparent lg:hidden">
        <h1 className="text-white font-display text-xl font-bold tracking-tight">Reels</h1>
        <Link to="/silver" className="text-white/80 hover:text-white transition-colors">
          <ChevronUp className="w-6 h-6 rotate-90" />
        </Link>
      </div>

      {/* Main Snap Container */}
      <div 
        ref={containerRef}
        className="h-[100dvh] lg:h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
      >
        {reels.map((reel, index) => (
          <div
            key={reel.id}
            data-index={index}
            data-reel-item
            className="h-[100dvh] lg:h-full w-full snap-start snap-always flex items-center justify-center relative bg-black"
          >
            <div className="h-full w-full max-w-[500px] mx-auto relative group">
              <ReelCard reel={reel} isActive={index === currentIndex} />
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Only Scroll Instructions */}
      <div className="hidden lg:flex absolute right-8 top-1/2 -translate-y-1/2 flex-col gap-4 text-white/30 items-center animate-fade-in pointer-events-none">
        <div className="w-px h-24 bg-gradient-to-b from-transparent via-white/20 to-transparent" />
        <span className="text-[10px] uppercase tracking-[0.3em] vertical-text">Scroll to explore</span>
        <div className="w-px h-24 bg-gradient-to-t from-transparent via-white/20 to-transparent" />
      </div>
    </div>
  );
}
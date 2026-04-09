import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Share2, Play, Volume2, VolumeX, ShoppingBag, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ReelComments } from './ReelComments';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

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
  product?: {
    id: string;
    name: string;
    price: number;
    image: string;
    category: string;
  } | null;
}

interface ReelCardProps {
  reel: Reel;
  isActive: boolean;
}

export const ReelCard = ({ reel, isActive }: ReelCardProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(reel.likes_count ?? 0);
  // ✅ KEY FIX: comment state is ONLY ever set by explicit button click
  const [showComments, setShowComments] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  // Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) checkIfLiked(session.user.id);
    });
  }, [reel.id]);

  // Auto-play / pause when reel becomes active
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      video.play().catch(() => {});
      setIsPlaying(true);
      // Increment view count (fire and forget)
      supabase.from('reels').update({ views_count: (reel.views_count ?? 0) + 1 })
        .eq('id', reel.id).then(() => {});
    } else {
      video.pause();
      video.currentTime = 0;
      setIsPlaying(false);
      // ✅ KEY FIX: close comments when scrolling away from this reel
      setShowComments(false);
    }
  }, [isActive, reel.id]);

  const checkIfLiked = async (userId: string) => {
    const { data } = await supabase
      .from('reel_likes').select('id')
      .eq('reel_id', reel.id).eq('user_id', userId).single();
    setIsLiked(!!data);
  };

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) { video.pause(); setIsPlaying(false); }
    else { video.play(); setIsPlaying(true); }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) setDuration(videoRef.current.duration);
  };

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs)) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast({ title: 'Please login', description: 'You need to be logged in to like reels' });
      return;
    }
    try {
      if (isLiked) {
        await supabase.from('reel_likes').delete().eq('reel_id', reel.id).eq('user_id', user.id);
        setLikesCount(p => Math.max(0, p - 1));
      } else {
        await supabase.from('reel_likes').insert({ reel_id: reel.id, user_id: user.id });
        setLikesCount(p => p + 1);
      }
      setIsLiked(!isLiked);
    } catch (err) {
      console.error('Like error:', err);
    }
  };

  // ✅ ONLY way to open comments — explicit button click
  const openComments = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowComments(true);
  };

  const closeComments = () => setShowComments(false);

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/reels?id=${reel.id}`;
    const shareText = reel.caption || 'Check out this amazing jewelry reel!';

    if (navigator.share) {
      navigator.share({ title: 'Jewelry Reel', text: shareText, url: shareUrl }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl).then(() => {
        toast({ title: 'Link copied!', description: 'Reel link copied to clipboard' });
      });
    }
  };

  return (
    <>
      {/* Main reel container — takes full height of parent */}
      <div className="relative h-full w-full bg-black overflow-hidden select-none">

        {/* ——— VIDEO ——— */}
        <video
          ref={videoRef}
          src={reel.video_url}
          poster={reel.thumbnail_url || undefined}
          loop
          muted={isMuted}
          playsInline
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          className="absolute inset-0 w-full h-full object-cover"
          onClick={togglePlayPause}
        />

        {/* ——— PLAY OVERLAY (tap to pause/play) ——— */}
        {!isPlaying && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            aria-hidden="true"
          >
            <div className="rounded-full bg-black/40 p-4">
              <Play className="w-10 h-10 text-white fill-white" />
            </div>
          </div>
        )}

        {/* ——— MUTE BUTTON (top-right) ——— */}
        <button
          onClick={toggleMute}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>

        {/* ——— RIGHT SIDE ACTION BUTTONS ——— */}
        <div className="absolute right-4 bottom-24 z-10 flex flex-col items-center gap-6">

          {/* User Profile - Standard IG feature */}
          <div className="flex flex-col items-center mb-2">
            <div className="w-11 h-11 rounded-full border-2 border-gold p-0.5 bg-background overflow-hidden shadow-gold">
              <div className="w-full h-full rounded-full bg-charcoal flex items-center justify-center text-gold text-xs font-bold">
                {user?.user_metadata?.name?.charAt(0) || <User className="w-5 h-5" />}
              </div>
            </div>
            <div className="bg-gold rounded-full px-1.5 py-0.5 -mt-2.5 z-10">
              <span className="text-[10px] font-bold text-charcoal">+</span>
            </div>
          </div>

          {/* Like */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={handleLike}
              className={cn(
                'group flex items-center justify-center w-12 h-12 rounded-full glass-card transition-all active:scale-75',
                isLiked ? 'text-red-500 bg-red-500/10 border-red-500/20' : 'text-white'
              )}
              aria-label="Like"
            >
              <Heart className={cn('w-6 h-6 transition-transform group-hover:scale-110', isLiked && 'fill-current')} />
            </button>
            <span className="text-white text-[11px] font-medium drop-shadow-md tracking-wider">
              {likesCount > 999 ? `${(likesCount/1000).toFixed(1)}k` : likesCount}
            </span>
          </div>

          {/* Comment */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={openComments}
              className="group flex items-center justify-center w-12 h-12 rounded-full glass-card text-white transition-all active:scale-75"
              aria-label="Comments"
            >
              <MessageCircle className="w-6 h-6 transition-transform group-hover:scale-110" />
            </button>
            <span className="text-white text-[11px] font-medium drop-shadow-md tracking-wider">Chat</span>
          </div>

          {/* Share */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={handleShare}
              className="group flex items-center justify-center w-12 h-12 rounded-full glass-card text-white transition-all active:scale-75"
              aria-label="Share"
            >
              <Share2 className="w-5 h-5 transition-transform group-hover:scale-110" />
            </button>
            <span className="text-white text-[11px] font-medium drop-shadow-md tracking-wider">Send</span>
          </div>
        </div>

        {/* ——— BOTTOM INFO (caption + product) ——— */}
        <div className="absolute bottom-8 left-4 right-20 z-10 space-y-4 pointer-events-none">
          {/* User & Timestamp */}
          <div className="flex items-center gap-3 pointer-events-auto">
            <span className="text-white font-bold text-base tracking-tight drop-shadow-lg">
              @{user?.user_metadata?.name?.toLowerCase().replace(/\s+/g, '') || 'jewelry_lover'}
            </span>
            <span className="text-white/60 text-xs font-medium drop-shadow-md">• {formatDistanceToNow(new Date(reel.created_at), { addSuffix: true }).replace('about ', '')}</span>
          </div>

          {/* Caption */}
          {reel.caption && (
            <p className="text-white/90 text-[13px] leading-relaxed line-clamp-2 drop-shadow-md pr-4 pointer-events-auto max-w-[90%]">
              {reel.caption}
            </p>
          )}

          {/* Product card - More premium */}
          {reel.product && (
            <Link
              to={`/product/${reel.product.id}`}
              onClick={e => e.stopPropagation()}
              className="pointer-events-auto flex items-center gap-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-3 hover:bg-white/20 transition-all group scale-100 hover:scale-[1.02] shadow-2xl overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-gold/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative w-12 h-12 flex-shrink-0">
                <img
                  src={reel.product.image}
                  alt={reel.product.name}
                  className="w-full h-full object-cover rounded-xl border border-white/10 shadow-lg"
                />
              </div>
              <div className="flex-1 min-w-0 relative">
                <p className="text-white font-bold text-xs truncate tracking-wide uppercase">{reel.product.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-gold font-black text-sm">₹{reel.product.price.toLocaleString()}</p>
                  <span className="text-[10px] text-white/40 line-through">₹{(reel.product.price * 1.2).toLocaleString()}</span>
                </div>
              </div>
              <div className="relative flex-shrink-0 w-10 h-10 rounded-full bg-gold flex items-center justify-center shadow-gold transition-transform group-hover:rotate-[360deg] duration-700">
                <ShoppingBag className="w-5 h-5 text-charcoal" />
              </div>
            </Link>
          )}
        </div>

        {/* ——— GRADIENT OVERLAY ——— */}
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 30%, transparent 60%, rgba(0,0,0,0.4) 100%)' }}
          aria-hidden="true"
        />

        {/* ——— PROGRESS BAR (Minimalist) ——— */}
        <div className="absolute bottom-0 left-0 right-0 z-30 h-1 bg-white/10 overflow-hidden">
          <div 
            className="h-full bg-gold transition-all duration-100 ease-linear shadow-gold"
            style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* ——— COMMENT DRAWER ——— */}
      <ReelComments
        reelId={reel.id}
        isOpen={showComments}
        onClose={closeComments}
      />
    </>
  );
};

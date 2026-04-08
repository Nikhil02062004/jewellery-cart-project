import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Share2, Play, Volume2, VolumeX, ShoppingBag } from 'lucide-react';
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
        <div className="absolute right-3 bottom-32 z-10 flex flex-col items-center gap-5">

          {/* Like */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={handleLike}
              className={cn(
                'p-3 rounded-full bg-black/40 hover:bg-black/60 transition-all active:scale-90',
                isLiked ? 'text-red-500' : 'text-white'
              )}
              aria-label="Like"
            >
              <Heart className={cn('w-6 h-6', isLiked && 'fill-current')} />
            </button>
            <span className="text-white text-xs font-semibold drop-shadow">{likesCount}</span>
          </div>

          {/* Comment — THE ONLY trigger for comments */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={openComments}
              className="p-3 rounded-full bg-black/40 hover:bg-black/60 text-white transition-all active:scale-90"
              aria-label="Comments"
            >
              <MessageCircle className="w-6 h-6" />
            </button>
            <span className="text-white text-xs font-semibold drop-shadow">Comment</span>
          </div>

          {/* Share */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={handleShare}
              className="p-3 rounded-full bg-black/40 hover:bg-black/60 text-white transition-all active:scale-90"
              aria-label="Share"
            >
              <Share2 className="w-6 h-6" />
            </button>
            <span className="text-white text-xs font-semibold drop-shadow">Share</span>
          </div>
        </div>

        {/* ——— BOTTOM INFO (caption + product) ——— */}
        <div className="absolute bottom-4 left-3 right-16 z-10 pointer-events-none">
          {/* Caption */}
          {reel.caption && (
            <p className="text-white text-sm mb-3 line-clamp-2 drop-shadow-lg">
              {reel.caption}
            </p>
          )}

          {/* Product card */}
          {reel.product && (
            <Link
              to={`/product/${reel.product.id}`}
              onClick={e => e.stopPropagation()}
              className="pointer-events-auto flex items-center gap-3 bg-black/60 backdrop-blur-md border border-gold/30 rounded-xl p-2.5 hover:bg-black/80 transition-colors group"
            >
              <img
                src={reel.product.image}
                alt={reel.product.name}
                className="w-11 h-11 object-cover rounded-lg border border-gold/20 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">{reel.product.name}</p>
                <p className="text-gold font-semibold text-sm">₹{reel.product.price.toLocaleString()}</p>
              </div>
              <div className="flex-shrink-0 p-1.5 rounded-lg bg-gold/20 group-hover:bg-gold/40 transition-colors">
                <ShoppingBag className="w-4 h-4 text-gold" />
              </div>
            </Link>
          )}
        </div>

        {/* ——— GRADIENT OVERLAY (bottom fade for readability) ——— */}
        <div
          className="absolute bottom-0 left-0 right-0 h-56 pointer-events-none z-0"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)' }}
          aria-hidden="true"
        />

        {/* ——— PROGRESS BAR & INFO ——— */}
        <div className="absolute bottom-0 left-0 right-0 z-20 flex flex-col pointer-events-none">
          {/* Metadata Overlay (Caption, Timestamp) */}
          <div className="px-3 pb-4 pointer-events-auto w-[85%]">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-white font-semibold text-[15px] drop-shadow-md">
                {/* Normally Username goes here; we'll show timestamp for now to match IG */}
                @{user?.user_metadata?.name || 'user'}
              </span>
              <span className="text-white/80 text-xs font-medium drop-shadow">
                • {formatDistanceToNow(new Date(reel.created_at), { addSuffix: true }).replace('about ', '')}
              </span>
            </div>
          </div>

          {/* Progress Bar & Timer */}
          <div className="flex items-center gap-2 px-3 pb-2 w-full">
            <span className="text-[10px] text-white/80 font-medium drop-shadow w-7 text-right">
              {formatTime(currentTime)}
            </span>
            <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden flex items-center backdrop-blur-sm">
              <div 
                className="h-full bg-white transition-all duration-100 ease-linear rounded-full"
                style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>
            <span className="text-[10px] text-white/80 font-medium drop-shadow w-7">
              {formatTime(duration)}
            </span>
          </div>
        </div>
      </div>

      {/* ——— COMMENT DRAWER (rendered as portal-like fixed overlay) ——— */}
      {/* ✅ Only visible when showComments=true, which is ONLY set by openComments() */}
      <ReelComments
        reelId={reel.id}
        isOpen={showComments}
        onClose={closeComments}
      />
    </>
  );
};

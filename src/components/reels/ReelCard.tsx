import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, ShoppingBag, Play, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ReelComments } from './ReelComments';
import { SocialShareButtons } from './SocialShareButtons';
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
  const [likesCount, setLikesCount] = useState(reel.likes_count);
  const [showComments, setShowComments] = useState(false);
  const [user, setUser] = useState<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkIfLiked(session.user.id);
      }
    });
  }, [reel.id]);

  useEffect(() => {
    if (isActive && videoRef.current) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
      // Increment view count and check milestones
      const newViewCount = reel.views_count + 1;
      supabase
        .from('reels')
        .update({ views_count: newViewCount })
        .eq('id', reel.id)
        .then(() => {
          // Check for milestones in background
          supabase.functions.invoke('check-reel-milestones', {
            body: {
              reel_id: reel.id,
              current_views: newViewCount,
              current_likes: reel.likes_count,
            },
          }).catch(err => console.log('Milestone check skipped:', err));
        });
    } else if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [isActive, reel.id]);

  const checkIfLiked = async (userId: string) => {
    const { data } = await supabase
      .from('reel_likes')
      .select('id')
      .eq('reel_id', reel.id)
      .eq('user_id', userId)
      .single();
    setIsLiked(!!data);
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleLike = async () => {
    if (!user) {
      toast({ title: "Please login", description: "You need to be logged in to like reels" });
      return;
    }

    try {
      if (isLiked) {
        await supabase
          .from('reel_likes')
          .delete()
          .eq('reel_id', reel.id)
          .eq('user_id', user.id);
        setLikesCount(prev => prev - 1);
      } else {
        await supabase
          .from('reel_likes')
          .insert({ reel_id: reel.id, user_id: user.id });
        const newLikesCount = likesCount + 1;
        setLikesCount(newLikesCount);
        
        // Check for milestones after like
        supabase.functions.invoke('check-reel-milestones', {
          body: {
            reel_id: reel.id,
            current_views: reel.views_count,
            current_likes: newLikesCount,
          },
        }).catch(err => console.log('Milestone check skipped:', err));
      }
      setIsLiked(!isLiked);
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };


  return (
    <div className="relative h-full w-full bg-black rounded-lg overflow-hidden">
      {/* Video */}
      <video
        ref={videoRef}
        src={reel.video_url}
        poster={reel.thumbnail_url || undefined}
        loop
        muted={isMuted}
        playsInline
        className="absolute inset-0 w-full h-full object-cover cursor-pointer"
        onClick={togglePlayPause}
      />

      {/* Play/Pause overlay */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <Play className="w-16 h-16 text-white/80" />
        </div>
      )}

      {/* Controls overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top controls */}
        <div className="absolute top-4 right-4 pointer-events-auto">
          <Button
            variant="ghost"
            size="icon"
            className="bg-black/40 hover:bg-black/60 text-white rounded-full"
            onClick={toggleMute}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </Button>
        </div>

        {/* Right side actions */}
        <div className="absolute right-4 bottom-32 flex flex-col gap-6 pointer-events-auto">
          <div className="flex flex-col items-center">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "rounded-full bg-black/40 hover:bg-black/60",
                isLiked ? "text-red-500" : "text-white"
              )}
              onClick={handleLike}
            >
              <Heart className={cn("w-7 h-7", isLiked && "fill-current")} />
            </Button>
            <span className="text-white text-sm font-medium mt-1">{likesCount}</span>
          </div>

          <div className="flex flex-col items-center">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full bg-black/40 hover:bg-black/60 text-white"
              onClick={() => setShowComments(true)}
            >
              <MessageCircle className="w-7 h-7" />
            </Button>
            <span className="text-white text-sm font-medium mt-1">Comments</span>
          </div>

          <div className="flex flex-col items-center">
            <SocialShareButtons reelId={reel.id} caption={reel.caption} />
            <span className="text-white text-sm font-medium mt-1">Share</span>
          </div>
        </div>

        {/* Bottom info */}
        <div className="absolute bottom-4 left-4 right-20 pointer-events-auto">
          {/* Caption */}
          {reel.caption && (
            <p className="text-white text-sm mb-3 line-clamp-2">{reel.caption}</p>
          )}

          {/* Product link */}
          {reel.product && (
            <Link
              to={`/product/${reel.product.id}`}
              className="flex items-center gap-3 bg-white/90 backdrop-blur-sm rounded-lg p-3 hover:bg-white transition-colors"
            >
              <img
                src={reel.product.image}
                alt={reel.product.name}
                className="w-12 h-12 object-cover rounded"
              />
              <div className="flex-1 min-w-0">
                <p className="text-charcoal font-medium text-sm truncate">{reel.product.name}</p>
                <p className="text-gold font-semibold">₹{reel.product.price.toLocaleString()}</p>
              </div>
              <ShoppingBag className="w-5 h-5 text-gold flex-shrink-0" />
            </Link>
          )}
        </div>
      </div>

      {/* Comments drawer */}
      <ReelComments
        reelId={reel.id}
        isOpen={showComments}
        onClose={() => setShowComments(false)}
      />
    </div>
  );
};

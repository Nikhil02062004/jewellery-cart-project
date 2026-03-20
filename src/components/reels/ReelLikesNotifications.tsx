import { useState, useEffect } from 'react';
import { Heart, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';

interface LikeNotification {
  id: string;
  created_at: string;
  reel_id: string;
  user_id: string;
  reel_caption: string | null;
  reel_thumbnail: string | null;
}

interface ReelLikesNotificationsProps {
  userId: string;
}

export const ReelLikesNotifications = ({ userId }: ReelLikesNotificationsProps) => {
  const [likes, setLikes] = useState<LikeNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLikes();
    
    // Subscribe to new likes on user's reels
    const channel = supabase
      .channel('reel-likes-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reel_likes',
        },
        (payload) => {
          // Check if this like is on one of the user's reels
          checkAndAddLike(payload.new as { id: string; reel_id: string; user_id: string; created_at: string });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const fetchLikes = async () => {
    try {
      // Get all reels owned by the user
      const { data: userReels } = await supabase
        .from('reels')
        .select('id, caption, thumbnail_url')
        .eq('user_id', userId);

      if (!userReels || userReels.length === 0) {
        setLoading(false);
        return;
      }

      const reelIds = userReels.map(r => r.id);

      // Get likes on those reels (excluding self-likes)
      const { data: likesData } = await supabase
        .from('reel_likes')
        .select('*')
        .in('reel_id', reelIds)
        .neq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (likesData) {
        const enrichedLikes = likesData.map(like => {
          const reel = userReels.find(r => r.id === like.reel_id);
          return {
            ...like,
            reel_caption: reel?.caption || null,
            reel_thumbnail: reel?.thumbnail_url || null,
          };
        });
        setLikes(enrichedLikes);
      }
    } catch (error) {
      console.error('Error fetching likes:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkAndAddLike = async (newLike: { id: string; reel_id: string; user_id: string; created_at: string }) => {
    // Check if this reel belongs to the current user
    const { data: reel } = await supabase
      .from('reels')
      .select('id, caption, thumbnail_url, user_id')
      .eq('id', newLike.reel_id)
      .single();

    if (reel && reel.user_id === userId && newLike.user_id !== userId) {
      setLikes(prev => [{
        ...newLike,
        reel_caption: reel.caption,
        reel_thumbnail: reel.thumbnail_url,
      }, ...prev]);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            Recent Likes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-red-500 fill-red-500" />
          Recent Likes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {likes.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">
            No likes yet. Share your reels to get more engagement!
          </p>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="space-y-3">
              {likes.map((like) => (
                <div key={like.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      Someone liked your reel
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {like.reel_caption || 'Untitled reel'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(like.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  {like.reel_thumbnail && (
                    <img
                      src={like.reel_thumbnail}
                      alt=""
                      className="w-12 h-12 object-cover rounded"
                    />
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

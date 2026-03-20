import { useState, useEffect } from 'react';
import { X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface Comment {
  id: string;
  user_id: string;
  user_name: string;
  comment: string;
  created_at: string;
}

interface ReelCommentsProps {
  reelId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ReelComments = ({ reelId, isOpen, onClose }: ReelCommentsProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchComments();
      // Set up realtime subscription
      const channel = supabase
        .channel(`reel-comments-${reelId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'reel_comments',
            filter: `reel_id=eq.${reelId}`,
          },
          (payload) => {
            setComments(prev => [payload.new as Comment, ...prev]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isOpen, reelId]);

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from('reel_comments')
      .select('*')
      .eq('reel_id', reelId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setComments(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    if (!user) {
      toast({ title: "Please login", description: "You need to be logged in to comment" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('reel_comments').insert({
        reel_id: reelId,
        user_id: user.id,
        user_name: user.user_metadata?.name || user.email?.split('@')[0] || 'Anonymous',
        comment: newComment.trim(),
      });

      if (error) throw error;
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({ title: "Error", description: "Failed to add comment", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 bg-background rounded-t-3xl shadow-2xl transition-transform duration-300 ease-out",
        isOpen ? "translate-y-0" : "translate-y-full"
      )}
      style={{ height: '60vh', maxHeight: '500px' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="font-display text-lg">Comments</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Comments list */}
      <ScrollArea className="flex-1 h-[calc(100%-130px)]">
        <div className="p-4 space-y-4">
          {comments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No comments yet</p>
              <p className="text-sm">Be the first to comment!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="w-9 h-9 flex-shrink-0">
                  <AvatarFallback className="bg-gold/20 text-gold text-sm">
                    {comment.user_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="font-medium text-sm">{comment.user_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/90 mt-0.5 break-words">{comment.comment}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Comment input */}
      <form onSubmit={handleSubmit} className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-background">
        <div className="flex gap-2">
          <Input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={user ? "Add a comment..." : "Login to comment"}
            disabled={!user || loading}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={!user || loading || !newComment.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
};

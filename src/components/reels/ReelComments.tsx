import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Send, MessageCircle, Heart } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface CommentNode {
  id: string;
  user_id: string;
  user_name: string;
  comment: string;
  created_at: string;
  parent_id: string | null;
  likes_count: number;
  user_has_liked: boolean;
  replies?: CommentNode[];
}

interface ReelCommentsProps {
  reelId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ReelComments = ({ reelId, isOpen, onClose }: ReelCommentsProps) => {
  const [comments, setComments] = useState<CommentNode[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string, name: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
  }, []);

  // Fetch comments + realtime
  useEffect(() => {
    if (!isOpen) {
      setReplyingTo(null);
      return;
    }

    fetchComments();
    setTimeout(() => inputRef.current?.focus(), 350);

    const commentsChannel = supabase
      .channel(`comments-${reelId}`)
      .on('postgres_changes', {
        event: '*', 
        schema: 'public',
        table: 'reel_comments',
        filter: `reel_id=eq.${reelId}`,
      }, () => {
        fetchComments();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'reel_comment_likes'
      }, () => {
        fetchComments();
      })
      .subscribe();

    return () => { supabase.removeChannel(commentsChannel); };
  }, [isOpen, reelId, user?.id]);

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from('reel_comments')
      .select('*, reel_comment_likes(user_id)')
      .eq('reel_id', reelId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      const processed: CommentNode[] = data.map((d: any) => ({
        ...d,
        likes_count: d.reel_comment_likes?.length || 0,
        user_has_liked: d.reel_comment_likes?.some((l: any) => l.user_id === user?.id) || false
      }));

      // Group into parents and replies
      const parents = processed.filter(c => !c.parent_id);
      const structured = parents.map(p => ({
        ...p,
        replies: processed.filter(c => c.parent_id === p.id)
      }));

      setComments(structured);
      setTimeout(() => {
        if (!replyingTo) {
          listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
        }
      }, 100);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    if (!user) {
      toast({ title: 'Please login', description: 'You need to be logged in to comment' });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('reel_comments').insert({
        reel_id: reelId,
        user_id: user.id,
        user_name: user.user_metadata?.name || user.email?.split('@')[0] || 'Anonymous',
        comment: newComment.trim(),
        parent_id: replyingTo?.id || null
      });
      if (error) throw error;
      
      setNewComment('');
      setReplyingTo(null);
    } catch {
      toast({ title: 'Error', description: 'Failed to post comment', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleLike = async (commentId: string, hasLiked: boolean) => {
    if (!user) {
      toast({ title: 'Please login', description: 'Log in to like comments' });
      return;
    }
    
    // Optimistic UI updates could go here
    try {
      if (hasLiked) {
        await supabase.from('reel_comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', user.id);
      } else {
        await supabase.from('reel_comment_likes')
          .insert({ comment_id: commentId, user_id: user.id });
      }
    } catch (e) {
      console.error("Like error", e);
    }
  };

  const stopScroll = (e: React.SyntheticEvent) => e.stopPropagation();

  if (!isOpen) return null;

  const totalCommentsCount = comments.reduce((acc, curr) => acc + 1 + (curr.replies?.length || 0), 0);

  return createPortal(
    <>
      <div
        className="fixed inset-0 bg-black/60 z-[9998]"
        onClick={onClose}
        aria-label="Close comments"
        style={{ touchAction: 'none' }}
      />

      <div
        className="fixed inset-x-0 bottom-0 z-[9999] flex flex-col rounded-t-2xl shadow-2xl"
        style={{
          height: '65vh',
          maxHeight: '560px',
          backgroundColor: '#161616',
          touchAction: 'pan-y',
        }}
        onWheel={stopScroll}
        onTouchStart={stopScroll}
        onTouchMove={stopScroll}
        onTouchEnd={stopScroll}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-[5px] rounded-full bg-white/20" />
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-white font-semibold text-[15px]">Comments</span>
            <span className="text-white/40 font-normal text-sm ml-1">
              {totalCommentsCount}
            </span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/10 text-white/50 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 space-y-6"
          onWheel={stopScroll}
          onTouchMove={stopScroll}
        >
          {comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 opacity-60">
              <MessageCircle className="w-10 h-10" />
              <p className="text-sm">No comments yet.</p>
            </div>
          ) : (
            comments.map(c => (
              <div key={c.id} className="flex gap-3">
                <Avatar className="w-8 h-8 flex-shrink-0 mt-0.5">
                  <AvatarFallback className="bg-amber-900 text-amber-100 text-xs font-semibold">
                    {c.user_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  {/* Main Comment */}
                  <div className="flex justify-between items-start">
                    <div className="pr-4">
                      <div className="flex items-baseline gap-2 mb-0.5">
                        <span className="text-white/80 font-medium text-[13px]">{c.user_name}</span>
                        <span className="text-white/30 text-[11px]">
                          {formatDistanceToNow(new Date(c.created_at)).replace('about ', '')}
                        </span>
                      </div>
                      <p className="text-white text-[13px] leading-relaxed break-words">
                        {c.comment}
                      </p>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-4 mt-2">
                        <button 
                          onClick={() => { setReplyingTo({ id: c.id, name: c.user_name }); inputRef.current?.focus(); }}
                          className="text-white/40 hover:text-white/80 text-[11px] font-semibold transition-colors"
                        >
                          Reply
                        </button>
                        {c.likes_count > 0 && (
                          <span className="text-white/40 text-[11px] font-medium">{c.likes_count} likes</span>
                        )}
                      </div>
                    </div>

                    <button 
                      onClick={() => toggleLike(c.id, c.user_has_liked)}
                      className="p-1 mt-1 shrink-0 group transition-all"
                    >
                      <Heart 
                        className={cn("w-3.5 h-3.5 transition-colors", 
                          c.user_has_liked ? "fill-red-500 text-red-500" : "text-white/40 group-hover:text-white/80"
                        )} 
                      />
                    </button>
                  </div>

                  {/* Replies */}
                  {c.replies && c.replies.length > 0 && (
                    <div className="mt-4 space-y-4">
                      {c.replies.map(reply => (
                        <div key={reply.id} className="flex gap-3">
                          <Avatar className="w-6 h-6 flex-shrink-0 mt-0.5">
                            <AvatarFallback className="bg-amber-900/40 text-amber-100 text-[10px] font-semibold">
                              {reply.user_name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <div className="pr-4">
                                <div className="flex items-baseline gap-2 mb-0.5">
                                  <span className="text-white/80 font-medium text-[13px]">{reply.user_name}</span>
                                  <span className="text-white/30 text-[11px]">
                                    {formatDistanceToNow(new Date(reply.created_at)).replace('about ', '')}
                                  </span>
                                </div>
                                <p className="text-white text-[13px] leading-relaxed break-words">
                                  <span className="text-blue-400 mr-1">@{c.user_name}</span>
                                  {reply.comment}
                                </p>
                                <div className="flex items-center gap-4 mt-2">
                                  <button 
                                    onClick={() => { setReplyingTo({ id: c.id, name: reply.user_name }); inputRef.current?.focus(); }}
                                    className="text-white/40 hover:text-white/80 text-[11px] font-semibold transition-colors"
                                  >
                                    Reply
                                  </button>
                                  {reply.likes_count > 0 && (
                                    <span className="text-white/40 text-[11px] font-medium">{reply.likes_count} likes</span>
                                  )}
                                </div>
                              </div>
                              <button 
                                onClick={() => toggleLike(reply.id, reply.user_has_liked)}
                                className="p-1 mt-1 shrink-0 group transition-all"
                              >
                                <Heart 
                                  className={cn("w-3.5 h-3.5 transition-colors", 
                                    reply.user_has_liked ? "fill-red-500 text-red-500" : "text-white/40 group-hover:text-white/80"
                                  )} 
                                />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input */}
        <div className="flex-shrink-0 border-t border-white/10" style={{ backgroundColor: '#0e0e0e' }}>
          {replyingTo && (
            <div className="flex items-center justify-between px-4 py-2 bg-white/5 text-xs text-white/60">
              <span>Replying to {replyingTo.name}</span>
              <button onClick={() => setReplyingTo(null)} className="hover:text-white p-1">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex items-center gap-3 px-4 py-3">
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarFallback className="bg-amber-900 text-amber-100 text-xs font-semibold">
                {user ? (user.user_metadata?.name || 'U').charAt(0).toUpperCase() : '?'}
              </AvatarFallback>
            </Avatar>

            <input
              ref={inputRef}
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              onKeyDown={e => e.stopPropagation()}
              placeholder={replyingTo ? `Reply to ${replyingTo.name}...` : 'Add a comment…'}
              disabled={!user || submitting}
              maxLength={300}
              autoComplete="off"
              className="flex-1 bg-transparent px-2 py-1 text-[14px] text-white placeholder:text-white/40 border-none focus:ring-0 focus:outline-none"
            />

            <button
              type="submit"
              disabled={!user || submitting || !newComment.trim()}
              className="text-blue-500 font-semibold text-[14px] disabled:opacity-40 disabled:cursor-not-allowed hover:text-blue-400 transition-colors"
            >
              Post
            </button>
          </form>
        </div>
      </div>
    </>,
    document.body
  );
};

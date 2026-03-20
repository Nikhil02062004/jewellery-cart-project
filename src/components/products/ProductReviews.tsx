import { useState, useEffect } from 'react';
import { Star, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Review {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  created_at: string;
  user_id: string;
}

interface ProductReviewsProps {
  productId: string;
}

export const ProductReviews = ({ productId }: ProductReviewsProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  // Form state
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');

  useEffect(() => {
    fetchReviews();
    checkUser();
  }, [productId]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const fetchReviews = async () => {
    const { data, error } = await supabase
      .from('product_reviews')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (data) setReviews(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please login to submit a review');
      return;
    }

    setSubmitting(true);

    const { error } = await supabase
      .from('product_reviews')
      .insert({
        product_id: productId,
        user_id: user.id,
        rating,
        title: title || null,
        comment: comment || null,
      });

    if (error) {
      toast.error('Failed to submit review');
    } else {
      toast.success('Review submitted successfully!');
      setRating(5);
      setTitle('');
      setComment('');
      setShowForm(false);
      fetchReviews();
    }

    setSubmitting(false);
  };

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <section className="py-12 border-t border-border">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h2 className="font-display text-2xl mb-2">Customer Reviews</h2>
              {reviews.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={cn(
                          "w-5 h-5",
                          star <= Math.round(averageRating)
                            ? "text-gold fill-gold"
                            : "text-muted"
                        )}
                      />
                    ))}
                  </div>
                  <span className="font-body text-sm text-muted-foreground">
                    {averageRating.toFixed(1)} out of 5 ({reviews.length} reviews)
                  </span>
                </div>
              )}
            </div>
            
            {!showForm && (
              <Button onClick={() => setShowForm(true)}>
                Write a Review
              </Button>
            )}
          </div>

          {/* Review Form */}
          {showForm && (
            <form onSubmit={handleSubmit} className="bg-muted/30 rounded-lg p-6 mb-8">
              <h3 className="font-display text-lg mb-4">Write Your Review</h3>
              
              {!user && (
                <p className="text-destructive text-sm mb-4">
                  You must be logged in to submit a review.
                </p>
              )}

              {/* Star Rating */}
              <div className="mb-4">
                <label className="font-body text-sm mb-2 block">Your Rating</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={cn(
                          "w-8 h-8 transition-colors",
                          star <= (hoverRating || rating)
                            ? "text-gold fill-gold"
                            : "text-muted hover:text-gold/50"
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div className="mb-4">
                <label className="font-body text-sm mb-2 block">Review Title (optional)</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Sum up your experience"
                  className="max-w-md"
                />
              </div>

              {/* Comment */}
              <div className="mb-6">
                <label className="font-body text-sm mb-2 block">Your Review (optional)</label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience with this product..."
                  rows={4}
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={submitting || !user}>
                  {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Submit Review
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {/* Reviews List */}
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gold" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8 bg-muted/20 rounded-lg">
              <p className="text-muted-foreground">No reviews yet. Be the first to review this product!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-border pb-6 last:border-0">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={cn(
                                "w-4 h-4",
                                star <= review.rating
                                  ? "text-gold fill-gold"
                                  : "text-muted"
                              )}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(review.created_at)}
                        </span>
                      </div>
                      {review.title && (
                        <h4 className="font-display text-base mb-1">{review.title}</h4>
                      )}
                      {review.comment && (
                        <p className="font-body text-sm text-muted-foreground leading-relaxed">
                          {review.comment}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
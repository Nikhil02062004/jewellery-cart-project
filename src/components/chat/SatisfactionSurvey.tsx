import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, Send, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SatisfactionSurveyProps {
  conversationId: string;
  customerId?: string | null;
  agentId?: string | null;
  onClose: () => void;
  onSubmit: () => void;
  lowRatingThreshold?: number;
}

export const SatisfactionSurvey = ({
  conversationId,
  customerId,
  agentId,
  onClose,
  onSubmit,
  lowRatingThreshold = 3
}: SatisfactionSurveyProps) => {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const ratingLabels = [
    "",
    "Very Unsatisfied",
    "Unsatisfied",
    "Neutral",
    "Satisfied",
    "Very Satisfied"
  ];

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('chat_feedback' as any).insert({
        conversation_id: conversationId,
        customer_id: customerId,
        rating,
        feedback_text: feedback.trim() || null
      });

      if (error) throw error;

      // Send email alert for low ratings
      if (rating <= 2) {
        supabase.functions.invoke('send-satisfaction-alert', {
          body: {
            conversationId,
            rating,
            feedbackText: feedback.trim() || null,
            agentId
          }
        }).catch(err => console.log('Satisfaction alert failed:', err));
      }


      toast.success("Thank you for your feedback!");
      onSubmit();
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Failed to submit feedback");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-background border rounded-lg shadow-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">How was your experience?</h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Your feedback helps us improve our support.
      </p>

      {/* Star Rating */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="p-1 transition-transform hover:scale-110"
            >
              <Star
                className={cn(
                  "h-8 w-8 transition-colors",
                  (hoveredRating || rating) >= star
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-muted-foreground/30"
                )}
              />
            </button>
          ))}
        </div>
        {(hoveredRating || rating) > 0 && (
          <p className="text-xs text-muted-foreground">
            {ratingLabels[hoveredRating || rating]}
          </p>
        )}
      </div>

      {/* Feedback Text */}
      <Textarea
        placeholder="Any additional comments? (optional)"
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        className="min-h-[80px] text-sm resize-none"
        maxLength={500}
      />

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={onClose}
        >
          Skip
        </Button>
        <Button
          size="sm"
          className="flex-1"
          onClick={handleSubmit}
          disabled={isSubmitting || rating === 0}
        >
          <Send className="h-3 w-3 mr-2" />
          Submit
        </Button>
      </div>
    </div>
  );
};
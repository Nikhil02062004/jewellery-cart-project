import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Copy } from "lucide-react";

interface ReelDuplicateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reel: {
    id: string;
    video_url: string;
    caption: string | null;
    product_id: string | null;
    user_id: string;
  };
  onSuccess: () => void;
}

export function ReelDuplicateDialog({
  open,
  onOpenChange,
  reel,
  onSuccess,
}: ReelDuplicateDialogProps) {
  const [caption, setCaption] = useState(reel.caption || "");
  const [isLoading, setIsLoading] = useState(false);

  const handleDuplicate = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.from("reels").insert({
        video_url: reel.video_url,
        caption: caption || null,
        product_id: reel.product_id,
        user_id: reel.user_id,
        status: "pending",
        is_featured: false,
        views_count: 0,
        likes_count: 0,
      });

      if (error) throw error;

      toast.success("Reel duplicated successfully! It's now pending review.");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error duplicating reel:", error);
      toast.error("Failed to duplicate reel");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Duplicate Reel
          </DialogTitle>
          <DialogDescription>
            Create a copy of this reel with a new caption. The duplicate will need to be approved again.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="aspect-[9/16] max-h-48 bg-muted rounded-lg overflow-hidden mx-auto">
            <video
              src={reel.video_url}
              className="w-full h-full object-cover"
              muted
              preload="metadata"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="caption">New Caption</Label>
            <Textarea
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Enter a new caption for this reel..."
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to create without a caption
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleDuplicate} disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Duplicate Reel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

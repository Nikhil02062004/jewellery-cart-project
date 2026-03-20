import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ReelEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reel: {
    id: string;
    caption: string | null;
  };
  onSuccess: () => void;
}

export function ReelEditDialog({
  open,
  onOpenChange,
  reel,
  onSuccess,
}: ReelEditDialogProps) {
  const [caption, setCaption] = useState(reel.caption || "");
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("reels")
        .update({ caption })
        .eq("id", reel.id);

      if (error) throw error;

      toast.success("Reel updated successfully");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating reel:", error);
      toast.error("Failed to update reel");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Reel</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="caption">Caption</Label>
            <Textarea
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Enter caption..."
              className="mt-2"
              rows={4}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

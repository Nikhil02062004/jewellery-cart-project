import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Reel {
  id: string;
  caption: string | null;
  product_id: string | null;
}

interface SaveAsTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reel: Reel;
  userId: string;
}

export function SaveAsTemplateDialog({
  open,
  onOpenChange,
  reel,
  userId,
}: SaveAsTemplateDialogProps) {
  const [templateName, setTemplateName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!templateName.trim()) {
      toast.error("Please enter a template name");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("reel_templates").insert({
        user_id: userId,
        name: templateName.trim(),
        caption: reel.caption,
        product_id: reel.product_id,
      });

      if (error) throw error;

      toast.success("Template saved successfully!");
      setTemplateName("");
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving template:", error);
      toast.error("Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Save as Template
          </DialogTitle>
          <DialogDescription>
            Save this reel's settings as a template for quick reuse
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="template-name">Template Name</Label>
            <Input
              id="template-name"
              placeholder="e.g., Product Launch, Daily Post..."
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              autoFocus
            />
          </div>

          {reel.caption && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Caption Preview:</p>
              <p className="text-sm">{reel.caption}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, Video, X, Loader2, Plus, FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface Template {
  id: string;
  name: string;
  caption: string | null;
  product_id: string | null;
}

interface ReelUploadFormProps {
  onSuccess?: () => void;
}

export function ReelUploadForm({ onSuccess }: ReelUploadFormProps) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [productId, setProductId] = useState<string>("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const { data: products } = useQuery({
    queryKey: ["products-for-reel"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, image")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: templates } = useQuery({
    queryKey: ["user-templates-for-upload"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("reel_templates")
        .select("id, name, caption, product_id")
        .eq("user_id", user.id)
        .order("name");
      if (error) throw error;
      return data as Template[];
    },
  });

  // Apply template when selected
  useEffect(() => {
    if (selectedTemplateId && templates) {
      const template = templates.find(t => t.id === selectedTemplateId);
      if (template) {
        setCaption(template.caption || "");
        setProductId(template.product_id || "");
        toast({
          title: "Template applied",
          description: `"${template.name}" template loaded`,
        });
      }
    }
  }, [selectedTemplateId, templates]);

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast({
        title: "Invalid file type",
        description: "Please select a video file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Video must be less than 100MB",
        variant: "destructive",
      });
      return;
    }

    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
  };

  const clearVideo = () => {
    setVideoFile(null);
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
      setVideoPreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to upload reels",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    if (!videoFile) {
      toast({
        title: "No video selected",
        description: "Please select a video to upload",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = videoFile.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `reels/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("reels")
        .upload(filePath, videoFile);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("reels").getPublicUrl(filePath);

      const { error: insertError } = await supabase.from("reels").insert({
        video_url: publicUrl,
        caption: caption.trim() || null,
        product_id: productId || null,
        user_id: user.id,
        status: "approved",
      });

      if (insertError) throw insertError;

      toast({
        title: "Reel uploaded!",
        description: "Your reel is now live!",
      });

      setOpen(false);
      clearVideo();
      setCaption("");
      setProductId("none");
      setSelectedTemplateId("none");
      onSuccess?.();
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Upload Reel
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Your Jewelry Reel</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Template Selector */}
          {templates && templates.length > 0 && (
            <div className="space-y-2 p-3 bg-muted/50 rounded-lg border border-dashed">
              <Label className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4" />
                Use a Template
              </Label>
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a template to auto-fill" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No template</SelectItem>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Video</Label>
            {videoPreview ? (
              <div className="relative aspect-[9/16] max-h-[300px] bg-muted rounded-lg overflow-hidden">
                <video
                  src={videoPreview}
                  className="w-full h-full object-cover"
                  controls
                  muted
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={clearVideo}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              >
                <Video className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Click to select a video
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Max 100MB, vertical format recommended
                </p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleVideoSelect}
              className="hidden"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="caption">Caption</Label>
            <Textarea
              id="caption"
              placeholder="Describe your jewelry..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Link to Product (Optional)</Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a product" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No product link</SelectItem>
                {products?.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full gap-2" disabled={uploading || !videoFile}>
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload Reel
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

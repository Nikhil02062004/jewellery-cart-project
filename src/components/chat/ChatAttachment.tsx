import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Paperclip, X, Image, FileText, Upload, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ChatAttachmentProps {
  onAttach: (url: string, type: string) => void;
  disabled?: boolean;
}

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const ChatAttachment = ({ onAttach, disabled }: ChatAttachmentProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<{ url: string; type: string; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Invalid file type. Please upload images or documents.');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error('File too large. Maximum size is 5MB.');
      return;
    }

    setIsUploading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || 'anonymous';
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('chat-attachments')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(data.path);

      const attachmentType = file.type.startsWith('image/') ? 'image' : 'document';
      
      setPreview({
        url: publicUrl,
        type: attachmentType,
        name: file.name
      });

      onAttach(publicUrl, attachmentType);
      toast.success('File uploaded successfully');

    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const clearPreview = () => {
    setPreview(null);
  };

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {preview && (
        <div className="mb-2 p-2 bg-muted rounded-lg flex items-center gap-2">
          {preview.type === 'image' ? (
            <img src={preview.url} alt="Preview" className="h-12 w-12 object-cover rounded" />
          ) : (
            <div className="h-12 w-12 bg-primary/10 rounded flex items-center justify-center">
              <FileText className="h-6 w-6 text-primary" />
            </div>
          )}
          <span className="text-sm truncate flex-1">{preview.name}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={clearPreview}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-9"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || isUploading}
      >
        {isUploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Paperclip className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
};

interface AttachmentPreviewProps {
  url: string;
  type: string;
  className?: string;
}

export const AttachmentPreview = ({ url, type, className }: AttachmentPreviewProps) => {
  if (type === 'image') {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className={cn("block", className)}>
        <img 
          src={url} 
          alt="Attachment" 
          className="max-w-[200px] max-h-[200px] rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity" 
        />
      </a>
    );
  }

  return (
    <a 
      href={url} 
      target="_blank" 
      rel="noopener noreferrer"
      className={cn("flex items-center gap-2 p-2 bg-muted/50 rounded-lg hover:bg-muted transition-colors", className)}
    >
      <FileText className="h-5 w-5 text-primary" />
      <span className="text-sm text-primary underline">View Document</span>
    </a>
  );
};

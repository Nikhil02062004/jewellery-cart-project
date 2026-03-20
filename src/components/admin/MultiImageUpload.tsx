import { useState, useRef } from 'react';
import { Upload, X, Loader2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface GalleryImage {
  id?: string;
  url: string;
  order: number;
}

interface MultiImageUploadProps {
  productId?: string;
  images: GalleryImage[];
  onChange: (images: GalleryImage[]) => void;
}

const MultiImageUpload = ({ productId, images, onChange }: MultiImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newImages: GalleryImage[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!validTypes.includes(file.type)) {
          toast({
            title: 'Invalid file type',
            description: `${file.name} is not a valid image type.`,
            variant: 'destructive',
          });
          continue;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: 'File too large',
            description: `${file.name} is larger than 5MB.`,
            variant: 'destructive',
          });
          continue;
        }

        // Create unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `products/${productId || 'temp'}/${fileName}`;

        // Upload to Supabase storage
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          continue;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        newImages.push({
          url: publicUrl,
          order: images.length + newImages.length,
        });
      }

      if (newImages.length > 0) {
        onChange([...images, ...newImages]);
        toast({
          title: 'Images uploaded',
          description: `${newImages.length} image(s) uploaded successfully.`,
        });
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload images. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    // Reorder remaining images
    const reordered = newImages.map((img, i) => ({ ...img, order: i }));
    onChange(reordered);
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= images.length) return;
    
    const newImages = [...images];
    const [moved] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, moved);
    
    // Update order
    const reordered = newImages.map((img, i) => ({ ...img, order: i }));
    onChange(reordered);
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        multiple
        className="hidden"
      />

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {images.map((image, index) => (
            <div
              key={index}
              className="relative group aspect-square rounded-lg overflow-hidden border border-border"
            >
              <img
                src={image.url}
                alt={`Gallery ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                <button
                  type="button"
                  onClick={() => moveImage(index, index - 1)}
                  disabled={index === 0}
                  className="w-7 h-7 bg-background rounded flex items-center justify-center disabled:opacity-50"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => moveImage(index, index + 1)}
                  disabled={index === images.length - 1}
                  className="w-7 h-7 bg-background rounded flex items-center justify-center disabled:opacity-50"
                >
                  →
                </button>
              </div>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleRemove(index)}
              >
                <X className="w-3 h-3" />
              </Button>
              {index === 0 && (
                <span className="absolute bottom-1 left-1 text-[10px] bg-gold text-charcoal px-1.5 py-0.5 rounded font-body">
                  Main
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Add Gallery Images
            </>
          )}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Upload multiple images for the product gallery. First image will be the main image.
      </p>
    </div>
  );
};

export default MultiImageUpload;

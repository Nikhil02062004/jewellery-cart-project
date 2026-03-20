import { useState, useEffect } from 'react';
import { ZoomIn, ZoomOut, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface ProductImage {
  id: string;
  image_url: string;
  display_order: number;
}

interface ProductImageGalleryProps {
  productId: string;
  mainImage: string;
  productName: string;
  isNew?: boolean;
  isOnSale?: boolean;
}

export const ProductImageGallery = ({
  productId,
  mainImage,
  productName,
  isNew,
  isOnSale,
}: ProductImageGalleryProps) => {
  const [images, setImages] = useState<string[]>([mainImage]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });

  useEffect(() => {
    const fetchImages = async () => {
      const { data } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', productId)
        .order('display_order', { ascending: true });

      if (data && data.length > 0) {
        const additionalImages = data.map((img: ProductImage) => img.image_url);
        setImages([mainImage, ...additionalImages]);
      }
    };

    fetchImages();
  }, [productId, mainImage]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  };

  const nextImage = () => {
    setSelectedIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setSelectedIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div 
        className="relative aspect-square bg-muted rounded-lg overflow-hidden cursor-zoom-in group"
        onClick={() => setIsZoomed(true)}
      >
        {isNew && (
          <span className="absolute top-4 left-4 bg-charcoal text-primary-foreground font-body text-xs uppercase tracking-wider px-3 py-2 z-10">
            New
          </span>
        )}
        {isOnSale && (
          <span className="absolute top-4 right-4 bg-destructive text-destructive-foreground font-body text-xs uppercase tracking-wider px-2 py-1 rounded z-10">
            Sale
          </span>
        )}
        <img 
          src={images[selectedIndex]} 
          alt={productName}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
          <ZoomIn className="w-8 h-8 text-white" />
        </div>

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); prevImage(); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-background/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); nextImage(); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-background/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={cn(
                "flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-colors",
                selectedIndex === index ? "border-gold" : "border-transparent hover:border-gold/50"
              )}
            >
              <img 
                src={image} 
                alt={`${productName} ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Zoom Modal */}
      <Dialog open={isZoomed} onOpenChange={setIsZoomed}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-background border-none">
          <div className="relative w-full h-[90vh]">
            {/* Controls */}
            <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
              <button
                onClick={() => setZoomLevel(Math.min(3, zoomLevel + 0.5))}
                className="w-10 h-10 bg-charcoal/80 text-primary-foreground rounded-full flex items-center justify-center hover:bg-charcoal transition-colors"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
              <button
                onClick={() => setZoomLevel(Math.max(1, zoomLevel - 0.5))}
                className="w-10 h-10 bg-charcoal/80 text-primary-foreground rounded-full flex items-center justify-center hover:bg-charcoal transition-colors"
              >
                <ZoomOut className="w-5 h-5" />
              </button>
              <button
                onClick={() => { setIsZoomed(false); setZoomLevel(1); }}
                className="w-10 h-10 bg-charcoal/80 text-primary-foreground rounded-full flex items-center justify-center hover:bg-charcoal transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-charcoal/80 text-primary-foreground rounded-full flex items-center justify-center hover:bg-charcoal transition-colors z-10"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-charcoal/80 text-primary-foreground rounded-full flex items-center justify-center hover:bg-charcoal transition-colors z-10"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Zoomable Image */}
            <div 
              className="w-full h-full overflow-hidden cursor-crosshair"
              onMouseMove={handleMouseMove}
            >
              <img 
                src={images[selectedIndex]} 
                alt={productName}
                className="w-full h-full object-contain transition-transform duration-150"
                style={{ 
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`
                }}
              />
            </div>

            {/* Thumbnail Strip */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-charcoal/80 p-2 rounded-lg">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedIndex(index)}
                    className={cn(
                      "w-12 h-12 rounded overflow-hidden border-2 transition-colors",
                      selectedIndex === index ? "border-gold" : "border-transparent"
                    )}
                  >
                    <img 
                      src={image} 
                      alt={`${productName} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Eye, Phone, Star, Heart, GitCompare } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCompare } from '@/contexts/CompareContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: 'silver' | 'gold' | 'artificial';
  rating: number;
  isNew?: boolean;
  description?: string;
}

interface ProductCardProps {
  product: Product;
  viewOnly?: boolean;
}

export const ProductCard = ({ product, viewOnly = false }: ProductCardProps) => {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { addToCompare, isInCompare } = useCompare();
  const [isHovered, setIsHovered] = useState(false);

  const isLiked = isInWishlist(product.id);
  const inCompare = isInCompare(product.id);

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      category: product.category,
    });
  };

  const handleToggleWishlist = () => {
    if (isLiked) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        category: product.category,
      });
    }
  };

  const handleToggleCompare = () => {
    addToCompare({
      id: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.image,
      category: product.category,
      rating: product.rating,
      description: product.description,
    });
  };

  const handleCall = () => {
    window.location.href = 'tel:+1234567890';
  };

  return (
    <div 
      className="group bg-card rounded-lg overflow-hidden hover-lift"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative aspect-square bg-muted overflow-hidden">
        {product.isNew && (
          <div className="absolute top-4 left-0 z-10">
            <span className="bg-charcoal text-primary-foreground font-body text-xs uppercase tracking-wider px-3 py-2">
              New
            </span>
          </div>
        )}
        
        {product.originalPrice && (
          <div className="absolute top-4 right-4 z-10">
            <span className="bg-destructive text-destructive-foreground font-body text-xs uppercase tracking-wider px-2 py-1 rounded">
              Sale
            </span>
          </div>
        )}

        <img 
          src={product.image} 
          alt={product.name}
          className={cn(
            "w-full h-full object-cover transition-transform duration-500",
            isHovered && "scale-110"
          )}
        />

        {/* Hover Actions */}
        <div className={cn(
          "absolute inset-0 bg-charcoal/40 flex items-center justify-center gap-3 transition-opacity duration-300",
          isHovered ? "opacity-100" : "opacity-0"
        )}>
          <button 
            onClick={handleToggleWishlist}
            className={cn(
              "w-11 h-11 rounded-full bg-background flex items-center justify-center transition-colors",
              isLiked ? "text-destructive" : "text-foreground hover:text-gold"
            )}
            title={isLiked ? "Remove from Wishlist" : "Add to Wishlist"}
          >
            <Heart className={cn("w-5 h-5", isLiked && "fill-current")} />
          </button>
          <Link 
            to={`/product/${product.id}`}
            className="w-11 h-11 rounded-full bg-background flex items-center justify-center text-foreground hover:text-gold transition-colors"
            title="View Details"
          >
            <Eye className="w-5 h-5" />
          </Link>
          <button 
            onClick={handleToggleCompare}
            className={cn(
              "w-11 h-11 rounded-full bg-background flex items-center justify-center transition-colors",
              inCompare ? "text-gold" : "text-foreground hover:text-gold"
            )}
            title={inCompare ? "In Compare List" : "Add to Compare"}
          >
            <GitCompare className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Rating */}
        <div className="flex items-center gap-1 mb-2">
          {[...Array(5)].map((_, i) => (
            <Star 
              key={i} 
              className={cn(
                "w-3.5 h-3.5",
                i < product.rating ? "text-gold fill-gold" : "text-muted"
              )} 
            />
          ))}
        </div>

        {/* Name */}
        <h3 className="font-display text-lg font-medium mb-2 line-clamp-1">
          {product.name}
        </h3>

        {/* Price */}
        <div className="flex items-center gap-2 mb-4">
          <span className="font-body text-lg text-gold">
            ₹{product.price.toLocaleString()}
          </span>
          {product.originalPrice && (
            <span className="font-body text-sm text-muted-foreground line-through">
              ₹{product.originalPrice.toLocaleString()}
            </span>
          )}
        </div>

        {/* Actions */}
        {viewOnly ? (
          <div className="space-y-2">
            <Button variant="elegant" className="w-full" size="sm">
              <Eye className="w-4 h-4" />
              View Details
            </Button>
            <Button variant="outline" className="w-full" size="sm" onClick={handleCall}>
              <Phone className="w-4 h-4" />
              Inquire Now
            </Button>
          </div>
        ) : (
          <Button 
            onClick={handleAddToCart}
            className="w-full"
            size="sm"
          >
            <ShoppingBag className="w-4 h-4" />
            Add to Cart
          </Button>
        )}
      </div>
    </div>
  );
};

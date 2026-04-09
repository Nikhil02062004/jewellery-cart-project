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
  base_metal_rate_per_gram?: number | null;
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
      base_metal_rate_per_gram: product.base_metal_rate_per_gram,
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
      className="group bg-white rounded-2xl overflow-hidden border border-gray-100/50 shadow-soft hover:shadow-xl transition-all duration-500 flex flex-col h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/5] overflow-hidden bg-gray-50">
        {/* Badges */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
          {product.isNew && (
            <div className="px-3 py-1.5 rounded-full glass-card border-white/40 bg-charcoal/10 backdrop-blur-md">
              <span className="text-[10px] font-black uppercase tracking-widest text-charcoal">New Arrival</span>
            </div>
          )}
          {product.originalPrice && (
            <div className="px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 backdrop-blur-md">
              <span className="text-[10px] font-black uppercase tracking-widest text-red-600">
                -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
              </span>
            </div>
          )}
        </div>
        
        {/* Wishlist Toggle - Persistent on mobile, Hover on desktop? Actually better persistent for reachability */}
        <button 
          onClick={handleToggleWishlist}
          className={cn(
            "absolute top-3 right-3 z-10 w-10 h-10 rounded-full glass-card border-white/40 flex items-center justify-center transition-all active:scale-75",
            isLiked ? "bg-red-500/10 text-red-500" : "bg-white/40 text-charcoal/60 hover:bg-white/60"
          )}
        >
          <Heart className={cn("w-5 h-5 transition-transform", isLiked && "fill-current scale-110")} />
        </button>

        <Link to={`/product/${product.id}`} className="block w-full h-full">
          <img 
            src={product.image} 
            alt={product.name}
            className={cn(
              "w-full h-full object-cover transition-transform duration-700 ease-out",
              isHovered ? "scale-110" : "scale-100"
            )}
          />
        </Link>

        {/* Desktop Quick Actions Overlay */}
        <div className={cn(
          "absolute inset-0 bg-charcoal/30 backdrop-blur-[2px] hidden md:flex items-center justify-center gap-4 transition-opacity duration-300",
          isHovered ? "opacity-100" : "opacity-0 invisible"
        )}>
          <button 
            onClick={handleToggleCompare}
            className="w-12 h-12 rounded-full bg-white text-charcoal hover:bg-gold hover:text-charcoal transition-all shadow-xl flex items-center justify-center translate-y-4 group-hover:translate-y-0 duration-300 delay-75"
            title="Compare"
          >
            <GitCompare className="w-5 h-5" />
          </button>
          <Link 
            to={`/product/${product.id}`}
            className="w-12 h-12 rounded-full bg-white text-charcoal hover:bg-gold hover:text-charcoal transition-all shadow-xl flex items-center justify-center translate-y-4 group-hover:translate-y-0 duration-300"
            title="View Details"
          >
            <Eye className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Product Information */}
      <div className="p-3 md:p-5 flex flex-col flex-1">
        <div className="flex-1">
          <p className="text-[10px] uppercase tracking-widest text-gold font-bold mb-1 opacity-80">{product.category}</p>
          <h3 className="font-display text-sm md:text-lg font-bold text-charcoal mb-2 leading-tight line-clamp-2 md:line-clamp-1 group-hover:text-gold transition-colors">
            {product.name}
          </h3>
          
          <div className="flex items-center gap-2 mb-4">
            <span className="font-display text-base md:text-xl font-black text-charcoal">
              ₹{product.price.toLocaleString()}
            </span>
            {product.originalPrice && (
              <span className="text-xs text-muted-foreground line-through opacity-50">
                ₹{product.originalPrice.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* Cart CTA */}
        <div className="mt-auto pt-2">
          {viewOnly ? (
            <Button asChild variant="elegant" className="w-full h-11 md:h-12 rounded-xl text-xs uppercase tracking-widest font-black">
              <Link to={`/product/${product.id}`}>Explore Art</Link>
            </Button>
          ) : (
            <Button 
              onClick={handleAddToCart}
              className="w-full h-11 md:h-12 rounded-xl text-xs uppercase tracking-widest font-black flex items-center justify-center gap-3 active:scale-95 transition-transform"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Add to Vault</span>
              <span className="sm:hidden">Add</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

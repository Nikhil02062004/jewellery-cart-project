import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingBag, Heart, Phone, Star, Minus, Plus, ArrowLeft } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductImageGallery } from '@/components/products/ProductImageGallery';
import { ProductReviews } from '@/components/products/ProductReviews';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  price: number;
  original_price: number | null;
  image: string;
  category: string;
  rating: number;
  is_new: boolean;
  description: string | null;
  in_stock: boolean;
}

const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const { addToWishlist, isInWishlist, removeFromWishlist } = useWishlist();

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (data) {
        setProduct(data);
        
        // Fetch related products
        const { data: related } = await supabase
          .from('products')
          .select('*')
          .eq('category', data.category)
          .neq('id', id)
          .limit(4);
        
        if (related) setRelatedProducts(related);
      }
      setLoading(false);
    };

    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    for (let i = 0; i < quantity; i++) {
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        category: product.category as 'silver' | 'gold' | 'artificial',
        base_metal_rate_per_gram: (product as any).base_metal_rate_per_gram ?? null,
      });
    }
  };

  const handleWishlist = () => {
    if (!product) return;
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        category: product.category as 'silver' | 'gold' | 'artificial',
      });
    }
  };

  const isGold = product?.category === 'gold';

  if (loading) {
    return (
      <Layout>
        <section className="py-20">
          <div className="container mx-auto px-4 text-center">
            <p className="font-body text-muted-foreground">Loading...</p>
          </div>
        </section>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <section className="py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="font-display text-3xl mb-4">Product Not Found</h1>
            <Button asChild>
              <Link to="/">Back to Home</Link>
            </Button>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="py-8">
        <div className="container mx-auto px-4">
          <Link 
            to={`/${product.category}`}
            className="inline-flex items-center gap-2 font-body text-muted-foreground hover:text-gold transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to {product.category.charAt(0).toUpperCase() + product.category.slice(1)} Collection
          </Link>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Image Gallery */}
            <ProductImageGallery
              productId={product.id}
              mainImage={product.image}
              productName={product.name}
              isNew={product.is_new}
              isOnSale={!!product.original_price}
            />

            {/* Details */}
            <div>
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={cn(
                      "w-5 h-5",
                      i < product.rating ? "text-gold fill-gold" : "text-muted"
                    )} 
                  />
                ))}
                <span className="font-body text-sm text-muted-foreground ml-2">
                  ({product.rating}/5)
                </span>
              </div>

              <h1 className="font-display text-4xl md:text-5xl mb-4">{product.name}</h1>
              
              <div className="flex items-center gap-4 mb-6">
                <span className="font-display text-3xl text-gold">
                  ₹{product.price.toLocaleString()}
                </span>
                {product.original_price && (
                  <span className="font-body text-xl text-muted-foreground line-through">
                    ₹{product.original_price.toLocaleString()}
                  </span>
                )}
              </div>

              <p className="font-body text-muted-foreground mb-8 leading-relaxed">
                {product.description || 'A beautiful piece from our exclusive collection. Crafted with precision and care.'}
              </p>

              <div className="flex items-center gap-4 mb-6">
                <span className="font-body text-sm">Availability:</span>
                <span className={cn(
                  "font-body text-sm font-medium",
                  product.in_stock ? "text-green-600" : "text-destructive"
                )}>
                  {product.in_stock ? 'In Stock' : 'Out of Stock'}
                </span>
              </div>

              {isGold ? (
                <div className="space-y-4">
                  <div className="bg-gold/10 border border-gold/30 rounded-lg p-6">
                    <h3 className="font-display text-lg mb-2">Interested in this piece?</h3>
                    <p className="font-body text-sm text-muted-foreground mb-4">
                      Gold jewelry requires personalized consultation. Contact us to discuss pricing and availability.
                    </p>
                    <Button 
                      variant="elegant" 
                      className="w-full"
                      onClick={() => window.location.href = 'tel:+1234567890'}
                    >
                      <Phone className="w-4 h-4" />
                      Call to Inquire
                    </Button>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={handleWishlist}
                  >
                    <Heart className={cn("w-4 h-4", isInWishlist(product.id) && "fill-current text-destructive")} />
                    {isInWishlist(product.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Quantity Selector */}
                  <div className="flex items-center gap-4">
                    <span className="font-body text-sm">Quantity:</span>
                    <div className="flex items-center border border-border rounded-sm">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-10 h-10 flex items-center justify-center hover:bg-muted transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-12 text-center font-body">{quantity}</span>
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-10 h-10 flex items-center justify-center hover:bg-muted transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button 
                      className="flex-1"
                      onClick={handleAddToCart}
                      disabled={!product.in_stock}
                    >
                      <ShoppingBag className="w-4 h-4" />
                      Add to Cart
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={handleWishlist}
                    >
                      <Heart className={cn("w-4 h-4", isInWishlist(product.id) && "fill-current text-destructive")} />
                    </Button>
                  </div>
                </div>
              )}

              {/* Product Info */}
              <div className="mt-8 pt-8 border-t border-border">
                <div className="grid grid-cols-2 gap-4 font-body text-sm">
                  <div>
                    <span className="text-muted-foreground">Category:</span>
                    <span className="ml-2 capitalize">{product.category}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">SKU:</span>
                    <span className="ml-2">{product.id.slice(0, 8).toUpperCase()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Reviews */}
      <ProductReviews productId={product.id} />

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="font-display text-3xl text-center mb-10">Related Products</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProducts.map((item) => (
                <Link key={item.id} to={`/product/${item.id}`}>
                  <ProductCard
                    product={{
                      id: item.id,
                      name: item.name,
                      price: item.price,
                      originalPrice: item.original_price ?? undefined,
                      image: item.image,
                      category: item.category as 'silver' | 'gold' | 'artificial',
                      rating: item.rating ?? 5,
                      isNew: item.is_new ?? false,
                      description: item.description ?? undefined,
                      base_metal_rate_per_gram: (item as any).base_metal_rate_per_gram ?? null,
                    }}
                    viewOnly={item.category === 'gold'}
                  />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </Layout>
  );
};

export default ProductDetailPage;

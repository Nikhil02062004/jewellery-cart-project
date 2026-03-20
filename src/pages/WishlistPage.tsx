import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';

const WishlistPage = () => {
  const { items, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();

  const handleAddToCart = (item: any) => {
    addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      category: item.category,
    });
  };

  if (items.length === 0) {
    return (
      <Layout>
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-lg mx-auto text-center">
              <Heart className="w-20 h-20 text-muted-foreground/30 mx-auto mb-6" />
              <h1 className="font-display text-3xl mb-4">Your Wishlist is Empty</h1>
              <p className="font-body text-muted-foreground mb-8">
                Save your favorite items here for later.
              </p>
              <Button asChild size="lg">
                <Link to="/silver">Browse Products</Link>
              </Button>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Hero */}
      <section className="relative h-[25vh] flex items-center justify-center bg-charcoal">
        <div className="relative z-10 text-center">
          <p className="font-body text-gold tracking-[0.3em] uppercase text-sm mb-4">My</p>
          <h1 className="font-display text-5xl md:text-6xl text-primary-foreground">Wishlist</h1>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <p className="font-body text-muted-foreground">{items.length} items in your wishlist</p>
            <Button variant="ghost" onClick={clearWishlist} className="text-destructive hover:text-destructive">
              Clear All
            </Button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {items.map((item) => (
              <div key={item.id} className="bg-card border border-border rounded-lg overflow-hidden group">
                <div className="relative aspect-square bg-muted">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeFromWishlist(item.id)}
                    className="absolute top-4 right-4 w-10 h-10 bg-background rounded-full flex items-center justify-center text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-4">
                  <h3 className="font-display text-lg mb-2">{item.name}</h3>
                  <p className="font-body text-gold mb-4">₹{item.price.toLocaleString()}</p>
                  <Button onClick={() => handleAddToCart(item)} className="w-full" size="sm">
                    <ShoppingBag className="w-4 h-4" />
                    Add to Cart
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default WishlistPage;

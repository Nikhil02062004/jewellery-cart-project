import { Link } from 'react-router-dom';
import { GitCompare, X, ShoppingBag, Star } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { useCompare } from '@/contexts/CompareContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const ComparePage = () => {
  const { items, removeFromCompare, clearCompare } = useCompare();
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
              <GitCompare className="w-20 h-20 text-muted-foreground/30 mx-auto mb-6" />
              <h1 className="font-display text-3xl mb-4">No Products to Compare</h1>
              <p className="font-body text-muted-foreground mb-8">
                Add products to compare their features side by side.
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

  const specs = [
    { label: 'Category', key: 'category' },
    { label: 'Rating', key: 'rating' },
    { label: 'Description', key: 'description' },
  ];

  return (
    <Layout>
      {/* Hero */}
      <section className="relative h-[25vh] flex items-center justify-center bg-charcoal">
        <div className="relative z-10 text-center">
          <p className="font-body text-gold tracking-[0.3em] uppercase text-sm mb-4">Compare</p>
          <h1 className="font-display text-5xl md:text-6xl text-primary-foreground">Products</h1>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <p className="font-body text-muted-foreground">{items.length} of 3 products</p>
            <Button variant="ghost" onClick={clearCompare} className="text-destructive hover:text-destructive">
              Clear All
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] border-collapse">
              <thead>
                <tr>
                  <th className="p-4 text-left font-display text-lg border-b border-border">Product</th>
                  {items.map((item) => (
                    <th key={item.id} className="p-4 border-b border-border min-w-[200px]">
                      <div className="relative">
                        <button
                          onClick={() => removeFromCompare(item.id)}
                          className="absolute -top-2 -right-2 w-8 h-8 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive/80 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <Link to={`/product/${item.id}`}>
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-32 h-32 object-cover mx-auto rounded-lg mb-3"
                          />
                        </Link>
                        <h3 className="font-display text-sm mb-1">{item.name}</h3>
                        <p className="font-body text-gold">₹{item.price.toLocaleString()}</p>
                        {item.originalPrice && (
                          <p className="font-body text-xs text-muted-foreground line-through">
                            ₹{item.originalPrice.toLocaleString()}
                          </p>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {specs.map((spec) => (
                  <tr key={spec.key} className="border-b border-border">
                    <td className="p-4 font-display text-sm bg-muted/50">{spec.label}</td>
                    {items.map((item) => (
                      <td key={item.id} className="p-4 text-center font-body text-sm">
                        {spec.key === 'rating' ? (
                          <div className="flex items-center justify-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={cn(
                                  "w-4 h-4",
                                  i < (item.rating || 0) ? "text-gold fill-gold" : "text-muted"
                                )}
                              />
                            ))}
                          </div>
                        ) : spec.key === 'category' ? (
                          <span className="capitalize">{item.category}</span>
                        ) : spec.key === 'description' ? (
                          <span className="text-muted-foreground line-clamp-3">
                            {item.description || 'No description available'}
                          </span>
                        ) : (
                          (item as any)[spec.key] || '-'
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <td className="p-4 font-display text-sm bg-muted/50">Actions</td>
                  {items.map((item) => (
                    <td key={item.id} className="p-4 text-center">
                      <Button onClick={() => handleAddToCart(item)} size="sm" className="w-full max-w-[150px]">
                        <ShoppingBag className="w-4 h-4" />
                        Add to Cart
                      </Button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default ComparePage;

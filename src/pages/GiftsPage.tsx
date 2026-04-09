import { useState, useMemo } from 'react';
import { Layout } from '@/components/layout/Layout';
import { ProductCard } from '@/components/products/ProductCard';
import { SortSelect, SortOption } from '@/components/products/SortSelect';
import { useProducts } from '@/hooks/useProducts';
import { Loader2, Gift } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const GiftsPage = () => {
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [activeTab, setActiveTab] = useState<'all' | 'silver' | 'gold'>('all');
  
  const { products: silverProducts, loading: silverLoading } = useProducts('silver');
  const { products: goldProducts, loading: goldLoading } = useProducts('gold');

  const isLoading = silverLoading || goldLoading;

  const allGiftProducts = useMemo(() => {
    const silver = silverProducts || [];
    const gold = goldProducts || [];
    return [...silver, ...gold];
  }, [silverProducts, goldProducts]);

  const filteredProducts = useMemo(() => {
    let products = allGiftProducts;
    
    if (activeTab === 'silver') {
      products = silverProducts || [];
    } else if (activeTab === 'gold') {
      products = goldProducts || [];
    }

    // Sort products
    return [...products].sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'newest':
          return a.is_new ? -1 : 1;
        default:
          return 0;
      }
    });
  }, [allGiftProducts, silverProducts, goldProducts, activeTab, sortBy]);

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative h-[40vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-gold/20 via-rose-200/30 to-gold/20" />
        <div className="absolute inset-0 bg-charcoal/60" />
        <div className="relative z-10 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Gift className="w-8 h-8 text-gold" />
            <p className="font-body text-gold tracking-[0.3em] uppercase text-sm">Perfect Presents</p>
          </div>
          <h1 className="font-display text-5xl md:text-6xl text-primary-foreground mb-4">
            Gift Collection
          </h1>
          <p className="font-body text-primary-foreground/80 max-w-2xl mx-auto px-4">
            Find the perfect jewelry gift for your loved ones. From elegant silver pieces to exquisite gold treasures.
          </p>
        </div>
      </section>

      {/* Gift Categories */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="relative h-64 rounded-lg overflow-hidden group cursor-pointer" onClick={() => setActiveTab('silver')}>
              <div className="absolute inset-0 bg-gradient-to-r from-gray-400 to-gray-600" />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                <h3 className="font-display text-3xl mb-2">Silver Gifts</h3>
                <p className="font-body text-white/80">Elegant & Timeless</p>
              </div>
            </div>
            <div className="relative h-64 rounded-lg overflow-hidden group cursor-pointer" onClick={() => setActiveTab('gold')}>
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-600 to-yellow-800" />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                <h3 className="font-display text-3xl mb-2">Gold Gifts</h3>
                <p className="font-body text-white/80">Luxurious & Precious</p>
              </div>
            </div>
          </div>

          {/* Tabs and Products */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'all' | 'silver' | 'gold')}>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
              <TabsList>
                <TabsTrigger value="all">All Gifts</TabsTrigger>
                <TabsTrigger value="silver">Silver</TabsTrigger>
                <TabsTrigger value="gold">Gold</TabsTrigger>
              </TabsList>
              <SortSelect value={sortBy} onChange={setSortBy} />
            </div>

            <TabsContent value={activeTab} className="mt-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-gold" />
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-20">
                  <Gift className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">No gift items found</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
                  {filteredProducts.map((product) => (
                    <ProductCard 
                      key={product.id} 
                      product={product}
                      viewOnly={product.category === 'gold'}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Gift Guide Section */}
          <div className="mt-16 bg-card border border-border rounded-lg p-8">
            <h2 className="font-display text-2xl text-center mb-8">Gift Guide</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">💍</span>
                </div>
                <h3 className="font-display text-lg mb-2">For Her</h3>
                <p className="font-body text-sm text-muted-foreground">
                  Elegant earrings, delicate necklaces, and stunning rings perfect for any occasion.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">⌚</span>
                </div>
                <h3 className="font-display text-lg mb-2">For Him</h3>
                <p className="font-body text-sm text-muted-foreground">
                  Classic chains, sophisticated bracelets, and timeless cufflinks for the gentleman.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">💝</span>
                </div>
                <h3 className="font-display text-lg mb-2">Special Occasions</h3>
                <p className="font-body text-sm text-muted-foreground">
                  Anniversary sets, wedding jewelry, and milestone celebration pieces.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default GiftsPage;

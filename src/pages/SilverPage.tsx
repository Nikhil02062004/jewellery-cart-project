import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Grid, List, Sparkles, Loader2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { ProductCard } from '@/components/products/ProductCard';
import { GenderFilter } from '@/components/products/GenderFilter';
import { SubcategoryFilter } from '@/components/products/SubcategoryFilter';
import { SortSelect, SortOption } from '@/components/products/SortSelect';
import { PriceRangeFilter } from '@/components/products/PriceRangeFilter';
import { useProducts, ProductGender, SUBCATEGORIES } from '@/hooks/useProducts';
import { cn } from '@/lib/utils';

const SilverPage = () => {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [genderFilter, setGenderFilter] = useState<ProductGender | 'all'>('all');
  const [subcategoryFilter, setSubcategoryFilter] = useState<string | null>(null);
  
  const { products, loading, error } = useProducts('silver');

  // Calculate price range from products
  const priceRange = useMemo(() => {
    if (products.length === 0) return { min: 0, max: 100000 };
    const prices = products.map(p => Number(p.price));
    return {
      min: Math.floor(Math.min(...prices) / 100) * 100,
      max: Math.ceil(Math.max(...prices) / 100) * 100,
    };
  }, [products]);

  const [priceFilter, setPriceFilter] = useState<[number, number]>([priceRange.min, priceRange.max]);

  // Reset price filter when products load
  useMemo(() => {
    setPriceFilter([priceRange.min, priceRange.max]);
  }, [priceRange.min, priceRange.max]);

  // Filter by gender
  const genderFilteredProducts = products.filter((product) => {
    if (genderFilter === 'all') return true;
    return product.gender === genderFilter || product.gender === 'unisex';
  });

  // Filter by subcategory
  const subcategoryFilteredProducts = genderFilteredProducts.filter((product) => {
    if (!subcategoryFilter) return true;
    return product.subcategory === subcategoryFilter;
  });

  // Filter by price
  const filteredProducts = subcategoryFilteredProducts.filter((product) => {
    const price = Number(product.price);
    return price >= priceFilter[0] && price <= priceFilter[1];
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      default:
        return 0;
    }
  });

  // Get subcategories based on gender filter
  const getSubcategories = () => {
    if (genderFilter === 'all') {
      return [...new Set([...SUBCATEGORIES.silver.men, ...SUBCATEGORIES.silver.women])];
    }
    if (genderFilter === 'men') return SUBCATEGORIES.silver.men;
    return SUBCATEGORIES.silver.women;
  };

  // Reset subcategory when gender changes
  const handleGenderChange = (value: ProductGender | 'all') => {
    setGenderFilter(value);
    setSubcategoryFilter(null);
  };

  return (
    <Layout>
      {/* Hero */}
      <section className="relative h-[40vh] flex items-center justify-center bg-gradient-to-r from-silver/20 to-background">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1920')] bg-cover bg-center opacity-20" />
        <div className="relative z-10 text-center">
          <p className="font-body text-gold tracking-[0.3em] uppercase text-sm mb-4">Shop</p>
          <h1 className="font-display text-5xl md:text-6xl mb-4">Silver Collection</h1>
          <p className="font-accent text-lg text-muted-foreground">Elegant sterling silver pieces for every occasion</p>
        </div>
      </section>

      {/* Products */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {/* Gender Filter */}
          <div className="flex justify-center mb-8">
            <GenderFilter value={genderFilter} onChange={handleGenderChange} />
          </div>

          {/* Subcategory Filter */}
          <SubcategoryFilter 
            subcategories={getSubcategories()} 
            value={subcategoryFilter} 
            onChange={setSubcategoryFilter}
            className="mb-8"
          />

          {/* Price Filter */}
          <div className="flex flex-wrap items-center justify-center gap-8 mb-8">
            <PriceRangeFilter
              min={priceRange.min}
              max={priceRange.max}
              value={priceFilter}
              onChange={setPriceFilter}
            />
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-8 border-b border-border">
            <p className="font-body text-muted-foreground">
              Showing {sortedProducts.length} products
            </p>
            
            <div className="flex items-center gap-4">
              {/* Sort */}
              <SortSelect value={sortBy} onChange={setSortBy} />

              {/* View Toggle */}
              <div className="hidden md:flex items-center gap-2">
                <button 
                  onClick={() => setView('grid')}
                  className={cn(
                    "w-10 h-10 flex items-center justify-center rounded-sm border transition-colors",
                    view === 'grid' ? "border-gold text-gold" : "border-border text-muted-foreground hover:border-gold hover:text-gold"
                  )}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setView('list')}
                  className={cn(
                    "w-10 h-10 flex items-center justify-center rounded-sm border transition-colors",
                    view === 'list' ? "border-gold text-gold" : "border-border text-muted-foreground hover:border-gold hover:text-gold"
                  )}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-gold" />
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-20">
              <p className="text-destructive">Failed to load products. Please try again.</p>
            </div>
          )}

          {/* Products Grid */}
          {!loading && !error && (
            <>
              {sortedProducts.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-muted-foreground">No products found in this category.</p>
                </div>
              ) : (
                <div className={cn(
                  "grid gap-8",
                  view === 'grid' ? "sm:grid-cols-2 lg:grid-cols-4" : "grid-cols-1 lg:grid-cols-2"
                )}>
                  {sortedProducts.map((product) => (
                    <Link key={product.id} to={`/product/${product.id}`}>
                      <ProductCard 
                        product={{
                          id: product.id,
                          name: product.name,
                          price: Number(product.price),
                          originalPrice: product.original_price ? Number(product.original_price) : undefined,
                          image: product.image,
                          category: product.category,
                          rating: product.rating,
                          isNew: product.is_new,
                          description: product.description || undefined,
                        }} 
                      />
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Trust Banner */}
      <section className="py-16 bg-charcoal text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-4 mb-6">
            <span className="w-16 h-px bg-gold/30" />
            <Sparkles className="w-5 h-5 text-gold" />
            <span className="w-16 h-px bg-gold/30" />
          </div>
          <h2 className="font-display text-3xl mb-4">925 Sterling Silver</h2>
          <p className="font-accent text-primary-foreground/70 max-w-2xl mx-auto">
            All our silver jewelry is made with 92.5% pure silver, ensuring durability and a brilliant shine that lasts. 
            Each piece comes with a certificate of authenticity.
          </p>
        </div>
      </section>
    </Layout>
  );
};

export default SilverPage;

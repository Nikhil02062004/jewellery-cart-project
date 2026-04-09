import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Phone, Sparkles, Shield, Award, Loader2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { ProductCard } from '@/components/products/ProductCard';
import { GenderFilter } from '@/components/products/GenderFilter';
import { SubcategoryFilter } from '@/components/products/SubcategoryFilter';
import { SortSelect, SortOption } from '@/components/products/SortSelect';
import { PriceRangeFilter } from '@/components/products/PriceRangeFilter';
import { useProducts, ProductGender, SUBCATEGORIES } from '@/hooks/useProducts';
import { Button } from '@/components/ui/button';

const GoldPage = () => {
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [genderFilter, setGenderFilter] = useState<ProductGender | 'all'>('all');
  const [subcategoryFilter, setSubcategoryFilter] = useState<string | null>(null);
  
  const { products, loading, error } = useProducts('gold');

  // Calculate price range from products
  const priceRange = useMemo(() => {
    if (products.length === 0) return { min: 0, max: 500000 };
    const prices = products.map(p => Number(p.price));
    return {
      min: Math.floor(Math.min(...prices) / 1000) * 1000,
      max: Math.ceil(Math.max(...prices) / 1000) * 1000,
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

  // Sort products
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
      return [...new Set([...SUBCATEGORIES.gold.men, ...SUBCATEGORIES.gold.women])];
    }
    if (genderFilter === 'men') return SUBCATEGORIES.gold.men;
    return SUBCATEGORIES.gold.women;
  };

  // Reset subcategory when gender changes
  const handleGenderChange = (value: ProductGender | 'all') => {
    setGenderFilter(value);
    setSubcategoryFilter(null);
  };

  return (
    <Layout>
      {/* Hero */}
      <section className="relative h-[40vh] flex items-center justify-center bg-gradient-to-r from-gold/10 to-background">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?w=1920')] bg-cover bg-center opacity-20" />
        <div className="relative z-10 text-center">
          <p className="font-body text-gold tracking-[0.3em] uppercase text-sm mb-4">Exclusive</p>
          <h1 className="font-display text-5xl md:text-6xl mb-4">Gold Collection</h1>
          <p className="font-accent text-lg text-muted-foreground">Premium 22K gold jewelry - View & Inquire</p>
        </div>
      </section>

      {/* Notice Banner */}
      <section className="py-6 bg-gold/10 border-y border-gold/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-center">
            <Phone className="w-6 h-6 text-gold" />
            <p className="font-body">
              <span className="text-gold font-medium">Gold items are for viewing only.</span>
              {' '}Interested in a piece? Call us at{' '}
              <a href="tel:+916376538381" className="text-gold underline font-medium">+91 63765-38381</a>
              {' '}to inquire and place an order.
            </p>
          </div>
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

          <div className="flex items-center justify-between mb-8 pb-8 border-b border-border">
            <p className="font-body text-muted-foreground">
              Showing {sortedProducts.length} exclusive pieces
            </p>
            <SortSelect value={sortBy} onChange={setSortBy} />
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
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
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
                          base_metal_rate_per_gram: (product as any).base_metal_rate_per_gram ?? null,
                        }}
                        viewOnly 
                      />
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-4 mb-6">
              <span className="w-16 h-px bg-border" />
              <Sparkles className="w-5 h-5 text-gold" />
              <span className="w-16 h-px bg-border" />
            </div>
            <h2 className="font-display text-3xl mb-4">Why Choose Our Gold?</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-background rounded-lg">
              <Shield className="w-12 h-12 text-gold mx-auto mb-4" />
              <h3 className="font-display text-xl mb-2">22K Pure Gold</h3>
              <p className="font-body text-muted-foreground text-sm">
                All our gold jewelry is made with 91.6% pure gold, ensuring authentic value and lasting beauty.
              </p>
            </div>
            <div className="text-center p-8 bg-background rounded-lg">
              <Award className="w-12 h-12 text-gold mx-auto mb-4" />
              <h3 className="font-display text-xl mb-2">BIS Hallmarked</h3>
              <p className="font-body text-muted-foreground text-sm">
                Every piece comes with Bureau of Indian Standards hallmark certification for guaranteed purity.
              </p>
            </div>
            <div className="text-center p-8 bg-background rounded-lg">
              <Phone className="w-12 h-12 text-gold mx-auto mb-4" />
              <h3 className="font-display text-xl mb-2">Personal Consultation</h3>
              <p className="font-body text-muted-foreground text-sm">
                Our experts are available to guide you through your purchase and answer all your questions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-charcoal text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-3xl md:text-4xl mb-4">Interested in a Piece?</h2>
          <p className="font-accent text-primary-foreground/70 max-w-xl mx-auto mb-8">
            Contact us for pricing, availability, and to schedule a personal viewing at our store.
          </p>
          <Button asChild size="lg" variant="gold">
            <a href="tel:+1234567890">
              <Phone className="w-5 h-5" />
              Call Now: +91 63765-38381
            </a>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default GoldPage;

import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Shield, Truck, Award, Loader2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/products/ProductCard';
import { useProducts } from '@/hooks/useProducts';
import { ShopByGender } from '@/components/home/ShopByGender';
import heroImage from '@/assets/hero-jewelry.jpg';

const categories = [
  {
    title: 'Silver Collection',
    description: 'Elegant sterling silver pieces',
    image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&h=800&fit=crop',
    link: '/silver',
  },
  {
    title: 'Gold Collection',
    description: 'Premium 22K gold jewelry',
    image: 'https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?w=600&h=800&fit=crop',
    link: '/gold',
  },
  {
    title: 'Artificial Jewelry',
    description: 'Fashion-forward designs',
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&h=800&fit=crop',
    link: '/artificial',
  },
];

const features = [
  { icon: Sparkles, title: 'Premium Quality', description: 'Crafted with the finest materials' },
  { icon: Shield, title: '100% Authentic', description: 'Certified genuine products' },
  { icon: Truck, title: 'Free Shipping', description: 'On orders above ₹5000' },
  { icon: Award, title: 'Lifetime Warranty', description: 'On all gold products' },
];

const Index = () => {
  const { products, loading } = useProducts();
  const featuredProducts = products.slice(0, 4);

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative h-[85dvh] lg:h-[90vh] flex items-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105 animate-fade-in"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-charcoal/90 via-charcoal/60 to-transparent" />
          <div className="absolute inset-0 bg-black/20 lg:hidden" />
        </div>
        
        <div className="container mx-auto relative z-10 px-6">
          <div className="max-w-2xl">
            <p className="font-body text-gold tracking-[0.4em] uppercase text-[10px] md:text-sm mb-4 animate-fade-in">
              The Art of Fine Jewelry
            </p>
            <h1 className="font-display text-4xl sm:text-5xl md:text-7xl text-white mb-6 leading-[1.1] animate-slide-up">
              Timeless
              <br />
              <span className="italic text-gold">Elegance</span>
            </h1>
            <p className="font-accent text-lg md:text-xl text-white/80 mb-10 leading-relaxed max-w-lg animate-slide-up" style={{ animationDelay: '0.2s' }}>
              Discover exquisite jewelry crafted with passion. Find the perfect piece that tells your unique story.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <Button asChild size="lg" variant="gold" className="luxury-button px-10 h-14">
                <Link to="/silver">
                  Shop Now
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="px-10 h-14 border-white/30 text-white hover:bg-white/10 bg-transparent">
                <Link to="/gold">View Gold</Link>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce hidden md:block">
          <div className="w-px h-12 bg-gradient-to-b from-gold to-transparent" />
        </div>
      </section>

      {/* Features - Mobile Carousel/Grid */}
      <section className="py-12 bg-charcoal border-y border-white/5">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-4">
            {features.map((feature) => (
              <div key={feature.title} className="flex flex-col items-center text-center gap-3 text-white/90">
                <div className="w-12 h-12 rounded-full bg-gold/5 flex items-center justify-center border border-gold/10">
                  <feature.icon className="w-5 h-5 text-gold shrink-0" />
                </div>
                <div>
                  <h3 className="font-display text-xs md:text-sm font-medium tracking-wide uppercase mb-1">{feature.title}</h3>
                  <p className="font-body text-[10px] text-white/40">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-24 bg-champagne relative overflow-hidden">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">
            <div className="relative group px-4 lg:px-0">
              <div className="relative z-10 overflow-hidden rounded-2xl shadow-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=600&h=700&fit=crop" 
                  alt="Jewelry craftsmanship"
                  className="w-full h-[400px] md:h-[600px] object-cover transition-transform duration-700 group-hover:scale-110"
                />
              </div>
              <div className="absolute -bottom-6 -right-2 md:-right-10 w-40 h-40 md:w-64 md:h-64 bg-gold/10 rounded-full blur-3xl -z-10 animate-pulse" />
              <div className="absolute -top-10 -left-10 w-32 h-32 border-l-2 border-t-2 border-gold/20 rounded-tl-3xl z-0" />
            </div>
            
            <div className="px-4 lg:px-0 mt-8 lg:mt-0">
              <p className="font-body text-gold tracking-[0.3em] uppercase text-[10px] mb-4">The Legacy</p>
              <h2 className="font-display text-4xl md:text-6xl mb-8 leading-tight">
                Crafting Timeless
                <br />
                <span className="italic text-gold">Masterpieces</span>
              </h2>
              <div className="space-y-6">
                <p className="font-accent text-xl text-muted-foreground italic">
                  "Every piece we create is a blend of heritage and modern sophistication."
                </p>
                <p className="font-body text-sm text-muted-foreground leading-relaxed">
                  Jewels brings you a curated collection of fine jewelry. From the initial sketch to the final polish, our artisans pour their heart into every detail.
                </p>
              </div>
              <div className="mt-10">
                <Button asChild variant="elegant" className="luxury-button pr-8">
                  <Link to="/contact">
                    Our Story
                    <ArrowRight className="w-4 h-4 ml-3" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories - App style grid */}
      <section className="py-24 bg-white">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 px-4">
            <div className="max-w-lg">
              <p className="font-body text-gold tracking-[0.3em] uppercase text-[10px] mb-4">Curated</p>
              <h2 className="font-display text-4xl md:text-5xl">Shop By Collection</h2>
            </div>
            <Link to="/silver" className="hidden md:flex items-center gap-2 text-gold font-body text-sm uppercase tracking-widest hover:gap-4 transition-all mt-4 md:mt-0">
              Discover All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 px-4">
            {categories.map((category) => (
              <Link
                key={category.title}
                to={category.link}
                className="group relative h-[450px] overflow-hidden rounded-2xl shadow-card"
              >
                <img 
                  src={category.image}
                  alt={category.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/20 to-transparent opacity-80" />
                <div className="absolute bottom-0 left-0 right-0 p-8 transform transition-transform duration-500 group-hover:-translate-y-2">
                  <h3 className="font-display text-2xl text-white mb-2">{category.title}</h3>
                  <p className="font-body text-xs text-white/70 mb-6 max-w-[200px] leading-relaxed">{category.description}</p>
                  <div className="flex items-center gap-2 text-gold font-body text-[10px] uppercase tracking-widest">
                    <span>Explore Now</span>
                    <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-2" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
          
          <div className="mt-8 px-4 md:hidden">
            <Button asChild variant="outline" className="w-full h-14 font-body tracking-widest text-[10px] uppercase">
              <Link to="/silver">Discovery All Collections</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Shop by Gender */}
      <div className="bg-white pb-24 px-4 overflow-hidden">
        <ShopByGender />
      </div>

      {/* Featured Products */}
      <section className="py-24 bg-card border-y border-border">
        <div className="container mx-auto">
          <div className="text-center mb-16 px-4">
            <p className="font-body text-gold tracking-[0.3em] uppercase text-[10px] mb-4">Latest Arrivals</p>
            <h2 className="font-display text-4xl md:text-6xl mb-4">New Collection</h2>
            <div className="w-24 h-px bg-gold/30 mx-auto mt-6" />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-10 h-10 animate-spin text-gold" />
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 px-4">
              {featuredProducts.map((product) => (
                <ProductCard 
                  key={product.id} 
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
                />
              ))}
            </div>
          )}

          <div className="text-center mt-16 px-4">
            <Button asChild variant="elegant" size="lg" className="w-full md:w-auto px-12 h-14">
              <Link to="/silver">
                Explore Full Catalog
                <ArrowRight className="w-4 h-4 ml-3" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-charcoal relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-gold/5 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gold/5 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2" />
        </div>
        
        <div className="container mx-auto relative z-10 text-center px-6">
          <div className="max-w-3xl mx-auto backdrop-blur-sm bg-white/5 border border-white/10 p-12 md:p-20 rounded-3xl">
            <p className="font-body text-gold tracking-[0.4em] uppercase text-[10px] mb-6 animate-fade-in">Exclusive Privilege</p>
            <h2 className="font-display text-4xl md:text-6xl text-white mb-8 leading-tight">
              Join The House of
              <br />
              <span className="italic text-gold">Jewels</span>
            </h2>
            <p className="font-body text-sm md:text-lg text-white/50 mb-12 max-w-xl mx-auto leading-relaxed">
              Subscribe to receive private invitations to launches, exclusive member pricing, and 20% off your next order.
            </p>
            <div className="flex flex-col md:flex-row gap-4 justify-center max-w-md mx-auto">
              <input 
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-8 py-5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 font-body text-sm focus:outline-none focus:border-gold/50 transition-all shadow-inner"
              />
              <Button variant="gold" size="lg" className="h-[60px] md:h-auto px-10 luxury-button rounded-xl shadow-gold">
                Join Now
              </Button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;

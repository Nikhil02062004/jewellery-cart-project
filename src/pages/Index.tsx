import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Shield, Truck, Award, Loader2 } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/products/ProductCard";
import { useProducts } from "@/hooks/useProducts";
import { ShopByGender } from "@/components/home/ShopByGender";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import heroImage from "@/assets/hero-jewelry.jpg";

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

  // 🔹 Newsletter state
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubscribe = async () => {
    if (!email) {
      toast({ title: "Please enter an email", variant: "destructive" });
      return;
    }

    setSubmitting(true);

    const { error } = await supabase
      .from("newsletter_subscribers")
      .insert({ email });

    setSubmitting(false);

    if (error) {
      if (error.code === "23505") {
        toast({ title: "You are already subscribed 🎉" });
      } else {
        toast({ title: "Something went wrong", variant: "destructive" });
      }
    } else {
      toast({ title: "Subscribed successfully 🎉" });
      setEmail("");
    }
  };

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-charcoal/90 via-charcoal/70 to-transparent" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl">
            <p className="font-body text-gold tracking-[0.3em] uppercase text-sm mb-4 animate-fade-in">
              Welcome to Jewels
            </p>
            <h1 className="font-display text-5xl md:text-7xl text-primary-foreground mb-6 leading-tight animate-slide-up">
              Timeless
              <br />
              <span className="italic text-gold">Elegance</span>
            </h1>
            <p className="font-accent text-xl text-primary-foreground/80 mb-8 leading-relaxed animate-slide-up" style={{ animationDelay: '0.2s' }}>
              Discover exquisite jewelry crafted with passion. From stunning silver to radiant gold, 
              find the perfect piece that tells your unique story.
            </p>
            <div className="flex flex-wrap gap-4 animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <Button asChild size="lg" variant="gold">
                <Link to="/silver">
                  Shop Now
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="hero" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-charcoal">
                <Link to="/gold">View Gold</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 bg-charcoal">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {features.map((feature) => (
              <div key={feature.title} className="flex items-center gap-4 text-primary-foreground">
                <feature.icon className="w-8 h-8 text-gold shrink-0" />
                <div>
                  <h3 className="font-display text-sm font-medium">{feature.title}</h3>
                  <p className="font-body text-xs text-primary-foreground/60">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-24 bg-champagne">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=600&h=700&fit=crop" 
                alt="Jewelry craftsmanship"
                className="w-full h-[500px] object-cover rounded-lg shadow-card"
              />
              <div className="absolute -bottom-8 -right-8 w-48 h-48 bg-gold/10 rounded-lg -z-10" />
            </div>
            <div>
              <p className="font-body text-gold tracking-[0.2em] uppercase text-sm mb-4">About Us</p>
              <h2 className="font-display text-4xl md:text-5xl mb-6">
                Crafting Timeless
                <br />
                <span className="italic">Elegance</span>
              </h2>
              <p className="font-accent text-lg text-muted-foreground mb-6 leading-relaxed">
                At Jewels, we believe jewelry is more than an accessory—it's a story, a memory, 
                and a reflection of your unique style. Since our founding, we've been dedicated 
                to creating exquisite pieces that blend timeless design with exceptional craftsmanship.
              </p>
              <p className="font-accent text-muted-foreground mb-8 leading-relaxed">
                Each ring, necklace, and earring is thoughtfully crafted using the finest materials, 
                from sparkling gemstones to premium metals, ensuring every piece shines as brightly 
                as the moments they celebrate.
              </p>
              <Button asChild variant="elegant">
                <Link to="/contact">
                  Learn More
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <p className="font-body text-gold tracking-[0.2em] uppercase text-sm mb-4">Our Collections</p>
            <h2 className="font-display text-4xl md:text-5xl mb-4">Shop by Category</h2>
            <div className="flex items-center justify-center gap-4">
              <span className="w-16 h-px bg-border" />
              <Sparkles className="w-5 h-5 text-gold" />
              <span className="w-16 h-px bg-border" />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {categories.map((category) => (
              <Link
                key={category.title}
                to={category.link}
                className="group relative h-[450px] overflow-hidden rounded-lg"
              >
                <img 
                  src={category.image}
                  alt={category.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <h3 className="font-display text-2xl text-primary-foreground mb-2">{category.title}</h3>
                  <p className="font-body text-sm text-primary-foreground/70 mb-4">{category.description}</p>
                  <span className="inline-flex items-center gap-2 font-body text-sm text-gold uppercase tracking-wider group-hover:gap-4 transition-all">
                    Shop Now <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Shop by Gender */}
      <ShopByGender />

      {/* Featured Products */}
      <section className="py-24 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <p className="font-body text-gold tracking-[0.2em] uppercase text-sm mb-4">Featured</p>
            <h2 className="font-display text-4xl md:text-5xl mb-4">New Collection</h2>
            <p className="font-accent text-muted-foreground">Trending stunning unique pieces</p>
            <div className="flex items-center justify-center gap-4 mt-6">
              <span className="w-16 h-px bg-border" />
              <Sparkles className="w-5 h-5 text-gold" />
              <span className="w-16 h-px bg-border" />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gold" />
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
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
                  }} 
                />
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Button asChild variant="elegant" size="lg">
              <Link to="/silver">
                View All Products
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      
      <section className="py-24 bg-charcoal relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-gold rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-gold rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        </div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <p className="font-body text-gold tracking-[0.3em] uppercase text-sm mb-4">Special Offer</p>
          <h2 className="font-display text-4xl md:text-6xl text-primary-foreground mb-6">
            Get 20% Off
            <br />
            <span className="italic">Your First Order</span>
          </h2>
          <p className="font-accent text-lg text-primary-foreground/70 max-w-xl mx-auto mb-8">
            Subscribe to our newsletter and receive exclusive offers, new arrivals updates, and a special discount on your first purchase.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="flex-1 px-6 py-4 bg-transparent border border-white/30 text-white"
          />
          <Button variant="gold" size="lg" onClick={handleSubscribe} disabled={submitting}>
            {submitting ? "SUBSCRIBING..." : "SUBSCRIBE"}
          </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;

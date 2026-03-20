import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';

const genderCategories = [
  {
    title: "Men's Collection",
    description: 'Bold & refined jewelry for modern men',
    image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&h=700&fit=crop',
    link: '/silver?gender=men',
    items: ['Chains', 'Bracelets', 'Rings', 'Kadas', 'Cufflinks'],
  },
  {
    title: "Women's Collection",
    description: 'Elegant pieces for every occasion',
    image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&h=700&fit=crop',
    link: '/silver?gender=women',
    items: ['Necklaces', 'Earrings', 'Bangles', 'Anklets', 'Bridal Sets'],
  },
];

export const ShopByGender = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <p className="font-body text-gold tracking-[0.2em] uppercase text-sm mb-4">Shop by Gender</p>
          <h2 className="font-display text-4xl md:text-5xl mb-4">Find Your Perfect Style</h2>
          <div className="flex items-center justify-center gap-4">
            <span className="w-16 h-px bg-border" />
            <Sparkles className="w-5 h-5 text-gold" />
            <span className="w-16 h-px bg-border" />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {genderCategories.map((category) => (
            <Link
              key={category.title}
              to={category.link}
              className="group relative overflow-hidden rounded-lg bg-card border border-border"
            >
              <div className="relative h-[400px] overflow-hidden">
                <img 
                  src={category.image}
                  alt={category.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/40 to-transparent" />
              </div>
              
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <h3 className="font-display text-3xl text-primary-foreground mb-2">{category.title}</h3>
                <p className="font-body text-sm text-primary-foreground/70 mb-4">{category.description}</p>
                
                <div className="flex flex-wrap gap-2 mb-6">
                  {category.items.map((item) => (
                    <span 
                      key={item} 
                      className="px-3 py-1 bg-primary-foreground/10 backdrop-blur-sm rounded-full font-body text-xs text-primary-foreground/80"
                    >
                      {item}
                    </span>
                  ))}
                </div>
                
                <span className="inline-flex items-center gap-2 font-body text-sm text-gold uppercase tracking-wider group-hover:gap-4 transition-all">
                  Explore Collection <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
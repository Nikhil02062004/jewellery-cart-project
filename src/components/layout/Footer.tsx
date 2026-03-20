import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Facebook, Instagram, Twitter } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-charcoal text-primary-foreground">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-6">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 flex items-center justify-center">
                <svg viewBox="0 0 40 40" className="w-full h-full fill-gold">
                  <path d="M20 2L4 14l16 24 16-24L20 2zm0 6l10 8-10 15-10-15 10-8z" />
                </svg>
              </div>
              <span className="font-display text-2xl font-semibold tracking-wide text-gold">
                JEWELS
              </span>
            </Link>
            <p className="font-body text-sm text-primary-foreground/70 leading-relaxed">
              Crafting timeless elegance since 1990. Each piece tells a story of exceptional craftsmanship and enduring beauty.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="w-10 h-10 rounded-full border border-primary-foreground/20 flex items-center justify-center hover:border-gold hover:text-gold transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a 
  href="https://www.instagram.com/jewe.lcart?igsh=MTBoNjMzcWx4Yzl1Yw==" 
  target="_blank"
  rel="noopener noreferrer"
  title="Follow us on Instagram"
  className="w-10 h-10 rounded-full border border-primary-foreground/20 flex items-center justify-center hover:border-gold hover:text-gold transition-colors"
>
  <Instagram className="w-4 h-4" />
</a>

              <a href="#" className="w-10 h-10 rounded-full border border-primary-foreground/20 flex items-center justify-center hover:border-gold hover:text-gold transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display text-lg mb-6 text-gold">Quick Links</h4>
            <ul className="space-y-3">
  <li>
    <Link to="/" className="hover:text-gold transition">
      Home
    </Link>
  </li>

  <li>
    <Link to="/silver" className="hover:text-gold transition">
      Silver Collection
    </Link>
  </li>

  <li>
    <Link to="/gold" className="hover:text-gold transition">
      Gold Collection
    </Link>
  </li>

  <li>
    <Link to="/artificial" className="hover:text-gold transition">
      Artificial Jewelry
    </Link>
  </li>

  <li>
    <Link to="/about" className="hover:text-gold transition">
      About Us
    </Link>
  </li>
</ul>

          </div>

          {/* Customer Service */}
          <div>
            <h4 className="font-display text-lg mb-6 text-gold">Customer Service</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/track-order" className="font-body text-sm text-primary-foreground/70 hover:text-gold transition-colors">
                  Track Order
                </Link>
              </li>
              <li>
                <Link to="/shipping" className="font-body text-sm text-primary-foreground/70 hover:text-gold transition-colors">
                  Shipping Info
                </Link>
              </li>
              <li>
                <Link to="/returns" className="font-body text-sm text-primary-foreground/70 hover:text-gold transition-colors">
                  Returns & Exchange
                </Link>
              </li>
              <li>
                <Link to="/size-guide" className="font-body text-sm text-primary-foreground/70 hover:text-gold transition-colors">
                  Size Guide
                </Link>
              </li>
              <li>
                <Link to="/faq" className="font-body text-sm text-primary-foreground/70 hover:text-gold transition-colors">
                  FAQs
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display text-lg mb-6 text-gold">Contact Us</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                <span className="font-body text-sm text-primary-foreground/70">
                  Mahaveer Jewellers, Near Power House, Ganesh Mandir, Sardarshahar, Churu,Rajasthan - 331403
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gold shrink-0" />
                <a href="tel:+916377365363" className="font-body text-sm text-primary-foreground/70 hover:text-gold transition-colors">
                  +91 63773-65363
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gold shrink-0" />
                <a href="mailto:ndhalla78@gmail.com" className="font-body text-sm text-primary-foreground/70 hover:text-gold transition-colors">
                  ndhalla78@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-primary-foreground/10 text-center">
          <p className="font-body text-sm text-primary-foreground/50">
            © 2024 Jewels. All rights reserved. Crafted with love.
          </p>
        </div>
      </div>
    </footer>
  );
};

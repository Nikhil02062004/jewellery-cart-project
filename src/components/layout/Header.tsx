import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ShoppingBag, Search, Phone, ChevronDown, User } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { SearchDialog } from './SearchDialog';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { supabase } from "@/integrations/supabase/client";
import { cn } from '@/lib/utils';

interface NavItem {
  name: string;
  path?: string;
  children?: { name: string; path: string }[];
}

const navLinks: NavItem[] = [
  { name: 'Home', path: '/' },
  { 
    name: 'Shop', 
    children: [
      { name: 'Silver Collection', path: '/silver' },
      { name: 'Gold Collection', path: '/gold' },
      { name: 'Artificial Jewelry', path: '/artificial' },
    ]
  },
  { name: 'Reels', path: '/reels' },
  { 
    name: 'Pages', 
    children: [
      { name: 'Shopping Cart', path: '/cart' },
      { name: 'Checkout', path: '/checkout' },
      { name: 'Wishlist', path: '/wishlist' },
      { name: 'Login & Register', path: '/auth' },
      { name: 'My Account', path: '/account' },
    ]
  },
  { name: 'Contact', path: '/contact' },
];

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { totalItems, setIsCartOpen } = useCart();
  const location = useLocation();

  // ✅ ADMIN CHECK
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();

      if (data?.user?.email === "2022ucp1777@mnit.ac.in") {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    };

    checkUser();
  }, []);


  const handleDropdownEnter = (name: string) => {
    setOpenDropdown(name);
  };

  const handleDropdownLeave = () => {
    setOpenDropdown(null);
  };
  

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-charcoal text-primary-foreground">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
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

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <div 
                key={link.name}
                className="relative"
                onMouseEnter={() => link.children && handleDropdownEnter(link.name)}
                onMouseLeave={handleDropdownLeave}
              >
                {link.path ? (
                  <Link
                    to={link.path}
                    className={cn(
                      "relative font-body text-sm tracking-wider uppercase transition-colors duration-300 flex items-center gap-1",
                      location.pathname === link.path
                        ? "text-gold"
                        : "text-primary-foreground/80 hover:text-gold"
                    )}
                  >
                    {link.name}
                    {location.pathname === link.path && (
                      <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gold" />
                    )}
                  </Link>
                ) : (
                  <button
                    className={cn(
                      "relative font-body text-sm tracking-wider uppercase transition-colors duration-300 flex items-center gap-1",
                      link.children?.some(child => location.pathname === child.path)
                        ? "text-gold"
                        : "text-primary-foreground/80 hover:text-gold"
                    )}
                  >
                    {link.name}
                    <ChevronDown className={cn(
                      "w-4 h-4 transition-transform",
                      openDropdown === link.name && "rotate-180"
                    )} />
                  </button>
                )}

                {/* Dropdown */}
                {link.children && openDropdown === link.name && (
                  <div className="absolute top-full left-0 pt-2 animate-fade-in">
                    <div className="bg-background border border-border rounded-sm shadow-card py-2 min-w-[200px]">
                      {link.children
                        .filter((child) => {
                        // ❌ hide My Reels for customers
                        if (child.name === "My Reels" && !isAdmin) {
                          return false;
                        }
                        return true;
                      })
                      .map((child) => (
                        <Link
                          key={child.path}
                          to={child.path}
                          className={cn(
                            "block px-4 py-2 font-body text-sm transition-colors",
                            location.pathname === child.path
                              ? "text-gold bg-gold/5"
                              : "text-foreground hover:text-gold hover:bg-gold/5"
                          )}
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center justify-center w-10 h-10 text-primary-foreground/80 hover:text-gold transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>

            <NotificationBell />

            <Link 
              to="/account" 
              className="hidden md:flex items-center justify-center w-10 h-10 text-primary-foreground/80 hover:text-gold transition-colors"
            >
              <User className="w-5 h-5" />
            </Link>
            
            <a 
              href="tel:+916377365363" 
              className="hidden lg:flex items-center gap-2 text-sm text-primary-foreground/80 hover:text-gold transition-colors"
            >
              <Phone className="w-4 h-4" />
              <span className="font-body">Call Us</span>
            </a>

            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center justify-center w-10 h-10 text-primary-foreground/80 hover:text-gold transition-colors"
            >
              <ShoppingBag className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-gold text-charcoal text-xs font-semibold rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden flex items-center justify-center w-10 h-10 text-primary-foreground/80 hover:text-gold transition-colors"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="lg:hidden py-6 border-t border-primary-foreground/10 animate-fade-in">
            <div className="flex flex-col gap-2">
              {/* Mobile Search Button */}
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsSearchOpen(true);
                }}
                className="flex items-center gap-3 text-primary-foreground/80 hover:text-gold transition-colors py-3 border-b border-primary-foreground/10 mb-2"
              >
                <Search className="w-5 h-5" />
                <span className="font-body text-base">Search Products</span>
              </button>
              
              {navLinks.map((link) => (
                <div key={link.name}>
                  {link.path ? (
                    <Link
                      to={link.path}
                      onClick={() => setIsMenuOpen(false)}
                      className={cn(
                        "font-body text-base tracking-wider uppercase py-2 block transition-colors",
                        location.pathname === link.path
                          ? "text-gold"
                          : "text-primary-foreground/80 hover:text-gold"
                      )}
                    >
                      {link.name}
                    </Link>
                  ) : (
                    <div>
                      <button
                        onClick={() => setOpenDropdown(openDropdown === link.name ? null : link.name)}
                        className="font-body text-base tracking-wider uppercase py-2 flex items-center gap-2 text-primary-foreground/80"
                      >
                        {link.name}
                        <ChevronDown className={cn(
                          "w-4 h-4 transition-transform",
                          openDropdown === link.name && "rotate-180"
                        )} />
                      </button>
                      {link.children && openDropdown === link.name && (
                        <div className="pl-4 border-l border-gold/30 ml-2">
                          {link.children.map((child) => (
                            <Link
                              key={child.path}
                              to={child.path}
                              onClick={() => setIsMenuOpen(false)}
                              className={cn(
                                "font-body text-sm py-2 block transition-colors",
                                location.pathname === child.path
                                  ? "text-gold"
                                  : "text-primary-foreground/60 hover:text-gold"
                              )}
                            >
                              {child.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              <div className="flex items-center gap-4 pt-4 border-t border-primary-foreground/10 mt-2">
                <Link
                  to="/account"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2 text-primary-foreground/80 hover:text-gold transition-colors py-2"
                >
                  <User className="w-4 h-4" />
                  <span className="font-body">My Account</span>
                </Link>
              </div>
              <a 
                href="tel:+916377365363" 
                className="flex items-center gap-2 text-primary-foreground/80 hover:text-gold transition-colors py-2"
              >
                <Phone className="w-4 h-4" />
                <span className="font-body">+ 91 63773-65363</span>
              </a>
            </div>
          </nav>
        )}
      </div>

      {/* Search Dialog */}
      <SearchDialog isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </header>
  );
};

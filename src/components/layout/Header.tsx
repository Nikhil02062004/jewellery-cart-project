import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ShoppingBag, Search, Phone, ChevronDown, User } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { SearchDialog } from './SearchDialog';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAdminRole } from '@/hooks/useAdminRole';

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
      { name: 'My Reels', path: '/my-reels' },
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
  const { isAdmin } = useAdminRole();   // ✅ DB-backed role check
  const { totalItems, setIsCartOpen } = useCart();
  const location = useLocation();


  const handleDropdownEnter = (name: string) => {
    setOpenDropdown(name);
  };

  const handleDropdownLeave = () => {
    setOpenDropdown(null);
  };
  

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-charcoal/95 backdrop-blur-md text-primary-foreground shadow-soft transition-all duration-300">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20 md:h-24">
          {/* Logo - Centered on Mobile */}
          <div className="flex-1 lg:flex-none flex items-center justify-start md:justify-start">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 flex items-center justify-center transition-transform duration-300 group-hover:rotate-12">
                <svg viewBox="0 0 40 40" className="w-full h-full fill-gold">
                  <path d="M20 2L4 14l16 24 16-24L20 2zm0 6l10 8-10 15-10-15 10-8z" />
                </svg>
              </div>
              <span className="font-display text-xl md:text-2xl font-bold tracking-widest text-white">
                JEWELS
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-10">
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
                      "relative font-body text-[13px] tracking-[0.2em] uppercase transition-all duration-300 flex items-center gap-1",
                      location.pathname === link.path
                        ? "text-gold"
                        : "text-white/70 hover:text-white"
                    )}
                  >
                    {link.name}
                    {location.pathname === link.path && (
                      <span className="absolute -bottom-2 left-0 right-0 h-0.5 bg-gradient-gold shadow-gold animate-scale-in" />
                    )}
                  </Link>
                ) : (
                  <button
                    className={cn(
                      "relative font-body text-[13px] tracking-[0.2em] uppercase transition-all duration-300 flex items-center gap-1",
                      link.children?.some(child => location.pathname === child.path)
                        ? "text-gold"
                        : "text-white/70 hover:text-white"
                    )}
                  >
                    {link.name}
                    <ChevronDown className={cn(
                      "w-3.5 h-3.5 transition-transform duration-300",
                      openDropdown === link.name && "rotate-180"
                    )} />
                  </button>
                )}

                {/* Dropdown - Luxury Styling */}
                {link.children && openDropdown === link.name && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 pt-4 animate-slide-up">
                    <div className="bg-charcoal border border-white/10 rounded-lg shadow-2xl py-3 min-w-[220px] overflow-hidden">
                      <div className="absolute inset-0 bg-gold/5 pointer-events-none" />
                      {link.children
                        .filter((child) => {
                        if (child.name === "My Reels" && !isAdmin) return false;
                        return true;
                      })
                      .map((child) => (
                        <Link
                          key={child.path}
                          to={child.path}
                          className={cn(
                            "relative block px-6 py-3 font-body text-xs tracking-wider uppercase transition-all duration-300",
                            location.pathname === child.path
                              ? "text-gold bg-white/5"
                              : "text-white/60 hover:text-white hover:bg-white/5"
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
          <div className="flex items-center gap-2 md:gap-4 flex-1 lg:flex-none justify-end">
            <button 
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center justify-center w-10 h-10 text-white/70 hover:text-gold transition-all duration-300 active:scale-90"
            >
              <Search className="w-5 h-5" />
            </button>

            <div className="hidden sm:block">
              <NotificationBell />
            </div>

            <Link 
              to="/account" 
              className="hidden lg:flex items-center justify-center w-10 h-10 text-white/70 hover:text-gold transition-all duration-300 active:scale-90"
            >
              <User className="w-5 h-5" />
            </Link>

            <button
              onClick={() => setIsCartOpen(true)}
              className="group relative flex items-center justify-center w-10 h-10 text-white/70 hover:text-gold transition-all duration-300 active:scale-90"
            >
              <ShoppingBag className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-gold text-charcoal text-[10px] font-bold rounded-full flex items-center justify-center shadow-gold animate-bounce">
                  {totalItems}
                </span>
              )}
            </button>

            {/* Mobile Menu Toggle - Only shows what's not in bottom nav */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden flex items-center justify-center w-10 h-10 text-white/70 hover:text-gold transition-all duration-300"
            >
              {isMenuOpen ? <X className="w-6 h-6 animate-scale-in" /> : <Menu className="w-6 h-6 animate-scale-in" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation - Drawer style for secondary links */}
        {isMenuOpen && (
          <nav className="lg:hidden absolute top-20 left-0 right-0 bg-charcoal border-t border-white/10 px-6 py-8 shadow-2xl animate-slide-up h-[calc(100vh-80px)] overflow-y-auto z-40">
            <div className="flex flex-col gap-6">
              <div className="space-y-4">
                <p className="font-body text-[10px] tracking-[0.2em] uppercase text-white/30 mb-2">Explore Collections</p>
                {navLinks.map((link) => (
                  <div key={link.name} className="border-b border-white/5 pb-4">
                    {link.path ? (
                      <Link
                        to={link.path}
                        onClick={() => setIsMenuOpen(false)}
                        className={cn(
                          "font-display text-xl tracking-wide transition-all duration-300 block",
                          location.pathname === link.path
                            ? "text-gold"
                            : "text-white/80 hover:text-gold"
                        )}
                      >
                        {link.name}
                      </Link>
                    ) : (
                      <div>
                        <button
                          onClick={() => setOpenDropdown(openDropdown === link.name ? null : link.name)}
                          className="w-full font-display text-xl tracking-wide flex items-center justify-between text-white/80"
                        >
                          {link.name}
                          <ChevronDown className={cn(
                            "w-5 h-5 transition-transform duration-300",
                            openDropdown === link.name && "rotate-180"
                          )} />
                        </button>
                        {link.children && openDropdown === link.name && (
                          <div className="mt-4 grid grid-cols-1 gap-3 pl-4 border-l border-gold/20 animate-fade-in">
                            {link.children
                              .filter((child) => {
                                if (child.name === "My Reels" && !isAdmin) return false;
                                return true;
                              })
                              .map((child) => (
                              <Link
                                key={child.path}
                                to={child.path}
                                onClick={() => setIsMenuOpen(false)}
                                className={cn(
                                  "font-body text-sm py-1 transition-colors",
                                  location.pathname === child.path
                                    ? "text-gold"
                                    : "text-white/50 hover:text-white"
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
              </div>

              <div className="pt-8 space-y-6">
                <div className="flex flex-col gap-4">
                  <a 
                    href="tel:+916377365363" 
                    className="flex items-center gap-3 text-white/60 hover:text-gold transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-gold/10">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-white/30">Assistance</p>
                      <span className="font-body text-sm">+ 91 63773-65363</span>
                    </div>
                  </a>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/5">
                  <Button asChild variant="outline" className="border-white/10 text-white hover:bg-white/5 bg-transparent">
                    <Link to="/auth" onClick={() => setIsMenuOpen(false)}>Login</Link>
                  </Button>
                  <Button asChild variant="gold">
                    <Link to="/silver" onClick={() => setIsMenuOpen(false)}>Shop Now</Link>
                  </Button>
                </div>
              </div>
            </div>
          </nav>
        )}
      </div>

      {/* Search Dialog */}
      <SearchDialog isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </header>
  );
};
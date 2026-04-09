import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, PlayCircle, User, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export const MobileBottomNav = () => {
  const location = useLocation();

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Shop', path: '/silver', icon: ShoppingBag },
    { name: 'Reels', path: '/reels', icon: PlayCircle },
    { name: 'Account', path: '/account', icon: User },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-t border-border px-6 pb-safe text-foreground shadow-[0_-4px_16px_rgba(0,0,0,0.05)]">
      <div className="flex h-16 items-center justify-between max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 min-w-[64px] transition-colors",
                isActive ? "text-gold" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("w-6 h-6", isActive && "animate-scale-in")} />
              <span className="text-[10px] font-medium uppercase tracking-wider">
                {item.name}
              </span>
              {isActive && (
                <span className="absolute bottom-1 w-1 h-1 bg-gold rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

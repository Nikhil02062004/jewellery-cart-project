import { Link } from 'react-router-dom';
import { GitCompare } from 'lucide-react';
import { useCompare } from '@/contexts/CompareContext';
import { cn } from '@/lib/utils';

export const CompareFloatingButton = () => {
  const { items } = useCompare();

  if (items.length === 0) return null;

  return (
    <Link
      to="/compare"
      className={cn(
        "fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-gold text-charcoal rounded-full shadow-lg hover:bg-gold/90 transition-all font-body text-sm font-medium",
        "animate-in slide-in-from-bottom-4"
      )}
    >
      <GitCompare className="w-5 h-5" />
      Compare ({items.length})
    </Link>
  );
};

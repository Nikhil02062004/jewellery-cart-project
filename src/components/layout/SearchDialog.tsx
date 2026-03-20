import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Loader2 } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface SearchResult {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
}

interface SearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchDialog = ({ isOpen, onClose }: SearchDialogProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const searchProducts = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    const { data } = await supabase
      .from('products')
      .select('id, name, price, image, category')
      .ilike('name', `%${searchQuery}%`)
      .limit(8);

    setResults(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    const debounce = setTimeout(() => {
      searchProducts(query);
    }, 300);

    return () => clearTimeout(debounce);
  }, [query, searchProducts]);

  const handleSelect = (productId: string) => {
    navigate(`/product/${productId}`);
    onClose();
    setQuery('');
    setResults([]);
  };

  const handleClose = () => {
    onClose();
    setQuery('');
    setResults([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0 bg-background">
        <div className="flex items-center border-b border-border px-4">
          <Search className="w-5 h-5 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for jewelry..."
            className="border-0 focus-visible:ring-0 font-body text-base h-14"
            autoFocus
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gold" />
            </div>
          )}

          {!loading && query.length >= 2 && results.length === 0 && (
            <div className="py-8 text-center">
              <p className="font-body text-muted-foreground">No products found for "{query}"</p>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="py-2">
              {results.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleSelect(product.id)}
                  className="w-full flex items-center gap-4 px-4 py-3 hover:bg-muted transition-colors text-left"
                >
                  <div className="w-14 h-14 rounded-md overflow-hidden bg-muted flex-shrink-0">
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body font-medium truncate">{product.name}</p>
                    <div className="flex items-center gap-2">
                      <span className="font-body text-sm text-gold">₹{product.price.toLocaleString()}</span>
                      <span className="font-body text-xs text-muted-foreground capitalize">• {product.category}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {!loading && query.length < 2 && (
            <div className="py-8 text-center">
              <p className="font-body text-muted-foreground">Start typing to search...</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {['Rings', 'Necklaces', 'Earrings', 'Bracelets'].map((term) => (
                  <button
                    key={term}
                    onClick={() => setQuery(term)}
                    className="px-3 py-1.5 bg-muted rounded-full font-body text-sm hover:bg-gold/10 hover:text-gold transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

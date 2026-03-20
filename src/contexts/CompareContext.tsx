import { useState, createContext, useContext, useCallback } from 'react';
import { toast } from 'sonner';

export interface CompareItem {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: 'silver' | 'gold' | 'artificial';
  rating: number;
  description?: string;
}

interface CompareContextType {
  items: CompareItem[];
  addToCompare: (item: CompareItem) => void;
  removeFromCompare: (id: string) => void;
  isInCompare: (id: string) => boolean;
  clearCompare: () => void;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export const CompareProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CompareItem[]>([]);

  const addToCompare = useCallback((item: CompareItem) => {
    setItems((prev) => {
      if (prev.find((i) => i.id === item.id)) {
        toast.info('Already in compare list');
        return prev;
      }
      if (prev.length >= 3) {
        toast.error('You can only compare up to 3 products');
        return prev;
      }
      toast.success('Added to compare');
      return [...prev, item];
    });
  }, []);

  const removeFromCompare = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const isInCompare = useCallback((id: string) => {
    return items.some((item) => item.id === id);
  }, [items]);

  const clearCompare = useCallback(() => {
    setItems([]);
  }, []);

  return (
    <CompareContext.Provider
      value={{
        items,
        addToCompare,
        removeFromCompare,
        isInCompare,
        clearCompare,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
};

export const useCompare = () => {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error('useCompare must be used within a CompareProvider');
  }
  return context;
};

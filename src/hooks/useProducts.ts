import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type ProductGender = 'men' | 'women' | 'unisex';

export interface Product {
  id: string;
  name: string;
  price: number;
  original_price: number | null;
  image: string;
  category: 'silver' | 'gold' | 'artificial';
  gender: ProductGender;
  subcategory: string | null;
  rating: number;
  is_new: boolean;
  description: string | null;
  in_stock: boolean;
  created_at: string;
}

export interface UseProductsOptions {
  category?: 'silver' | 'gold' | 'artificial';
  gender?: ProductGender;
  subcategory?: string;
}

export const useProducts = (categoryOrOptions?: 'silver' | 'gold' | 'artificial' | UseProductsOptions) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Normalize options
  const options: UseProductsOptions = typeof categoryOrOptions === 'string' 
    ? { category: categoryOrOptions } 
    : categoryOrOptions || {};

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        let query = supabase.from('products').select('*');
        
        if (options.category) {
          query = query.eq('category', options.category);
        }
        
        if (options.gender && options.gender !== 'unisex') {
          query = query.or(`gender.eq.${options.gender},gender.eq.unisex`);
        }
        
        if (options.subcategory) {
          query = query.eq('subcategory', options.subcategory);
        }
        
        const { data, error: fetchError } = await query.order('created_at', { ascending: false });
        
        if (fetchError) throw fetchError;
        
        setProducts(data as Product[]);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [options.category, options.gender, options.subcategory]);

  return { products, loading, error };
};

// Subcategory definitions for each collection
export const SUBCATEGORIES = {
  gold: {
    men: [
      'Gold Chains', 'Gold Bracelets', 'Gold Kadas', 'Gold Rings', 
      'Gold Pendants', 'Gold Stud Earrings', 'Gold Cufflinks', 'Gold Tie Pins'
    ],
    women: [
      'Gold Necklaces', 'Gold Long Necklaces', 'Gold Chokers', 'Gold Pendants',
      'Gold Bangles', 'Gold Bracelets', 'Gold Rings', 'Gold Earrings',
      'Gold Nose Pins', 'Gold Anklets', 'Gold Waist Chains', 'Gold Toe Rings', 'Gold Bridal Sets'
    ]
  },
  silver: {
    men: [
      'Silver Chains', 'Silver Bracelets', 'Silver Kadas', 
      'Silver Rings', 'Silver Pendants', 'Silver Stud Earrings'
    ],
    women: [
      'Silver Necklaces', 'Silver Chains', 'Silver Pendants', 'Silver Bangles',
      'Silver Bracelets', 'Silver Rings', 'Silver Earrings', 'Silver Anklets', 'Silver Toe Rings'
    ]
  },
  artificial: {
    men: [
      'Fashion Chains', 'Fashion Bracelets', 'Fashion Rings', 
      'Fashion Pendants', 'Fashion Earrings', 'Combo Jewellery Sets'
    ],
    women: [
      'Fashion Necklaces', 'Statement Necklaces', 'Fashion Earrings', 'Bangles Sets',
      'Fashion Bracelets', 'Fashion Rings', 'Anklets', 'Body Jewellery', 'Bridal Artificial Sets'
    ]
  }
};

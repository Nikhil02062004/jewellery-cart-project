import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MetalRates {
  gold: { rate_per_gram_inr: number | null; fetched_at: string | null };
  silver: { rate_per_gram_inr: number | null; fetched_at: string | null };
}

export const useMetalPrices = () => {
  const [rates, setRates] = useState<MetalRates | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const { data, error: fnError } = await supabase.functions.invoke('get-metal-prices');
        if (fnError) throw fnError;
        setRates(data);
      } catch (err: any) {
        console.error('Metal prices fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRates();
  }, []);

  return { rates, loading, error };
};

/**
 * Calculate adjusted price for a gold/silver product based on live metal rates.
 * @param listedPrice - The price listed in the database
 * @param baseMetalRatePerGram - The metal rate/gram when the product was priced
 * @param currentRatePerGram - The current live metal rate/gram
 * @returns adjusted price, or the original price if adjustment isn't possible
 */
export const calculateAdjustedPrice = (
  listedPrice: number,
  baseMetalRatePerGram: number | null,
  currentRatePerGram: number | null
): number => {
  if (!baseMetalRatePerGram || !currentRatePerGram || baseMetalRatePerGram <= 0) {
    return listedPrice;
  }

  const percentageChange = currentRatePerGram / baseMetalRatePerGram;
  return Math.round(listedPrice * percentageChange);
};

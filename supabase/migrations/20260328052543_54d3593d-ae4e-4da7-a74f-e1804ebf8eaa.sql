
-- Add base metal rate to products (rate per gram in INR when product was priced)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS base_metal_rate_per_gram numeric DEFAULT NULL;

-- Create metal_rates table to cache daily rates
CREATE TABLE IF NOT EXISTS public.metal_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metal text NOT NULL,
  rate_per_gram_inr numeric NOT NULL,
  rate_per_oz_usd numeric NOT NULL,
  usd_inr_rate numeric NOT NULL,
  fetched_at timestamp with time zone NOT NULL DEFAULT now(),
  source text DEFAULT 'freegoldapi'
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_metal_rates_metal_fetched ON public.metal_rates (metal, fetched_at DESC);

-- Enable RLS
ALTER TABLE public.metal_rates ENABLE ROW LEVEL SECURITY;

-- Anyone can read metal rates (public data)
CREATE POLICY "Metal rates are publicly readable" ON public.metal_rates FOR SELECT USING (true);

-- Only service role can insert rates
CREATE POLICY "Service role can insert rates" ON public.metal_rates FOR INSERT WITH CHECK (true);

-- Add stock_quantity column to products table
ALTER TABLE public.products 
ADD COLUMN stock_quantity integer NOT NULL DEFAULT 100;

-- Add low_stock_threshold column
ALTER TABLE public.products 
ADD COLUMN low_stock_threshold integer NOT NULL DEFAULT 10;

-- Create index for low stock queries
CREATE INDEX idx_products_low_stock ON public.products (stock_quantity) WHERE stock_quantity <= 10;
-- Add scheduled_at column to reels table for scheduling feature
ALTER TABLE public.reels 
ADD COLUMN IF NOT EXISTS scheduled_at timestamp with time zone DEFAULT NULL;

-- Create index for faster scheduled reel queries
CREATE INDEX IF NOT EXISTS idx_reels_scheduled_at ON public.reels(scheduled_at) WHERE scheduled_at IS NOT NULL;
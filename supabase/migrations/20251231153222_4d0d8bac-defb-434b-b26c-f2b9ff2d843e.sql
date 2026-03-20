-- Add status and featured columns to reels table
ALTER TABLE public.reels 
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_reels_status ON public.reels(status);
CREATE INDEX IF NOT EXISTS idx_reels_featured ON public.reels(is_featured);

-- Allow admins to update any reel (for approval/featuring)
CREATE POLICY "Admins can update any reel" 
ON public.reels 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete any reel
CREATE POLICY "Admins can delete any reel" 
ON public.reels 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));
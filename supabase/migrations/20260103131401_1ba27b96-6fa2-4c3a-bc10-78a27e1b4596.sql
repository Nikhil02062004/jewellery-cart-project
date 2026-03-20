-- Add is_archived column to reels table
ALTER TABLE public.reels ADD COLUMN is_archived boolean NOT NULL DEFAULT false;

-- Create reel_templates table for saving reusable templates
CREATE TABLE public.reel_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  caption TEXT,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on reel_templates
ALTER TABLE public.reel_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies for reel_templates
CREATE POLICY "Users can view their own templates"
ON public.reel_templates
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own templates"
ON public.reel_templates
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates"
ON public.reel_templates
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates"
ON public.reel_templates
FOR DELETE
USING (auth.uid() = user_id);

-- Create reel_milestones table to track milestone notifications
CREATE TABLE public.reel_milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reel_id UUID NOT NULL REFERENCES public.reels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  milestone_type TEXT NOT NULL, -- 'views' or 'likes'
  milestone_value INTEGER NOT NULL, -- e.g., 100, 500, 1000
  reached_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_read BOOLEAN NOT NULL DEFAULT false
);

-- Enable RLS on reel_milestones
ALTER TABLE public.reel_milestones ENABLE ROW LEVEL SECURITY;

-- RLS policies for reel_milestones
CREATE POLICY "Users can view their own milestones"
ON public.reel_milestones
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can create milestones"
ON public.reel_milestones
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update their own milestones"
ON public.reel_milestones
FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger to update updated_at on reel_templates
CREATE TRIGGER update_reel_templates_updated_at
BEFORE UPDATE ON public.reel_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
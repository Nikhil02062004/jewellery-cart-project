-- =========================================================
-- MIGRATION: Add missing columns to reels table
-- Run this in your Supabase SQL Editor
-- =========================================================

-- 1. Add status column (default 'approved' so existing reels are visible)
ALTER TABLE public.reels
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'approved';

-- 2. Add is_featured column
ALTER TABLE public.reels
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;

-- 3. Add is_archived column
ALTER TABLE public.reels
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false;

-- 4. Add scheduled_at column
ALTER TABLE public.reels
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP WITH TIME ZONE;

-- 5. Mark ALL existing reels as 'approved' so they show on the public feed
UPDATE public.reels
  SET status = 'approved'
  WHERE status IS NULL OR status = '' OR status = 'pending';

-- 6. Create reel_templates table if not exists
CREATE TABLE IF NOT EXISTS public.reel_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  caption TEXT,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.reel_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own templates" ON public.reel_templates;
DROP POLICY IF EXISTS "Users can create their own templates" ON public.reel_templates;
DROP POLICY IF EXISTS "Users can update their own templates" ON public.reel_templates;
DROP POLICY IF EXISTS "Users can delete their own templates" ON public.reel_templates;

CREATE POLICY "Users can view their own templates"
  ON public.reel_templates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own templates"
  ON public.reel_templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own templates"
  ON public.reel_templates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own templates"
  ON public.reel_templates FOR DELETE USING (auth.uid() = user_id);

-- 7. Create reel_milestones table if not exists
CREATE TABLE IF NOT EXISTS public.reel_milestones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reel_id UUID NOT NULL REFERENCES public.reels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  milestone_type TEXT NOT NULL,
  milestone_value INTEGER NOT NULL,
  reached_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_read BOOLEAN NOT NULL DEFAULT false
);

ALTER TABLE public.reel_milestones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own milestones" ON public.reel_milestones;
DROP POLICY IF EXISTS "System can create milestones" ON public.reel_milestones;
DROP POLICY IF EXISTS "Users can update their own milestones" ON public.reel_milestones;

CREATE POLICY "Users can view their own milestones"
  ON public.reel_milestones FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can create milestones"
  ON public.reel_milestones FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own milestones"
  ON public.reel_milestones FOR UPDATE USING (auth.uid() = user_id);

-- 8. Ensure the reels storage bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
  VALUES ('reels', 'reels', true)
  ON CONFLICT (id) DO UPDATE SET public = true;

-- Done! Verify with:
-- SELECT id, status, is_featured, is_archived, video_url, created_at FROM public.reels;

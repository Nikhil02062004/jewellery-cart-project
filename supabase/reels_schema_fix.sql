-- =========================================================
-- REQUIRED FUNCTION
-- =========================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =========================================================
-- REELS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.reels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  likes_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  is_featured BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Safely add is_archived if the reels table already existed before running this script
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reels' AND column_name='is_archived') THEN
        ALTER TABLE public.reels ADD COLUMN is_archived BOOLEAN DEFAULT false;
    END IF;
END $$;

DROP TRIGGER IF EXISTS update_reels_updated_at ON public.reels;
CREATE TRIGGER update_reels_updated_at
BEFORE UPDATE ON public.reels
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.reels ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to prevent "policy already exists" errors
DROP POLICY IF EXISTS "Public reels" ON public.reels;
CREATE POLICY "Public reels" ON public.reels FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users create reels" ON public.reels;
CREATE POLICY "Users create reels" ON public.reels FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own reels" ON public.reels;
CREATE POLICY "Users update own reels" ON public.reels FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own reels" ON public.reels;
CREATE POLICY "Users delete own reels" ON public.reels FOR DELETE USING (auth.uid() = user_id);

-- =========================================================
-- COMMENTS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.reel_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reel_id UUID REFERENCES public.reels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.reel_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public comments" ON public.reel_comments;
CREATE POLICY "Public comments" ON public.reel_comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "User comments" ON public.reel_comments;
CREATE POLICY "User comments" ON public.reel_comments FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Delete own comments" ON public.reel_comments;
CREATE POLICY "Delete own comments" ON public.reel_comments FOR DELETE USING (auth.uid() = user_id);

-- =========================================================
-- LIKES
-- =========================================================
CREATE TABLE IF NOT EXISTS public.reel_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reel_id UUID REFERENCES public.reels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(reel_id, user_id)
);

ALTER TABLE public.reel_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public likes" ON public.reel_likes;
CREATE POLICY "Public likes" ON public.reel_likes FOR SELECT USING (true);

DROP POLICY IF EXISTS "User likes" ON public.reel_likes;
CREATE POLICY "User likes" ON public.reel_likes FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "User unlikes" ON public.reel_likes;
CREATE POLICY "User unlikes" ON public.reel_likes FOR DELETE USING (auth.uid() = user_id);

-- =========================================================
-- TEMPLATES
-- =========================================================
-- Consolidates your two template table definitions
CREATE TABLE IF NOT EXISTS public.reel_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  caption TEXT,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS update_reel_templates_updated_at ON public.reel_templates;
CREATE TRIGGER update_reel_templates_updated_at
BEFORE UPDATE ON public.reel_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.reel_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User templates" ON public.reel_templates;
DROP POLICY IF EXISTS "Users can view their own templates" ON public.reel_templates;
DROP POLICY IF EXISTS "Users can create their own templates" ON public.reel_templates;
DROP POLICY IF EXISTS "Users can update their own templates" ON public.reel_templates;
DROP POLICY IF EXISTS "Users can delete their own templates" ON public.reel_templates;

-- Using individual robust policies for templates
CREATE POLICY "Users can view their own templates" ON public.reel_templates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own templates" ON public.reel_templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own templates" ON public.reel_templates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own templates" ON public.reel_templates FOR DELETE USING (auth.uid() = user_id);

-- =========================================================
-- MILESTONES
-- =========================================================
-- Consolidates your two milestones definitions adding NOT NULL constraints
CREATE TABLE IF NOT EXISTS public.reel_milestones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reel_id UUID NOT NULL REFERENCES public.reels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  milestone_type TEXT NOT NULL, -- 'views' or 'likes'
  milestone_value INTEGER NOT NULL, -- e.g., 100, 500, 1000
  reached_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_read BOOLEAN NOT NULL DEFAULT false
);

ALTER TABLE public.reel_milestones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User milestones" ON public.reel_milestones;
DROP POLICY IF EXISTS "Users can view their own milestones" ON public.reel_milestones;
DROP POLICY IF EXISTS "System can create milestones" ON public.reel_milestones;
DROP POLICY IF EXISTS "Users can update their own milestones" ON public.reel_milestones;

CREATE POLICY "Users can view their own milestones" ON public.reel_milestones FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can create milestones" ON public.reel_milestones FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own milestones" ON public.reel_milestones FOR UPDATE USING (auth.uid() = user_id);

-- =========================================================
-- NOTIFICATIONS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT,
  title TEXT,
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated notifications" ON public.admin_notifications;
CREATE POLICY "Authenticated notifications" ON public.admin_notifications FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (true);

-- =========================================================
-- STORAGE
-- =========================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('reels', 'reels', true)
ON CONFLICT DO NOTHING;

DROP POLICY IF EXISTS "Public reels" ON storage.objects;
DROP POLICY IF EXISTS "Upload reels" ON storage.objects;
DROP POLICY IF EXISTS "Delete own reels" ON storage.objects;

CREATE POLICY "Public reels" ON storage.objects FOR SELECT USING (bucket_id = 'reels');
CREATE POLICY "Upload reels" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'reels' AND auth.uid() IS NOT NULL);
CREATE POLICY "Delete own reels" ON storage.objects FOR DELETE USING (bucket_id = 'reels' AND auth.uid() IS NOT NULL);

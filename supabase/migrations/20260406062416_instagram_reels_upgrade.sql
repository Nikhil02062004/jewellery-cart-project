-- Add parent_id to reel_comments for threaded replies
ALTER TABLE public.reel_comments 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.reel_comments(id) ON DELETE CASCADE;

-- Create reel_comment_likes table 
CREATE TABLE IF NOT EXISTS public.reel_comment_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES public.reel_comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(comment_id, user_id)
);

-- RLS for reel_comment_likes
ALTER TABLE public.reel_comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comment likes" 
ON public.reel_comment_likes FOR SELECT 
USING (true);

CREATE POLICY "Users can like comments" 
ON public.reel_comment_likes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike comments" 
ON public.reel_comment_likes FOR DELETE 
USING (auth.uid() = user_id);

-- Add delete policy for users to delete their own replies/comments
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'Users can delete their own comments' 
        AND tablename = 'reel_comments'
    ) THEN
        CREATE POLICY "Users can delete their own comments" 
        ON public.reel_comments FOR DELETE 
        USING (auth.uid() = user_id);
    END IF;
END
$$;

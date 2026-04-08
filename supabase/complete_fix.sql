-- =================================================================
-- COMPLETE FIX MIGRATION — Run this in Supabase SQL Editor
-- =================================================================

-- ── 1. PROFILES TABLE (Admin Role Management) ───────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  requested_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile"   ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Admins can view all profiles"       ON public.profiles FOR SELECT USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Admins can update all profiles"     ON public.profiles FOR UPDATE USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'user'
  ) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill existing users into profiles
INSERT INTO public.profiles (id, email, name, role)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)),
  'user'
FROM auth.users u
ON CONFLICT (id) DO NOTHING;

-- !! IMPORTANT: Grant yourself admin role !!
UPDATE public.profiles
  SET role = 'admin'
  WHERE email = '2022ucp1720@mnit.ac.in';

-- ── 2. REELS COLUMNS (if not yet added) ─────────────────────────
ALTER TABLE public.reels ADD COLUMN IF NOT EXISTS status        TEXT NOT NULL DEFAULT 'approved';
ALTER TABLE public.reels ADD COLUMN IF NOT EXISTS is_featured   BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.reels ADD COLUMN IF NOT EXISTS is_archived   BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.reels ADD COLUMN IF NOT EXISTS scheduled_at  TIMESTAMPTZ;

UPDATE public.reels SET status = 'approved' WHERE status IS NULL OR status = 'pending';

-- Fix unique constraint on reel_likes (prevents double-like)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'reel_likes_reel_id_user_id_key'
      AND conrelid = 'public.reel_likes'::regclass
  ) THEN
    ALTER TABLE public.reel_likes ADD CONSTRAINT reel_likes_reel_id_user_id_key UNIQUE (reel_id, user_id);
  END IF;
END $$;

-- ── 3. CHAT TABLES ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_agent_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting','active','resolved','closed')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  subject TEXT,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('customer','agent','system')),
  message TEXT NOT NULL,
  attachment_url TEXT,
  attachment_type TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.support_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  current_conversations INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chat_auto_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_keywords TEXT[] NOT NULL,
  response_message TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed default auto responses
INSERT INTO public.chat_auto_responses (trigger_keywords, response_message, priority) VALUES
  (ARRAY['order','track','tracking'], 'To track your order, go to My Account → My Orders. Your tracking details will be updated once shipped.', 10),
  (ARRAY['return','exchange','refund'], 'We accept returns within 7 days of delivery. Please contact us with your order ID and we will arrange a pickup.', 9),
  (ARRAY['price','cost','discount','offer'], 'For pricing information or special offers, please check our current collections. You can also subscribe to our newsletter for exclusive deals.', 8),
  (ARRAY['shipping','delivery','ship'], 'Standard delivery takes 5-7 business days. Express delivery (2-3 days) is available at checkout.', 7)
ON CONFLICT DO NOTHING;

-- RLS for chat
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_agents      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_auto_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers can create conversations"    ON public.chat_conversations;
DROP POLICY IF EXISTS "Customers can view own conversations"  ON public.chat_conversations;
DROP POLICY IF EXISTS "Agents can view all conversations"     ON public.chat_conversations;
DROP POLICY IF EXISTS "Agents can update conversations"       ON public.chat_conversations;

CREATE POLICY "Customers can create conversations"    ON public.chat_conversations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Customers can view own conversations"  ON public.chat_conversations FOR SELECT USING (auth.uid() = customer_id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Agents can update conversations"       ON public.chat_conversations FOR UPDATE USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' OR auth.uid() = customer_id);

DROP POLICY IF EXISTS "Users can insert messages"         ON public.chat_messages;
DROP POLICY IF EXISTS "Users can view conversation msgs"  ON public.chat_messages;

CREATE POLICY "Users can insert messages"        ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can view conversation msgs" ON public.chat_messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_conversations cc
    WHERE cc.id = conversation_id
      AND (cc.customer_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
  )
);

CREATE POLICY "Anyone can view agents"    ON public.support_agents      FOR SELECT USING (true);
CREATE POLICY "Anyone can view responses" ON public.chat_auto_responses  FOR SELECT USING (true);

-- Enable realtime for chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- ── 4. CHAT STORAGE BUCKET ───────────────────────────────────────
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-attachments', 'chat-attachments', true) ON CONFLICT DO NOTHING;

DROP POLICY IF EXISTS "Chat attachments accessible" ON storage.objects;
DROP POLICY IF EXISTS "Auth users can upload chat files" ON storage.objects;
CREATE POLICY "Chat attachments accessible"    ON storage.objects FOR SELECT USING (bucket_id = 'chat-attachments');
CREATE POLICY "Auth users can upload chat files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'chat-attachments' AND auth.uid() IS NOT NULL);

-- ── VERIFY ───────────────────────────────────────────────────────
-- SELECT email, role FROM public.profiles ORDER BY role DESC;
-- SELECT * FROM public.chat_auto_responses;

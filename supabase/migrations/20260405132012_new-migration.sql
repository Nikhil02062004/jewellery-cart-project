-- =================================================================
-- Migration: profiles (safe), reels columns, reel_likes, chat tables
-- =================================================================

-- ── 1. PROFILES TABLE ────────────────────────────────────────────
-- Create if not exists (safe for existing DBs)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  requested_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add columns that may be missing (safe ADD COLUMN IF NOT EXISTS)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name            TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email           TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role            TEXT NOT NULL DEFAULT 'user';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS requested_admin BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at      TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at      TIMESTAMPTZ NOT NULL DEFAULT now();

-- Add CHECK constraint on role if not already there (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_role_check'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('user', 'admin'));
  END IF;
END $$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile"   ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles"       ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles"     ON public.profiles;

CREATE POLICY "Users can view their own profile"   ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles"       ON public.profiles FOR SELECT USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);
CREATE POLICY "Admins can update all profiles"     ON public.profiles FOR UPDATE USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Auto-create profile on signup
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

-- Backfill existing users into profiles (safe upsert)
INSERT INTO public.profiles (id, email, name, role)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)),
  'user'
FROM auth.users u
ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      name  = COALESCE(EXCLUDED.name, public.profiles.name);

-- Grant admin to owner account
UPDATE public.profiles SET role = 'admin' WHERE email = '2022ucp1720@mnit.ac.in';

-- ── 2. REELS COLUMNS ─────────────────────────────────────────────
ALTER TABLE public.reels ADD COLUMN IF NOT EXISTS status       TEXT        DEFAULT 'approved';
ALTER TABLE public.reels ADD COLUMN IF NOT EXISTS is_featured  BOOLEAN     DEFAULT false;
ALTER TABLE public.reels ADD COLUMN IF NOT EXISTS is_archived  BOOLEAN     DEFAULT false;
ALTER TABLE public.reels ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;

UPDATE public.reels SET status = 'approved' WHERE status IS NULL OR status = 'pending';

-- ── 3. REEL_LIKES UNIQUE CONSTRAINT ──────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'reel_likes_reel_id_user_id_key'
      AND conrelid = 'public.reel_likes'::regclass
  ) THEN
    ALTER TABLE public.reel_likes ADD CONSTRAINT reel_likes_reel_id_user_id_key UNIQUE (reel_id, user_id);
  END IF;
END $$;

-- ── 4. CHAT TABLES ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_agent_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'waiting',
  priority TEXT NOT NULL DEFAULT 'normal',
  subject TEXT,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_type TEXT NOT NULL,
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

ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_agents      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_auto_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers can create conversations"   ON public.chat_conversations;
DROP POLICY IF EXISTS "Users can view own conversations"     ON public.chat_conversations;
DROP POLICY IF EXISTS "Users can update conversations"       ON public.chat_conversations;
DROP POLICY IF EXISTS "Users can insert messages"            ON public.chat_messages;
DROP POLICY IF EXISTS "Users can view conversation msgs"     ON public.chat_messages;
DROP POLICY IF EXISTS "Anyone can view agents"               ON public.support_agents;
DROP POLICY IF EXISTS "Anyone can view responses"            ON public.chat_auto_responses;

CREATE POLICY "Customers can create conversations" ON public.chat_conversations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can view own conversations"   ON public.chat_conversations FOR SELECT USING (auth.uid() = customer_id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Users can update conversations"     ON public.chat_conversations FOR UPDATE USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' OR auth.uid() = customer_id);
CREATE POLICY "Users can insert messages"          ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can view conversation msgs"   ON public.chat_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.chat_conversations cc WHERE cc.id = conversation_id AND (cc.customer_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'))
);
CREATE POLICY "Anyone can view agents"    ON public.support_agents      FOR SELECT USING (true);
CREATE POLICY "Anyone can view responses" ON public.chat_auto_responses  FOR SELECT USING (true);

-- Seed auto-responses
INSERT INTO public.chat_auto_responses (trigger_keywords, response_message, priority) VALUES
  (ARRAY['order','track'], 'To track your order, go to My Account → My Orders.', 10),
  (ARRAY['return','refund'], 'We accept returns within 7 days of delivery.', 9),
  (ARRAY['shipping','delivery'], 'Standard delivery takes 5-7 business days.', 7)
ON CONFLICT DO NOTHING;

-- ── 5. CHAT STORAGE BUCKET ───────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
  VALUES ('chat-attachments', 'chat-attachments', true)
  ON CONFLICT (id) DO UPDATE SET public = true;

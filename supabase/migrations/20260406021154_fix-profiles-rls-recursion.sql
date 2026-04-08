-- =================================================================
-- Fix: Infinite recursion in profiles RLS policies
-- Root cause: policies with subqueries that query the same table
--             trigger the policies again → infinite loop.
-- Solution:  SECURITY DEFINER function bypasses RLS entirely
--            when doing the admin role check.
-- =================================================================

-- ── Step 1: Drop the recursive policies ──────────────────────────
DROP POLICY IF EXISTS "Admins can view all profiles"   ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
-- Also drop any leftover duplicates from previous runs
DROP POLICY IF EXISTS "Users can view their own profile"   ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- ── Step 2: Create SECURITY DEFINER function ──────────────────────
-- This function runs as the table owner (postgres), bypassing RLS,
-- so there is NO recursive policy evaluation.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;

-- ── Step 3: Recreate non-recursive policies ───────────────────────
-- SELECT: users can always see their own row; admins can see all
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());       -- ✅ uses SECURITY DEFINER, no recursion

-- UPDATE: users update their own row; admins update any
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    -- prevent normal users from escalating their own role
    role = (SELECT role FROM public.profiles WHERE id = auth.uid())
    OR public.is_admin()
  );

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (public.is_admin());       -- ✅ same fix

-- INSERT: only via trigger (handle_new_user) or by admin
CREATE POLICY "Allow profile insert on signup"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id OR public.is_admin());

-- ── Step 4: Fix chat/conversation policies that also had recursion ─
-- Replace any inline subquery on profiles with is_admin()

DROP POLICY IF EXISTS "Users can view own conversations"   ON public.chat_conversations;
DROP POLICY IF EXISTS "Users can update conversations"     ON public.chat_conversations;
DROP POLICY IF EXISTS "Users can view conversation msgs"   ON public.chat_messages;

DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='chat_conversations') THEN
    EXECUTE $p$
      CREATE POLICY "Users can view own conversations"
        ON public.chat_conversations FOR SELECT
        USING (auth.uid() = customer_id OR public.is_admin());

      CREATE POLICY "Users can update conversations"
        ON public.chat_conversations FOR UPDATE
        USING (auth.uid() = customer_id OR public.is_admin());
    $p$;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='chat_messages') THEN
    EXECUTE $p$
      CREATE POLICY "Users can view conversation msgs"
        ON public.chat_messages FOR SELECT
        USING (
          EXISTS (
            SELECT 1 FROM public.chat_conversations cc
            WHERE cc.id = conversation_id
              AND (cc.customer_id = auth.uid() OR public.is_admin())
          )
        );
    $p$;
  END IF;
END $$;

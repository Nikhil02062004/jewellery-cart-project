-- Remove the overly permissive INSERT policy on admin_notifications
-- The notify_admin_on_new_order trigger uses SECURITY DEFINER which bypasses RLS,
-- so this policy is not needed and creates a spam/DoS vulnerability

DROP POLICY IF EXISTS "Anyone can insert notifications" ON public.admin_notifications;
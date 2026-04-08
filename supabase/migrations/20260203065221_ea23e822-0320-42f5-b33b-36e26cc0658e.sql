-- Drop the old INSERT policy for chat_conversations
DROP POLICY IF EXISTS "Customers can create conversations" ON public.chat_conversations;

-- Create a new policy that properly allows anonymous users to create conversations
-- The policy allows creating a conversation if:
-- 1. The customer_id is NULL (anonymous users) OR
-- 2. The customer_id matches the authenticated user's id
CREATE POLICY "Customers can create conversations" 
ON public.chat_conversations 
FOR INSERT 
WITH CHECK (
  (customer_id IS NULL) OR (customer_id = auth.uid())
);

-- Also update the SELECT policy to allow anonymous users to see their conversations
-- by tracking via session (though with RLS we can only use customer_id)
-- For now, we need to allow anonymous viewing of their own created conversation
-- This requires the conversation ID to be stored client-side
DROP POLICY IF EXISTS "Customers can view their own conversations" ON public.chat_conversations;

CREATE POLICY "Customers can view their own conversations" 
ON public.chat_conversations 
FOR SELECT 
USING (
  (customer_id IS NULL) OR
  (customer_id = auth.uid()) OR 
  (assigned_agent_id = auth.uid()) OR 
  (EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::app_role
  ))
);
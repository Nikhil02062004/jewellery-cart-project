-- Add priority column to chat_conversations
ALTER TABLE public.chat_conversations 
ADD COLUMN priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent', 'vip'));

-- Add is_vip column to track VIP customers
ALTER TABLE public.chat_conversations 
ADD COLUMN is_vip boolean DEFAULT false;

-- Create satisfaction_alerts table to track low satisfaction notifications
CREATE TABLE public.satisfaction_alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  agent_id uuid,
  rating integer NOT NULL,
  threshold integer NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on satisfaction_alerts
ALTER TABLE public.satisfaction_alerts ENABLE ROW LEVEL SECURITY;

-- Create policy for agents to view their alerts
CREATE POLICY "Agents can view their own alerts"
ON public.satisfaction_alerts
FOR SELECT
USING (
  agent_id IS NULL OR 
  agent_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Create policy for inserting alerts (via edge function with service role)
CREATE POLICY "Service role can insert alerts"
ON public.satisfaction_alerts
FOR INSERT
WITH CHECK (true);

-- Create policy for updating alerts (marking as read)
CREATE POLICY "Agents can update their alerts"
ON public.satisfaction_alerts
FOR UPDATE
USING (
  agent_id IS NULL OR 
  agent_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Enable realtime for satisfaction_alerts
ALTER PUBLICATION supabase_realtime ADD TABLE public.satisfaction_alerts;

-- Create index for faster priority-based queries
CREATE INDEX idx_chat_conversations_priority ON public.chat_conversations(priority);
CREATE INDEX idx_chat_conversations_is_vip ON public.chat_conversations(is_vip);
CREATE INDEX idx_satisfaction_alerts_agent_id ON public.satisfaction_alerts(agent_id);
CREATE INDEX idx_satisfaction_alerts_is_read ON public.satisfaction_alerts(is_read);
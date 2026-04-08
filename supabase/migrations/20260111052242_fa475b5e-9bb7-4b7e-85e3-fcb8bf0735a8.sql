-- Create typing indicators table for real-time typing status
CREATE TABLE public.chat_typing_indicators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  user_id UUID,
  user_type TEXT NOT NULL CHECK (user_type IN ('customer', 'agent')),
  is_typing BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_typing_indicators ENABLE ROW LEVEL SECURITY;

-- Policies for typing indicators
CREATE POLICY "Anyone can read typing indicators" ON public.chat_typing_indicators
  FOR SELECT USING (true);

CREATE POLICY "Users can update their typing status" ON public.chat_typing_indicators
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can modify their typing status" ON public.chat_typing_indicators
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete their typing status" ON public.chat_typing_indicators
  FOR DELETE USING (true);

-- Enable realtime for typing indicators
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_typing_indicators;

-- Create index for faster queries
CREATE INDEX idx_chat_typing_conversation ON public.chat_typing_indicators(conversation_id);
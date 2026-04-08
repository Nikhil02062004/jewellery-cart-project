-- Create storage bucket for chat attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for chat attachments
CREATE POLICY "Anyone can view chat attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-attachments');

CREATE POLICY "Authenticated users can upload chat attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'chat-attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own chat attachments"
ON storage.objects FOR DELETE
USING (bucket_id = 'chat-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add attachment_url column to chat_messages for file attachments
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS attachment_url TEXT;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS attachment_type TEXT;

-- Create agent_performance_metrics table to track agent performance
CREATE TABLE public.agent_performance_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL,
  conversation_id UUID REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  first_response_time_seconds INTEGER,
  resolution_time_seconds INTEGER,
  messages_sent INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on agent_performance_metrics
ALTER TABLE public.agent_performance_metrics ENABLE ROW LEVEL SECURITY;

-- Only admins can view agent metrics
CREATE POLICY "Admins can view agent metrics"
ON public.agent_performance_metrics FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Agents can insert their own metrics
CREATE POLICY "Agents can insert metrics"
ON public.agent_performance_metrics FOR INSERT
WITH CHECK (auth.uid() = agent_id);

-- Create function to calculate agent performance stats
CREATE OR REPLACE FUNCTION public.get_agent_performance_stats(
  p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
  agent_id UUID,
  display_name TEXT,
  total_conversations BIGINT,
  avg_response_time_seconds NUMERIC,
  avg_resolution_time_seconds NUMERIC,
  avg_satisfaction_rating NUMERIC,
  total_messages_sent BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sa.user_id as agent_id,
    sa.display_name,
    COUNT(DISTINCT cc.id) as total_conversations,
    COALESCE(AVG(apm.first_response_time_seconds), 0) as avg_response_time_seconds,
    COALESCE(AVG(apm.resolution_time_seconds), 0) as avg_resolution_time_seconds,
    COALESCE(AVG(cf.rating), 0) as avg_satisfaction_rating,
    COALESCE(SUM(apm.messages_sent), 0) as total_messages_sent
  FROM public.support_agents sa
  LEFT JOIN public.chat_conversations cc ON cc.assigned_agent_id = sa.user_id
    AND cc.created_at BETWEEN p_start_date AND p_end_date
  LEFT JOIN public.agent_performance_metrics apm ON apm.agent_id = sa.user_id
    AND apm.conversation_id = cc.id
  LEFT JOIN public.chat_feedback cf ON cf.conversation_id = cc.id
  GROUP BY sa.user_id, sa.display_name;
END;
$$;

-- Create function to get feedback analytics
CREATE OR REPLACE FUNCTION public.get_feedback_analytics(
  p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
  total_feedback BIGINT,
  avg_rating NUMERIC,
  rating_1_count BIGINT,
  rating_2_count BIGINT,
  rating_3_count BIGINT,
  rating_4_count BIGINT,
  rating_5_count BIGINT,
  feedback_with_comments BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_feedback,
    COALESCE(AVG(rating), 0) as avg_rating,
    COUNT(*) FILTER (WHERE rating = 1) as rating_1_count,
    COUNT(*) FILTER (WHERE rating = 2) as rating_2_count,
    COUNT(*) FILTER (WHERE rating = 3) as rating_3_count,
    COUNT(*) FILTER (WHERE rating = 4) as rating_4_count,
    COUNT(*) FILTER (WHERE rating = 5) as rating_5_count,
    COUNT(*) FILTER (WHERE feedback_text IS NOT NULL AND feedback_text != '') as feedback_with_comments
  FROM public.chat_feedback
  WHERE created_at BETWEEN p_start_date AND p_end_date;
END;
$$;

-- Create function to get daily feedback trends
CREATE OR REPLACE FUNCTION public.get_feedback_trends(
  p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
  date DATE,
  avg_rating NUMERIC,
  feedback_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(created_at) as date,
    COALESCE(AVG(rating), 0) as avg_rating,
    COUNT(*) as feedback_count
  FROM public.chat_feedback
  WHERE created_at BETWEEN p_start_date AND p_end_date
  GROUP BY DATE(created_at)
  ORDER BY DATE(created_at);
END;
$$;
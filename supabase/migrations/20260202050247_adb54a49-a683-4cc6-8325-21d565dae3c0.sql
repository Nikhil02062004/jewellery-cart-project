-- Create auto-responses table for chatbot
CREATE TABLE public.chat_auto_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trigger_keywords TEXT[] NOT NULL,
  response_message TEXT NOT NULL,
  category TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create agent schedules table
CREATE TABLE public.agent_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.support_agents(user_id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(agent_id, day_of_week)
);

-- Create chat analytics hourly stats table
CREATE TABLE public.chat_hourly_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hour_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  total_conversations INTEGER NOT NULL DEFAULT 0,
  avg_response_time_seconds NUMERIC,
  avg_resolution_time_seconds NUMERIC,
  resolved_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(hour_timestamp)
);

-- Enable RLS
ALTER TABLE public.chat_auto_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_hourly_stats ENABLE ROW LEVEL SECURITY;

-- Policies for auto_responses (admin can manage, anyone can read)
CREATE POLICY "Admins can manage auto responses" ON public.chat_auto_responses FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can read active auto responses" ON public.chat_auto_responses FOR SELECT USING (is_active = true);

-- Policies for agent_schedules
CREATE POLICY "Admins can manage schedules" ON public.agent_schedules FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Agents can view schedules" ON public.agent_schedules FOR SELECT USING (true);
CREATE POLICY "Agents can manage own schedule" ON public.agent_schedules FOR ALL USING (auth.uid() = agent_id);

-- Policies for hourly stats
CREATE POLICY "Admins can view chat stats" ON public.chat_hourly_stats FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "System can insert stats" ON public.chat_hourly_stats FOR INSERT WITH CHECK (true);

-- Insert default auto-responses
INSERT INTO public.chat_auto_responses (trigger_keywords, response_message, category, priority) VALUES
(ARRAY['order', 'track', 'tracking', 'shipment', 'where is'], 'To track your order, please go to your Account page and click on "Order History". You can also use our Track Order page with your order number. An agent will assist you shortly!', 'orders', 1),
(ARRAY['return', 'refund', 'exchange', 'money back'], 'For returns and refunds, please visit our Returns page. We offer free returns within 30 days. An agent will be with you shortly to help with your specific case!', 'returns', 1),
(ARRAY['size', 'sizing', 'fit', 'measurement'], 'Check out our Size Guide for detailed measurements and fitting advice. Our support team will also be happy to help you find the perfect fit!', 'products', 1),
(ARRAY['shipping', 'delivery', 'ship', 'deliver'], 'We offer free shipping on orders over ₹999. Standard delivery takes 3-5 business days. For more details, visit our Shipping Info page. An agent will connect with you soon!', 'shipping', 1),
(ARRAY['hello', 'hi', 'hey', 'help'], 'Hello! Thank you for reaching out. Our support team is currently unavailable, but we''ll respond as soon as possible. In the meantime, feel free to describe your question in detail!', 'greeting', 0);

-- Create index for faster keyword lookups
CREATE INDEX idx_auto_responses_keywords ON public.chat_auto_responses USING GIN(trigger_keywords);
CREATE INDEX idx_agent_schedules_agent ON public.agent_schedules(agent_id);
CREATE INDEX idx_chat_hourly_stats_timestamp ON public.chat_hourly_stats(hour_timestamp);
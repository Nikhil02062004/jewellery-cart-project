-- Create chat_feedback table for customer satisfaction surveys
CREATE TABLE public.chat_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  customer_id UUID,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create canned_responses table for agent quick replies
CREATE TABLE public.canned_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  category VARCHAR(50),
  shortcut VARCHAR(20),
  is_global BOOLEAN DEFAULT false,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.chat_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canned_responses ENABLE ROW LEVEL SECURITY;

-- RLS policies for chat_feedback
CREATE POLICY "Anyone can insert feedback" ON public.chat_feedback FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view all feedback" ON public.chat_feedback FOR SELECT USING (true);

-- RLS policies for canned_responses
CREATE POLICY "Anyone can view canned responses" ON public.canned_responses FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create canned responses" ON public.canned_responses FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update their own canned responses" ON public.canned_responses FOR UPDATE USING (auth.uid() = created_by OR is_global = true);
CREATE POLICY "Users can delete their own canned responses" ON public.canned_responses FOR DELETE USING (auth.uid() = created_by);

-- Add email column to support_agents for notifications
ALTER TABLE public.support_agents ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Create trigger for updated_at on canned_responses
CREATE TRIGGER update_canned_responses_updated_at
  BEFORE UPDATE ON public.canned_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default canned responses
INSERT INTO public.canned_responses (title, message, category, shortcut, is_global) VALUES
  ('Greeting', 'Hello! Thank you for contacting Lumière support. How can I assist you today?', 'general', '/hi', true),
  ('Order Status', 'I''d be happy to help you check your order status. Could you please provide your order ID?', 'orders', '/order', true),
  ('Shipping Info', 'We offer free shipping on orders over ₹5000. Standard delivery takes 3-5 business days, and express delivery takes 1-2 business days.', 'shipping', '/ship', true),
  ('Return Policy', 'We accept returns within 30 days of delivery. Items must be in original condition with tags attached. Would you like me to initiate a return for you?', 'returns', '/return', true),
  ('Thank You', 'Thank you for shopping with Lumière! Is there anything else I can help you with today?', 'general', '/thanks', true),
  ('Closing', 'It was my pleasure assisting you today. Have a wonderful day! 💎', 'general', '/bye', true);
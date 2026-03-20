-- Create notification preferences table
CREATE TABLE public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  views_100 BOOLEAN NOT NULL DEFAULT true,
  views_500 BOOLEAN NOT NULL DEFAULT true,
  views_1000 BOOLEAN NOT NULL DEFAULT true,
  views_5000 BOOLEAN NOT NULL DEFAULT true,
  views_10000 BOOLEAN NOT NULL DEFAULT true,
  views_50000 BOOLEAN NOT NULL DEFAULT true,
  views_100000 BOOLEAN NOT NULL DEFAULT true,
  likes_50 BOOLEAN NOT NULL DEFAULT true,
  likes_100 BOOLEAN NOT NULL DEFAULT true,
  likes_500 BOOLEAN NOT NULL DEFAULT true,
  likes_1000 BOOLEAN NOT NULL DEFAULT true,
  likes_5000 BOOLEAN NOT NULL DEFAULT true,
  likes_10000 BOOLEAN NOT NULL DEFAULT true,
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT notification_preferences_user_id_unique UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own notification preferences"
ON public.notification_preferences FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification preferences"
ON public.notification_preferences FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification preferences"
ON public.notification_preferences FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_notification_preferences_updated_at
BEFORE UPDATE ON public.notification_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
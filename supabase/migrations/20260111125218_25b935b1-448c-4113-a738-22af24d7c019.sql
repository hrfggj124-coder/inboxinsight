-- Enable realtime for notification_queue table
ALTER PUBLICATION supabase_realtime ADD TABLE public.notification_queue;

-- Add INSERT policy for notification_settings so users can create their own settings
CREATE POLICY "Users can insert their own notification settings"
ON public.notification_settings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Add UPDATE policy so users can update their notification settings
CREATE POLICY "Users can update their own notification settings"
ON public.notification_settings
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add SELECT policy so users can view their own notification settings
CREATE POLICY "Users can view their own notification settings"
ON public.notification_settings
FOR SELECT
USING (auth.uid() = user_id);
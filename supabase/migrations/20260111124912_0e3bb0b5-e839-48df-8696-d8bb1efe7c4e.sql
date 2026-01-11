-- Add read_at column to track when notifications are read
ALTER TABLE public.notification_queue 
ADD COLUMN read_at TIMESTAMP WITH TIME ZONE NULL;

-- Add UPDATE policy so users can mark their own notifications as read
CREATE POLICY "Users can update their own notifications"
ON public.notification_queue
FOR UPDATE
USING (auth.uid() = recipient_user_id)
WITH CHECK (auth.uid() = recipient_user_id);

-- Add DELETE policy so users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
ON public.notification_queue
FOR DELETE
USING (auth.uid() = recipient_user_id);
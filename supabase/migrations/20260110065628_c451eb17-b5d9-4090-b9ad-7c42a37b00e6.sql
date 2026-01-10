-- Drop the existing admin-only SELECT policy
DROP POLICY IF EXISTS "Admins can view notification queue" ON public.notification_queue;

-- Create a new SELECT policy that allows:
-- 1. Users to view their own notifications
-- 2. Admins to view all notifications
CREATE POLICY "Users can view own notifications and admins can view all"
ON public.notification_queue
FOR SELECT
USING (
  auth.uid() = recipient_user_id 
  OR is_admin(auth.uid())
);
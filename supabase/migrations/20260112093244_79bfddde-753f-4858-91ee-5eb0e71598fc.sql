-- Fix security issues: Restrict html_snippets to admin-only access and tighten notification_queue policies

-- 1. Remove public SELECT access to html_snippets - only admins should see ad code
DROP POLICY IF EXISTS "Anyone can view active snippets" ON public.html_snippets;
DROP POLICY IF EXISTS "Public can view active snippets" ON public.html_snippets;

-- Create admin-only SELECT policy for html_snippets
CREATE POLICY "Only admins can view html snippets"
ON public.html_snippets FOR SELECT
USING (is_admin(auth.uid()));

-- 2. Add explicit INSERT protection for notification_queue
-- The current policies allow users to view their own notifications
-- But INSERT should only come from service role (edge functions)
-- Since service role bypasses RLS, we add a check to prevent direct user inserts

DROP POLICY IF EXISTS "Users can insert their own notifications" ON public.notification_queue;

-- Create policy that prevents regular users from inserting (only service role can)
CREATE POLICY "No direct user inserts to notification queue"
ON public.notification_queue FOR INSERT
WITH CHECK (false); -- Deny all direct inserts - service role bypasses RLS

-- Note: Service role (used by edge functions) bypasses RLS entirely,
-- so legitimate notification inserts will still work through the send-notification function
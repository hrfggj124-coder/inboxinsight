-- Add explicit INSERT policy for user_roles with WITH CHECK constraint
-- This provides defense-in-depth against privilege escalation attacks

-- First, drop the existing ALL policy and replace with more specific policies
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

-- Create explicit SELECT policy for users to see their own roles
-- (Keep existing policy if it exists, but ensure it's there)
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (user_id = auth.uid() OR is_admin(auth.uid()));

-- Create explicit INSERT policy with WITH CHECK - only admins can insert roles
-- Note: SECURITY DEFINER triggers bypass RLS, so handle_new_user() still works
CREATE POLICY "Only admins can insert roles"
ON public.user_roles FOR INSERT
WITH CHECK (is_admin(auth.uid()));

-- Create explicit UPDATE policy - only admins can update roles
CREATE POLICY "Only admins can update roles"
ON public.user_roles FOR UPDATE
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Create explicit DELETE policy - only admins can delete roles
CREATE POLICY "Only admins can delete roles"
ON public.user_roles FOR DELETE
USING (is_admin(auth.uid()));
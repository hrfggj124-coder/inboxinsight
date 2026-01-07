-- Allow admins to view ALL profiles for user management
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));
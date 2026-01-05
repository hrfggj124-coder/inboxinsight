-- Fix overly permissive profile viewing policy
-- Remove broad authenticated user read access
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

-- Authenticated users can view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Authenticated users can also view publisher/admin profiles (for author attribution)
CREATE POLICY "Authenticated can view publisher profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_roles.user_id = profiles.user_id
      AND user_roles.role IN ('publisher', 'admin')
  )
);
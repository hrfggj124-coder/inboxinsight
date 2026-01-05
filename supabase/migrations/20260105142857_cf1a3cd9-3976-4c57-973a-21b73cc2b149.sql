-- Tighten public exposure of profiles while keeping author visibility for anonymous readers

-- Remove broad public read access
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Authenticated users can view profiles (needed for features like comments/likes/profile pages)
CREATE POLICY "Authenticated users can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Anonymous users can only view publisher/admin profiles (article authors)
CREATE POLICY "Anonymous can view publisher profiles"
ON public.profiles
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_roles.user_id = profiles.user_id
      AND user_roles.role IN ('publisher', 'admin')
  )
);
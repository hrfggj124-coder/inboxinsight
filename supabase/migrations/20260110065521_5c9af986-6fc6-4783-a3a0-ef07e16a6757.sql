-- Drop the existing overly permissive SELECT policy on likes
DROP POLICY IF EXISTS "Likes are viewable by everyone" ON public.likes;

-- Create a more restrictive SELECT policy that allows:
-- 1. Users to see their own likes (for toggle state)
-- 2. Article authors to see likes on their articles (for analytics)
-- 3. Admins to see all likes
CREATE POLICY "Users can view own likes and article authors can view likes on their content"
ON public.likes
FOR SELECT
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM articles 
    WHERE articles.id = likes.article_id 
    AND articles.author_id = auth.uid()
  )
  OR is_admin(auth.uid())
);
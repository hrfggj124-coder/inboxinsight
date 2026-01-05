-- 1. Add missing DELETE policy for notification_settings (GDPR compliance)
CREATE POLICY "Users can delete own notification settings"
ON public.notification_settings FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 2. Make author_id NOT NULL to prevent draft exposure through null author_id
-- First, update any existing null author_ids (shouldn't exist but safety first)
UPDATE public.articles 
SET author_id = (SELECT id FROM auth.users LIMIT 1)
WHERE author_id IS NULL;

-- Note: Cannot alter column to NOT NULL if there might be existing nulls in production
-- Instead, we'll add a CHECK constraint for new records
ALTER TABLE public.articles
ADD CONSTRAINT articles_author_id_not_null CHECK (author_id IS NOT NULL) NOT VALID;

-- Validate the constraint for existing data
ALTER TABLE public.articles VALIDATE CONSTRAINT articles_author_id_not_null;
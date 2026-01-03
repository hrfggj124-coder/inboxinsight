-- Create storage bucket for article cover images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'article-covers',
  'article-covers',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

-- Allow anyone to view article covers (public bucket)
CREATE POLICY "Article covers are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'article-covers');

-- Allow publishers and admins to upload article covers
CREATE POLICY "Publishers can upload article covers"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'article-covers' 
  AND public.is_publisher(auth.uid())
);

-- Allow publishers to update their own uploads and admins to update any
CREATE POLICY "Publishers can update their article covers"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'article-covers' 
  AND public.is_publisher(auth.uid())
);

-- Allow publishers to delete their own uploads and admins to delete any
CREATE POLICY "Publishers can delete article covers"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'article-covers' 
  AND public.is_publisher(auth.uid())
);

-- Add analytics columns to articles table for better tracking
ALTER TABLE public.articles 
ADD COLUMN IF NOT EXISTS daily_views jsonb DEFAULT '[]'::jsonb;

-- Create table for tracking user growth and engagement metrics
CREATE TABLE IF NOT EXISTS public.analytics_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date date NOT NULL UNIQUE,
  total_users integer DEFAULT 0,
  new_users integer DEFAULT 0,
  total_articles integer DEFAULT 0,
  published_articles integer DEFAULT 0,
  total_comments integer DEFAULT 0,
  total_likes integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on analytics_snapshots
ALTER TABLE public.analytics_snapshots ENABLE ROW LEVEL SECURITY;

-- Only admins can view and manage analytics
CREATE POLICY "Admins can view analytics"
ON public.analytics_snapshots FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage analytics"
ON public.analytics_snapshots FOR ALL
USING (public.is_admin(auth.uid()));

-- Create table for email notification preferences
CREATE TABLE IF NOT EXISTS public.notification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  email_on_approval boolean DEFAULT true,
  email_on_rejection boolean DEFAULT true,
  email_on_comment boolean DEFAULT true,
  email_on_like boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

-- Users can view and manage their own settings
CREATE POLICY "Users can view own notification settings"
ON public.notification_settings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification settings"
ON public.notification_settings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification settings"
ON public.notification_settings FOR UPDATE
USING (auth.uid() = user_id);

-- Create notification queue table for email sending
CREATE TABLE IF NOT EXISTS public.notification_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id uuid NOT NULL,
  notification_type text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'pending',
  sent_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;

-- Only system/admins can access notification queue
CREATE POLICY "Admins can view notification queue"
ON public.notification_queue FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "System can manage notification queue"
ON public.notification_queue FOR ALL
USING (public.is_admin(auth.uid()));
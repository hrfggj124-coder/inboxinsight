-- Add image_url column to rss_items table for storing thumbnail images from RSS feeds
ALTER TABLE public.rss_items ADD COLUMN IF NOT EXISTS image_url text;
-- Add public SELECT policy for rss_items so everyone can view RSS feed items
-- This is needed for the public RSS feed display in the sidebar
CREATE POLICY "RSS items are viewable by everyone"
ON public.rss_items
FOR SELECT
USING (true);

-- Add public SELECT policy for rss_feeds to allow joining for feed names
-- Only expose active feeds publicly
CREATE POLICY "Active RSS feeds are viewable by everyone"
ON public.rss_feeds
FOR SELECT
USING (is_active = true);
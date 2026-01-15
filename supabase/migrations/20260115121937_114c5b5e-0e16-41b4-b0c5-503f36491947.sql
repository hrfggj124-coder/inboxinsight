-- Enable realtime for rss_items and html_snippets tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.rss_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.html_snippets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rss_feeds;
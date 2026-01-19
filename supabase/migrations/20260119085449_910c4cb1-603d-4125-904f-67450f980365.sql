-- Create ad_impressions table to track ad views and clicks
CREATE TABLE public.ad_impressions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  snippet_id UUID REFERENCES public.html_snippets(id) ON DELETE CASCADE,
  location TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('impression', 'click')),
  user_agent TEXT,
  referrer TEXT,
  page_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient querying
CREATE INDEX idx_ad_impressions_snippet_id ON public.ad_impressions(snippet_id);
CREATE INDEX idx_ad_impressions_location ON public.ad_impressions(location);
CREATE INDEX idx_ad_impressions_created_at ON public.ad_impressions(created_at);
CREATE INDEX idx_ad_impressions_event_type ON public.ad_impressions(event_type);

-- Enable RLS
ALTER TABLE public.ad_impressions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert impressions (for tracking)
CREATE POLICY "Anyone can log ad impressions"
ON public.ad_impressions
FOR INSERT
WITH CHECK (true);

-- Only admins can view impressions
CREATE POLICY "Admins can view ad impressions"
ON public.ad_impressions
FOR SELECT
USING (public.is_admin(auth.uid()));

-- Only admins can delete impressions
CREATE POLICY "Admins can delete ad impressions"
ON public.ad_impressions
FOR DELETE
USING (public.is_admin(auth.uid()));

-- Create daily aggregation table for faster queries
CREATE TABLE public.ad_performance_daily (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  snippet_id UUID REFERENCES public.html_snippets(id) ON DELETE CASCADE,
  location TEXT NOT NULL,
  date DATE NOT NULL,
  impressions INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(snippet_id, location, date)
);

-- Create index for performance
CREATE INDEX idx_ad_performance_daily_date ON public.ad_performance_daily(date);
CREATE INDEX idx_ad_performance_daily_snippet ON public.ad_performance_daily(snippet_id);

-- Enable RLS
ALTER TABLE public.ad_performance_daily ENABLE ROW LEVEL SECURITY;

-- Only admins can view/manage performance data
CREATE POLICY "Admins can view ad performance"
ON public.ad_performance_daily
FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert ad performance"
ON public.ad_performance_daily
FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update ad performance"
ON public.ad_performance_daily
FOR UPDATE
USING (public.is_admin(auth.uid()));

-- Enable realtime for ad performance
ALTER PUBLICATION supabase_realtime ADD TABLE public.ad_performance_daily;
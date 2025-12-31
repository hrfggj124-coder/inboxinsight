-- Create html_snippets table for ad codes and custom HTML
CREATE TABLE public.html_snippets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL, -- 'header', 'footer', 'sidebar', 'in-content', 'custom'
  code TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.html_snippets ENABLE ROW LEVEL SECURITY;

-- Only admins can manage HTML snippets
CREATE POLICY "Admins can manage HTML snippets"
ON public.html_snippets
FOR ALL
USING (is_admin(auth.uid()));

-- Public can view active snippets (needed for rendering)
CREATE POLICY "Active snippets are viewable by everyone"
ON public.html_snippets
FOR SELECT
USING (is_active = true);

-- Add trigger for updated_at
CREATE TRIGGER update_html_snippets_updated_at
BEFORE UPDATE ON public.html_snippets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
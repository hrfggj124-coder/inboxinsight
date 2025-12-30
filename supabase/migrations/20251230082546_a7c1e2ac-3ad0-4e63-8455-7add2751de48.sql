-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'publisher', 'reader');

-- Create enum for article status
CREATE TYPE public.article_status AS ENUM ('draft', 'pending', 'published', 'rejected');

-- Create enum for publisher application status
CREATE TYPE public.publisher_status AS ENUM ('pending', 'approved', 'rejected');

-- Create profiles table for basic user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'reader',
  UNIQUE (user_id, role)
);

-- Create publisher_applications table
CREATE TABLE public.publisher_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  reason TEXT NOT NULL,
  portfolio_url TEXT,
  status publisher_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create articles table
CREATE TABLE public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL,
  cover_image TEXT,
  category_id UUID REFERENCES public.categories(id),
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status article_status NOT NULL DEFAULT 'draft',
  is_featured BOOLEAN DEFAULT false,
  source_url TEXT,
  source_name TEXT,
  read_time INTEGER DEFAULT 5,
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT[],
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create comments table
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create likes table
CREATE TABLE public.likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (article_id, user_id)
);

-- Create rss_feeds table
CREATE TABLE public.rss_feeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  category_id UUID REFERENCES public.categories(id),
  is_active BOOLEAN DEFAULT true,
  last_fetched_at TIMESTAMP WITH TIME ZONE,
  fetch_interval_minutes INTEGER DEFAULT 60,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create rss_items table (imported articles from RSS)
CREATE TABLE public.rss_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_id UUID REFERENCES public.rss_feeds(id) ON DELETE CASCADE NOT NULL,
  guid TEXT NOT NULL,
  title TEXT NOT NULL,
  link TEXT NOT NULL,
  description TEXT,
  pub_date TIMESTAMP WITH TIME ZONE,
  is_imported BOOLEAN DEFAULT false,
  imported_article_id UUID REFERENCES public.articles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (feed_id, guid)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publisher_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rss_feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rss_items ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin')
$$;

-- Function to check if user is publisher
CREATE OR REPLACE FUNCTION public.is_publisher(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'publisher') OR public.has_role(_user_id, 'admin')
$$;

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone"
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User roles policies (admin only management)
CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()) OR user_id = auth.uid());

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()));

-- Publisher applications policies
CREATE POLICY "Users can view their own application"
ON public.publisher_applications FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Users can submit their application"
ON public.publisher_applications FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update applications"
ON public.publisher_applications FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Categories policies (public read, admin write)
CREATE POLICY "Categories are viewable by everyone"
ON public.categories FOR SELECT USING (true);

CREATE POLICY "Admins can manage categories"
ON public.categories FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()));

-- Articles policies
CREATE POLICY "Published articles are viewable by everyone"
ON public.articles FOR SELECT
USING (status = 'published' OR author_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Publishers can create articles"
ON public.articles FOR INSERT
TO authenticated
WITH CHECK (public.is_publisher(auth.uid()) AND author_id = auth.uid());

CREATE POLICY "Publishers can update their own articles"
ON public.articles FOR UPDATE
TO authenticated
USING (author_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete articles"
ON public.articles FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()) OR author_id = auth.uid());

-- Comments policies
CREATE POLICY "Comments on published articles are viewable"
ON public.comments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.articles
    WHERE articles.id = comments.article_id
    AND articles.status = 'published'
  )
);

CREATE POLICY "Authenticated users can create comments"
ON public.comments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
ON public.comments FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
ON public.comments FOR DELETE
TO authenticated
USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- Likes policies
CREATE POLICY "Likes are viewable by everyone"
ON public.likes FOR SELECT USING (true);

CREATE POLICY "Authenticated users can like"
ON public.likes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike"
ON public.likes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- RSS feeds policies (admin only)
CREATE POLICY "RSS feeds are viewable by admins"
ON public.rss_feeds FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage RSS feeds"
ON public.rss_feeds FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()));

-- RSS items policies (admin only)
CREATE POLICY "RSS items are viewable by admins"
ON public.rss_items FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage RSS items"
ON public.rss_items FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()));

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_articles_updated_at
  BEFORE UPDATE ON public.articles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rss_feeds_updated_at
  BEFORE UPDATE ON public.rss_feeds
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user signup (creates profile and reader role)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'reader');
  RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update article counts
CREATE OR REPLACE FUNCTION public.update_article_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.articles SET likes_count = likes_count + 1 WHERE id = NEW.article_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.articles SET likes_count = likes_count - 1 WHERE id = OLD.article_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER update_likes_count
  AFTER INSERT OR DELETE ON public.likes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_article_likes_count();

-- Function to update comments count
CREATE OR REPLACE FUNCTION public.update_article_comments_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.articles SET comments_count = comments_count + 1 WHERE id = NEW.article_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.articles SET comments_count = comments_count - 1 WHERE id = OLD.article_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER update_comments_count
  AFTER INSERT OR DELETE ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_article_comments_count();

-- Insert default categories
INSERT INTO public.categories (name, slug, description, color) VALUES
  ('Artificial Intelligence', 'ai', 'AI and machine learning news', '#8B5CF6'),
  ('Software', 'software', 'Software development and updates', '#3B82F6'),
  ('Startups', 'startups', 'Startup ecosystem and funding', '#10B981'),
  ('Big Tech', 'big-tech', 'News from major tech companies', '#F59E0B'),
  ('Cybersecurity', 'cybersecurity', 'Security threats and solutions', '#EF4444'),
  ('Cloud', 'cloud', 'Cloud computing and infrastructure', '#06B6D4'),
  ('Programming', 'programming', 'Coding languages and frameworks', '#8B5CF6'),
  ('Gadgets', 'gadgets', 'Consumer electronics and devices', '#EC4899'),
  ('Web3', 'web3', 'Blockchain and decentralized tech', '#F97316'),
  ('Fintech', 'fintech', 'Financial technology news', '#14B8A6'),
  ('Data', 'data', 'Big data and analytics', '#6366F1'),
  ('Robotics', 'robotics', 'Robotics and automation', '#84CC16'),
  ('Policy', 'policy', 'Tech regulation and policy', '#64748B'),
  ('SaaS', 'saas', 'Software as a service news', '#A855F7');
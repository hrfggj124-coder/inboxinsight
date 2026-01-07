-- Enable realtime for admin-related tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_roles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.publisher_applications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;
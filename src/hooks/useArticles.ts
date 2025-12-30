import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Article = Database['public']['Tables']['articles']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

interface ArticleWithDetails extends Article {
  category: Category | null;
  author: Pick<Profile, 'display_name' | 'avatar_url'> | null;
}

// Helper to fetch profile by user_id
const fetchProfile = async (userId: string): Promise<Pick<Profile, 'display_name' | 'avatar_url'> | null> => {
  const { data } = await supabase
    .from('profiles')
    .select('display_name, avatar_url')
    .eq('user_id', userId)
    .maybeSingle();
  return data;
};

export const useArticles = (options?: {
  status?: 'published' | 'draft' | 'pending';
  categorySlug?: string;
  featured?: boolean;
  limit?: number;
  authorId?: string;
}) => {
  return useQuery({
    queryKey: ['articles', options],
    queryFn: async () => {
      let query = supabase
        .from('articles')
        .select(`
          *,
          category:categories(*)
        `)
        .order('published_at', { ascending: false, nullsFirst: false });

      if (options?.status) {
        query = query.eq('status', options.status);
      } else {
        query = query.eq('status', 'published');
      }

      if (options?.categorySlug) {
        const { data: cat } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', options.categorySlug)
          .single();
        
        if (cat) {
          query = query.eq('category_id', cat.id);
        }
      }

      if (options?.featured) {
        query = query.eq('is_featured', true);
      }

      if (options?.authorId) {
        query = query.eq('author_id', options.authorId);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch author profiles
      const articlesWithAuthors = await Promise.all(
        (data || []).map(async (article) => {
          let author = null;
          if (article.author_id) {
            author = await fetchProfile(article.author_id);
          }
          return {
            ...article,
            author,
          } as ArticleWithDetails;
        })
      );

      return articlesWithAuthors;
    },
  });
};

export const useArticle = (slug: string) => {
  return useQuery({
    queryKey: ['article', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('articles')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('slug', slug)
        .single();

      if (error) throw error;

      let author = null;
      if (data.author_id) {
        author = await fetchProfile(data.author_id);
      }

      return {
        ...data,
        author,
      } as ArticleWithDetails;
    },
    enabled: !!slug,
  });
};

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as Category[];
    },
  });
};

export const useCreateArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (article: Database['public']['Tables']['articles']['Insert']) => {
      const { data, error } = await supabase
        .from('articles')
        .insert(article)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
  });
};

export const useUpdateArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Article> & { id: string }) => {
      const { data, error } = await supabase
        .from('articles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['article', data.slug] });
    },
  });
};

export const useDeleteArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('articles')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
  });
};

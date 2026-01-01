import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Article = Database['public']['Tables']['articles']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

interface ArticleWithDetails extends Article {
  category: Category | null;
  author: Pick<Profile, 'display_name' | 'avatar_url'> | null;
}

interface SearchOptions {
  query: string;
  categoryId?: string;
  sortBy?: 'relevance' | 'date' | 'popular';
}

export const useSearch = (options: SearchOptions) => {
  return useQuery({
    queryKey: ['search', options],
    queryFn: async () => {
      if (!options.query.trim()) return [];

      let query = supabase
        .from('articles')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('status', 'published');

      // Full-text search on title, excerpt, and content
      const searchTerms = options.query.trim().split(' ').filter(Boolean);
      const searchPattern = searchTerms.map(term => `%${term}%`).join('');
      
      query = query.or(
        `title.ilike.%${options.query}%,excerpt.ilike.%${options.query}%,content.ilike.%${options.query}%`
      );

      if (options.categoryId) {
        query = query.eq('category_id', options.categoryId);
      }

      // Sorting
      switch (options.sortBy) {
        case 'date':
          query = query.order('published_at', { ascending: false, nullsFirst: false });
          break;
        case 'popular':
          query = query.order('views_count', { ascending: false, nullsFirst: false });
          break;
        default:
          // For relevance, we'll order by published_at as a fallback
          query = query.order('published_at', { ascending: false, nullsFirst: false });
      }

      query = query.limit(50);

      const { data, error } = await query;

      if (error) throw error;

      // Fetch author profiles
      const articlesWithAuthors = await Promise.all(
        (data || []).map(async (article) => {
          let author = null;
          if (article.author_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('display_name, avatar_url')
              .eq('user_id', article.author_id)
              .maybeSingle();
            author = profile;
          }
          return {
            ...article,
            author,
          } as ArticleWithDetails;
        })
      );

      return articlesWithAuthors;
    },
    enabled: !!options.query.trim(),
  });
};

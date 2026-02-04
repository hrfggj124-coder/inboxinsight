import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeRSS } from "./useRealtimeRSS";

interface RSSItemWithFeed {
  id: string;
  title: string;
  link: string;
  description: string | null;
  pub_date: string | null;
  feed: {
    id: string;
    name: string;
    category_id: string | null;
  } | null;
}

interface NormalizedRSSItem {
  id: string;
  title: string;
  link: string;
  description: string | null;
  pubDate: string | null;
  feedName: string;
  categoryId: string | null;
  isRSS: true;
}

export const useRSSItems = (options?: {
  categoryId?: string;
  categorySlug?: string;
  limit?: number;
  excludeImported?: boolean;
}) => {
  // Enable real-time updates
  useRealtimeRSS();

  return useQuery({
    queryKey: ['rss-items-with-category', options],
    queryFn: async (): Promise<NormalizedRSSItem[]> => {
      // If categorySlug is provided, first get the category ID
      let categoryId = options?.categoryId;
      
      if (options?.categorySlug && !categoryId) {
        const { data: category } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', options.categorySlug)
          .single();
        
        categoryId = category?.id;
      }

      let query = supabase
        .from('rss_items')
        .select(`
          id,
          title,
          link,
          description,
          pub_date,
          feed:feed_id (
            id,
            name,
            category_id
          )
        `)
        .order('pub_date', { ascending: false });

      // Only exclude imported if specifically requested
      if (options?.excludeImported !== false) {
        query = query.eq('is_imported', false);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Type assertion for the joined data
      const items = data as unknown as RSSItemWithFeed[];

      // Filter by category if specified
      let filteredItems = items;
      if (categoryId) {
        filteredItems = items.filter(item => item.feed?.category_id === categoryId);
      }

      // Normalize the data
      return filteredItems.map(item => ({
        id: item.id,
        title: item.title,
        link: item.link,
        description: item.description,
        pubDate: item.pub_date,
        feedName: item.feed?.name || 'External Source',
        categoryId: item.feed?.category_id || null,
        isRSS: true as const,
      }));
    },
  });
};

// Helper to merge RSS items with articles for display
export interface MergedContentItem {
  id: string;
  title: string;
  slug: string; // For articles, empty for RSS
  link?: string; // For RSS items
  excerpt: string;
  category: string;
  categorySlug: string;
  author: string;
  publishedAt: string;
  readTime: number;
  image: string;
  featured: boolean;
  trending: boolean;
  tags: string[];
  isRSS: boolean;
}

export const mergeArticlesWithRSS = (
  articles: MergedContentItem[],
  rssItems: NormalizedRSSItem[],
  categories: { id: string; name: string; slug: string }[]
): MergedContentItem[] => {
  // Convert RSS items to article-like format
  const rssAsArticles: MergedContentItem[] = rssItems.map(item => {
    const category = categories.find(c => c.id === item.categoryId);
    return {
      id: item.id,
      title: item.title,
      slug: '', // RSS items don't have internal slugs
      link: item.link,
      excerpt: item.description || '',
      category: category?.name || 'External',
      categorySlug: category?.slug || 'external',
      author: item.feedName,
      publishedAt: item.pubDate || new Date().toISOString(),
      readTime: 3,
      image: '/placeholder.svg',
      featured: false,
      trending: false,
      tags: [],
      isRSS: true,
    };
  });

  // Merge and sort by date
  const merged = [...articles, ...rssAsArticles];
  merged.sort((a, b) => {
    const dateA = new Date(a.publishedAt).getTime();
    const dateB = new Date(b.publishedAt).getTime();
    return dateB - dateA;
  });

  return merged;
};

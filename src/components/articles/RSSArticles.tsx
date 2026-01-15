import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, formatDistanceToNow } from "date-fns";
import { ExternalLink, Rss, RefreshCw, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useRealtimeRSS } from "@/hooks/useRealtimeRSS";
import { toast } from "sonner";

interface RSSItem {
  id: string;
  title: string;
  link: string;
  description: string | null;
  pub_date: string | null;
  feed: {
    name: string;
  } | null;
}

interface RSSArticlesProps {
  limit?: number;
  className?: string;
}

export const RSSArticles = ({ limit = 10, className = "" }: RSSArticlesProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();
  
  // Enable real-time updates for RSS items
  useRealtimeRSS();
  
  const { data: items, isLoading } = useQuery({
    queryKey: ['rss-items', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rss_items')
        .select(`
          id,
          title,
          link,
          description,
          pub_date,
          feed:feed_id (name)
        `)
        .eq('is_imported', false)
        .order('pub_date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as unknown as RSSItem[];
    },
  });

  // Get the most recent fetch time from feeds
  const { data: lastFetchedAt } = useQuery({
    queryKey: ['rss-last-fetched'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rss_feeds')
        .select('last_fetched_at')
        .eq('is_active', true)
        .not('last_fetched_at', 'is', null)
        .order('last_fetched_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data?.last_fetched_at || null;
    },
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const { error } = await supabase.functions.invoke('fetch-rss');
      
      if (error) {
        toast.error("Failed to refresh feeds");
        console.error("RSS fetch error:", error);
      } else {
        toast.success("Feeds refreshed successfully");
        queryClient.invalidateQueries({ queryKey: ['rss-items'] });
        queryClient.invalidateQueries({ queryKey: ['rss-last-fetched'] });
      }
    } catch (err) {
      toast.error("Failed to refresh feeds");
      console.error("RSS fetch error:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Rss className="h-5 w-5 text-primary" />
            <h3 className="font-display font-semibold">Latest from RSS</h3>
          </div>
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 rounded-lg border border-border">
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-1/2 mt-2" />
          </div>
        ))}
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className={`text-center ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Rss className="h-5 w-5 text-primary" />
            <h3 className="font-display font-semibold">Latest from RSS</h3>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-1.5 rounded-md hover:bg-muted transition-colors disabled:opacity-50"
            title="Refresh feeds"
          >
            <RefreshCw className={`h-4 w-4 text-muted-foreground ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <Rss className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">
          No RSS items yet. Click refresh to fetch feeds.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Rss className="h-5 w-5 text-primary" />
          <h3 className="font-display font-semibold">Latest from RSS</h3>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-1.5 rounded-md hover:bg-muted transition-colors disabled:opacity-50"
          title="Refresh feeds"
        >
          <RefreshCw className={`h-4 w-4 text-muted-foreground ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>
      
      {lastFetchedAt && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2 -mt-2">
          <Clock className="h-3 w-3" />
          <span>Updated {formatDistanceToNow(new Date(lastFetchedAt), { addSuffix: true })}</span>
        </div>
      )}
      
      {items.map((item) => (
        <a
          key={item.id}
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="block p-3 rounded-lg border border-border hover:border-primary/50 transition-colors group"
        >
          <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
            {item.title}
          </h4>
          
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            {item.feed?.name && (
              <span className="text-primary/80">{item.feed.name}</span>
            )}
            {item.pub_date && (
              <>
                <span>•</span>
                <span>{format(new Date(item.pub_date), 'MMM d')}</span>
              </>
            )}
            <ExternalLink className="h-3 w-3 ml-auto" />
          </div>
        </a>
      ))}
    </div>
  );
};
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ExternalLink, Rss } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
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
      <div className={`bg-card rounded-xl border border-border p-8 text-center ${className}`}>
        <Rss className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <h3 className="font-display font-semibold mb-1">No RSS items yet</h3>
        <p className="text-sm text-muted-foreground">
          Configure RSS feeds in the admin panel to see imported articles here.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Rss className="h-5 w-5 text-primary" />
        <h3 className="font-display font-semibold">Latest from RSS</h3>
      </div>
      
      {items.map((item) => (
        <a
          key={item.id}
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="block p-4 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors group"
        >
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
              {item.title}
            </h4>
            <ExternalLink className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
          </div>
          
          {item.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-2">
              {item.description.replace(/<[^>]*>/g, '').slice(0, 150)}...
            </p>
          )}
          
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            {item.feed?.name && (
              <span className="text-primary/80">{item.feed.name}</span>
            )}
            {item.pub_date && (
              <>
                <span>•</span>
                <span>{format(new Date(item.pub_date), 'MMM d, yyyy')}</span>
              </>
            )}
          </div>
        </a>
      ))}
    </div>
  );
};
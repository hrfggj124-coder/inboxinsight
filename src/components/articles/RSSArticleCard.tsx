import { ExternalLink, Clock, Rss } from "lucide-react";
import { format } from "date-fns";
import type { MergedContentItem } from "@/hooks/useRSSItems";

interface RSSArticleCardProps {
  item: MergedContentItem;
  variant?: "default" | "horizontal";
}

export const RSSArticleCard = ({ item, variant = "default" }: RSSArticleCardProps) => {
  if (variant === "horizontal") {
    return (
      <a
        href={item.link}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-all card-hover"
      >
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Rss className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`category-badge category-${item.categorySlug} text-[10px]`}>
              {item.category}
            </span>
            <span className="text-xs text-primary/70 flex items-center gap-1">
              <ExternalLink className="h-3 w-3" />
              {item.author}
            </span>
          </div>
          <h3 className="font-display font-semibold text-base line-clamp-2 group-hover:text-primary transition-colors">
            {item.title}
          </h3>
          {item.excerpt && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {item.excerpt}
            </p>
          )}
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {item.readTime} min read
            </span>
            {item.publishedAt && (
              <span>{format(new Date(item.publishedAt), "MMM d, yyyy")}</span>
            )}
          </div>
        </div>
      </a>
    );
  }

  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-xl overflow-hidden bg-card border border-border card-hover hover:border-primary/50 transition-all"
    >
      {/* RSS Indicator Header */}
      <div className="relative aspect-[16/10] bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
        <div className="text-center">
          <Rss className="h-8 w-8 text-primary/60 mx-auto mb-2" />
          <span className="text-xs text-primary/70 flex items-center justify-center gap-1">
            <ExternalLink className="h-3 w-3" />
            {item.author}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <span className="bg-primary/10 text-primary text-[10px] px-2 py-1 rounded-full font-medium">
            RSS Feed
          </span>
        </div>
      </div>

      <div className="p-5">
        <span className={`category-badge category-${item.categorySlug} mb-3`}>
          {item.category}
        </span>
        <h3 className="font-display font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors mb-2">
          {item.title}
        </h3>
        {item.excerpt && (
          <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
            {item.excerpt}
          </p>
        )}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {item.readTime} min
          </span>
          {item.publishedAt && (
            <span>{format(new Date(item.publishedAt), "MMM d, yyyy")}</span>
          )}
        </div>
      </div>
    </a>
  );
};

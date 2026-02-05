import { ExternalLink, Clock, Rss } from "lucide-react";
import { format } from "date-fns";
import type { MergedContentItem } from "@/hooks/useRSSItems";

interface RSSArticleCardProps {
  item: MergedContentItem;
  variant?: "default" | "horizontal";
}

export const RSSArticleCard = ({ item, variant = "default" }: RSSArticleCardProps) => {
  const hasImage = item.image && item.image !== '/placeholder.svg';
  
  if (variant === "horizontal") {
    return (
      <a
        href={item.link}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-all card-hover"
      >
        {hasImage ? (
          <div className="flex-shrink-0 w-24 h-20 rounded-lg overflow-hidden">
            <img 
              src={item.image} 
              alt={item.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.innerHTML = `<div class="w-full h-full bg-primary/10 flex items-center justify-center"><svg class="h-6 w-6 text-primary/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 11a9 9 0 0 1 9 9"></path><path d="M4 4a16 16 0 0 1 16 16"></path><circle cx="5" cy="19" r="1"></circle></svg></div>`;
              }}
            />
          </div>
        ) : (
          <div className="flex-shrink-0 w-24 h-20 rounded-lg bg-primary/10 flex items-center justify-center">
            <Rss className="h-6 w-6 text-primary/60" />
          </div>
        )}
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
            <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
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
      {/* Image or RSS Indicator */}
      <div className="relative aspect-[16/10] overflow-hidden">
        {hasImage ? (
          <>
            <img 
              src={item.image} 
              alt={item.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  parent.innerHTML = `<div class="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center"><div class="text-center"><svg class="h-8 w-8 text-primary/60 mx-auto mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 11a9 9 0 0 1 9 9"></path><path d="M4 4a16 16 0 0 1 16 16"></path><circle cx="5" cy="19" r="1"></circle></svg></div></div><div class="absolute top-3 right-3"><span class="bg-primary/10 text-primary text-[10px] px-2 py-1 rounded-full font-medium">RSS Feed</span></div>`;
                }
              }}
            />
            <div className="absolute top-3 right-3">
              <span className="bg-background/90 backdrop-blur-sm text-primary text-[10px] px-2 py-1 rounded-full font-medium flex items-center gap-1">
                <Rss className="h-3 w-3" />
                RSS
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
              <div className="text-center">
                <Rss className="h-8 w-8 text-primary/60 mx-auto mb-2" />
                <span className="text-xs text-primary/70 flex items-center justify-center gap-1">
                  <ExternalLink className="h-3 w-3" />
                  {item.author}
                </span>
              </div>
            </div>
            <div className="absolute top-3 right-3">
              <span className="bg-primary/10 text-primary text-[10px] px-2 py-1 rounded-full font-medium">
                RSS Feed
              </span>
            </div>
          </>
        )}
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
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {item.readTime} min
            </span>
            {item.publishedAt && (
              <span>{format(new Date(item.publishedAt), "MMM d, yyyy")}</span>
            )}
          </div>
          {hasImage && (
            <span className="text-primary/70 flex items-center gap-1">
              <ExternalLink className="h-3 w-3" />
              {item.author}
            </span>
          )}
        </div>
      </div>
    </a>
  );
};

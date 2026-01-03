import { Link } from "react-router-dom";
import { Clock, TrendingUp } from "lucide-react";
import { Article } from "@/data/articles";
import { formatDistanceToNow } from "date-fns";

interface NormalizedArticle {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  category: string;
  categorySlug: string;
  author: string;
  authorAvatar?: string | null;
  publishedAt: string;
  readTime: number;
  image: string;
  featured?: boolean;
  trending?: boolean;
  source?: string;
  tags?: string[];
}

interface ArticleCardProps {
  article: Article | NormalizedArticle;
  variant?: "default" | "featured" | "compact" | "horizontal";
}

export const ArticleCard = ({ article, variant = "default" }: ArticleCardProps) => {
  const timeAgo = formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true });

  if (variant === "compact") {
    return (
      <Link to={`/article/${article.slug}`} className="group flex gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
        <img
          src={article.image}
          alt={article.title}
          className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <span className={`category-badge category-${article.categorySlug} mb-1`}>
            {article.category}
          </span>
          <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
            {article.title}
          </h4>
          <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>
        </div>
      </Link>
    );
  }

  if (variant === "horizontal") {
    return (
      <Link to={`/article/${article.slug}`} className="group flex gap-6 card-hover">
        <img
          src={article.image}
          alt={article.title}
          className="w-48 h-32 object-cover rounded-lg flex-shrink-0"
        />
        <div className="flex-1 min-w-0 py-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`category-badge category-${article.categorySlug}`}>
              {article.category}
            </span>
            {article.trending && (
              <span className="flex items-center gap-1 text-xs text-primary">
                <TrendingUp className="h-3 w-3" /> Trending
              </span>
            )}
          </div>
          <h3 className="font-display font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors mb-2">
            {article.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{article.excerpt}</p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>{article.author}</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {article.readTime} min read
            </span>
            <span>{timeAgo}</span>
          </div>
        </div>
      </Link>
    );
  }

  if (variant === "featured") {
    return (
      <Link to={`/article/${article.slug}`} className="group relative block rounded-xl overflow-hidden card-hover">
        <div className="aspect-[16/10] lg:aspect-[16/9]">
          <img
            src={article.image}
            alt={article.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className={`category-badge category-${article.categorySlug}`}>
              {article.category}
            </span>
            {article.trending && (
              <span className="flex items-center gap-1 text-xs text-primary font-medium">
                <TrendingUp className="h-3 w-3" /> Trending
              </span>
            )}
          </div>
          <h2 className="font-display font-bold text-2xl lg:text-3xl mb-3 group-hover:text-primary transition-colors">
            {article.title}
          </h2>
          <p className="text-muted-foreground mb-4 line-clamp-2 max-w-2xl">{article.excerpt}</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{article.author}</span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" /> {article.readTime} min read
            </span>
            <span>{timeAgo}</span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/article/${article.slug}`} className="group block rounded-xl overflow-hidden bg-card border border-border card-hover">
      <div className="aspect-[16/10] overflow-hidden">
        <img
          src={article.image}
          alt={article.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className={`category-badge category-${article.categorySlug}`}>
            {article.category}
          </span>
          {article.trending && (
            <TrendingUp className="h-4 w-4 text-primary" />
          )}
        </div>
        <h3 className="font-display font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors mb-2">
          {article.title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{article.excerpt}</p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{article.author}</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> {article.readTime} min
          </span>
        </div>
      </div>
    </Link>
  );
};

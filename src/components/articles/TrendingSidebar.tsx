import { Link } from "react-router-dom";
import { TrendingUp, Flame } from "lucide-react";
import { getTrendingArticles, categories } from "@/data/articles";
import { AdSlot } from "@/components/ads/AdSlot";

export const TrendingSidebar = () => {
  const trending = getTrendingArticles().slice(0, 5);

  return (
    <aside className="space-y-8">
      {/* Ad Slot */}
      <AdSlot type="sidebar" />

      {/* Trending */}
      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <Flame className="h-5 w-5 text-primary" />
          <h3 className="font-display font-bold text-lg">Trending Now</h3>
        </div>
        <div className="space-y-4">
          {trending.map((article, index) => (
            <Link
              key={article.id}
              to={`/article/${article.slug}`}
              className="group flex gap-3 items-start"
            >
              <span className="text-2xl font-display font-bold text-muted-foreground/50 group-hover:text-primary transition-colors">
                {(index + 1).toString().padStart(2, "0")}
              </span>
              <div className="flex-1">
                <span className={`category-badge category-${article.categorySlug} text-[10px] mb-1`}>
                  {article.category}
                </span>
                <h4 className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
                  {article.title}
                </h4>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="font-display font-bold text-lg mb-4">Browse Topics</h3>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Link
              key={category.slug}
              to={`/category/${category.slug}`}
              className={`category-badge category-${category.color} hover:opacity-80 transition-opacity`}
            >
              {category.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Newsletter */}
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/20 p-5">
        <TrendingUp className="h-8 w-8 text-primary mb-3" />
        <h3 className="font-display font-bold text-lg mb-2">Stay Updated</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Get the latest tech news and insights delivered to your inbox every morning.
        </p>
        <input
          type="email"
          placeholder="Your email"
          className="w-full bg-background rounded-lg px-4 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button className="w-full bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors">
          Subscribe Free
        </button>
      </div>

      {/* Ad Slot */}
      <AdSlot type="sidebar" />
    </aside>
  );
};

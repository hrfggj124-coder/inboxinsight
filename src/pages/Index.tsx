import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { RSSArticleCard } from "@/components/articles/RSSArticleCard";
import { TrendingSidebar } from "@/components/articles/TrendingSidebar";
import { AdSlot } from "@/components/ads/AdSlot";
import { useArticles, useCategories } from "@/hooks/useArticles";
import { useRSSItems, mergeArticlesWithRSS, type MergedContentItem } from "@/hooks/useRSSItems";
import { useRealtimeArticles } from "@/hooks/useRealtimeArticles";
import { articles as staticArticles, getFeaturedArticles, categories as staticCategories } from "@/data/articles";
import { Link } from "react-router-dom";
import { ArrowRight, Zap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  // Enable realtime updates for articles
  useRealtimeArticles();
  
  // Fetch from database
  const { data: dbArticles, isLoading: articlesLoading } = useArticles({ 
    status: 'published', 
    limit: 20 
  });
  const { data: dbCategories, isLoading: categoriesLoading } = useCategories();
  const { data: featuredArticles } = useArticles({ 
    status: 'published', 
    featured: true, 
    limit: 3 
  });
  
  // Fetch RSS items for the Latest News section
  const { data: rssItems, isLoading: rssLoading } = useRSSItems({ 
    limit: 10,
    excludeImported: true 
  });

  // Use DB articles if available, otherwise fall back to static
  const hasDbArticles = dbArticles && dbArticles.length > 0;
  const hasDbCategories = dbCategories && dbCategories.length > 0;

  // Normalize articles for display
  const normalizedArticles: MergedContentItem[] = hasDbArticles 
    ? dbArticles.map(article => ({
        id: article.id,
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt || "",
        category: article.category?.name || "Uncategorized",
        categorySlug: article.category?.slug || "uncategorized",
        author: article.author?.display_name || "Staff Writer",
        publishedAt: article.published_at || article.created_at,
        readTime: article.read_time || 5,
        image: article.cover_image || "/placeholder.svg",
        featured: article.is_featured || false,
        trending: (article.views_count || 0) > 100,
        tags: article.seo_keywords || [],
        isRSS: false,
      }))
    : staticArticles.map(a => ({ 
        ...a, 
        featured: a.featured || false,
        trending: a.trending || false,
        isRSS: false 
      }));

  const categories = hasDbCategories 
    ? dbCategories.map(cat => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description || "",
        color: cat.color || cat.slug,
      }))
    : staticCategories.map(c => ({ ...c, id: c.slug }));

  // Get featured articles
  const featured = hasDbArticles && featuredArticles && featuredArticles.length > 0
    ? featuredArticles.map(article => ({
        id: article.id,
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt || "",
        category: article.category?.name || "Uncategorized",
        categorySlug: article.category?.slug || "uncategorized",
        author: article.author?.display_name || "Staff Writer",
        publishedAt: article.published_at || article.created_at,
        readTime: article.read_time || 5,
        image: article.cover_image || "/placeholder.svg",
        featured: true,
        trending: (article.views_count || 0) > 100,
        tags: article.seo_keywords || [],
        isRSS: false,
      }))
    : getFeaturedArticles().map(a => ({ 
        ...a, 
        featured: true,
        trending: a.trending || false,
        isRSS: false 
      }));

  // Merge articles with RSS items for the Latest News section
  const mergedContent = mergeArticlesWithRSS(
    normalizedArticles,
    rssItems || [],
    categories
  );

  const mainFeatured = featured[0];
  const sideFeatured = featured.slice(1, 3);
  const latestContent = mergedContent.slice(0, 16); // Increased to accommodate RSS

  const isLoading = articlesLoading || categoriesLoading || rssLoading;

  // Render content item (article or RSS)
  const renderContentItem = (item: MergedContentItem, variant?: "horizontal") => {
    if (item.isRSS) {
      return <RSSArticleCard key={item.id} item={item} variant={variant} />;
    }
    return <ArticleCard key={item.id} article={item} variant={variant} />;
  };

  return (
    <Layout>
      <SEOHead
        title="TechPulse - Your Source for Tech News & Analysis"
        description="Breaking technology news, in-depth analysis, and expert insights on AI, software, startups, cybersecurity, cloud computing, and more. Stay ahead with TechPulse."
        canonical="/"
      />

      {/* Header Ad */}
      <div className="container py-4">
        <AdSlot type="banner" />
      </div>

      {/* Hero Section */}
      <section className="container py-8">
        {isLoading ? (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Skeleton className="aspect-[16/9] rounded-xl" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-48 rounded-xl" />
              <Skeleton className="h-48 rounded-xl" />
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Featured */}
            <div className="lg:col-span-2">
              {mainFeatured && <ArticleCard article={mainFeatured} variant="featured" />}
            </div>

            {/* Side Featured */}
            <div className="space-y-4">
              {sideFeatured.map((article) => (
                <Link
                  key={article.id}
                  to={`/article/${article.slug}`}
                  className="group block rounded-xl overflow-hidden bg-card border border-border card-hover"
                >
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={article.image}
                      alt={article.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-4">
                    <span className={`category-badge category-${article.categorySlug} mb-2`}>
                      {article.category}
                    </span>
                    <h3 className="font-display font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                      {article.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Breaking News Ticker */}
      <section className="bg-primary/5 border-y border-primary/20">
        <div className="container py-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 flex-shrink-0">
              <Zap className="h-4 w-4 text-primary animate-pulse-subtle" />
              <span className="text-sm font-semibold text-primary uppercase tracking-wider">Breaking</span>
            </div>
            <div className="overflow-hidden">
              <div className="flex gap-8 animate-[marquee_30s_linear_infinite] whitespace-nowrap">
                {mergedContent.slice(0, 5).map((item) => (
                  item.isRSS ? (
                    <a
                      key={item.id}
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {item.title}
                    </a>
                  ) : (
                    <Link
                      key={item.id}
                      to={`/article/${item.slug}`}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {item.title}
                    </Link>
                  )
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Articles Grid */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl font-bold">Latest News</h2>
              <Link to="/categories" className="text-sm text-primary hover:text-primary/80 flex items-center gap-1">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {isLoading ? (
              <div className="grid sm:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="rounded-xl border border-border overflow-hidden">
                    <Skeleton className="aspect-[16/10]" />
                    <div className="p-5 space-y-3">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-6 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="grid sm:grid-cols-2 gap-6">
                  {latestContent.slice(0, 4).map((item) => renderContentItem(item))}
                </div>

                {/* Inline Ad */}
                <div className="my-8">
                  <AdSlot type="inline" />
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  {latestContent.slice(4, 8).map((item) => renderContentItem(item))}
                </div>

                {/* More horizontal articles */}
                <div className="mt-8 space-y-6">
                  {latestContent.slice(8, 12).map((item) => renderContentItem(item, "horizontal"))}
                </div>
              </>
            )}
          </div>

          {/* Sidebar */}
          <TrendingSidebar />
        </div>
      </section>

      {/* Categories Section */}
      <section className="bg-card border-y border-border py-12">
        <div className="container">
          <h2 className="font-display text-2xl font-bold mb-6">Browse by Topic</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((category) => (
              <Link
                key={category.slug}
                to={`/category/${category.slug}`}
                className="group p-6 bg-background rounded-xl border border-border hover:border-primary/50 transition-all card-hover"
              >
                <div className={`w-3 h-3 rounded-full bg-category-${category.color} mb-3`} />
                <h3 className="font-display font-semibold group-hover:text-primary transition-colors">
                  {category.name}
                </h3>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{category.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer Ad */}
      <div className="container py-8">
        <AdSlot type="footer" />
      </div>
    </Layout>
  );
};

export default Index;

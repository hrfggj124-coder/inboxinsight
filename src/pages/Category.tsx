import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { TrendingSidebar } from "@/components/articles/TrendingSidebar";
import { AdSlot } from "@/components/ads/AdSlot";
import { useArticles, useCategories } from "@/hooks/useArticles";
import { getArticlesByCategory, categories as staticCategories } from "@/data/articles";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const Category = () => {
  const { slug } = useParams();
  
  // Fetch from database
  const { data: dbCategories, isLoading: categoriesLoading } = useCategories();
  const { data: dbArticles, isLoading: articlesLoading } = useArticles({ 
    status: 'published', 
    categorySlug: slug,
    limit: 50 
  });

  // Use DB data if available
  const hasDbCategories = dbCategories && dbCategories.length > 0;
  const hasDbArticles = dbArticles && dbArticles.length > 0;

  // Get category
  const category = hasDbCategories 
    ? dbCategories.find((c) => c.slug === slug)
    : staticCategories.find((c) => c.slug === slug);

  const categories = hasDbCategories 
    ? dbCategories.map(cat => ({
        name: cat.name,
        slug: cat.slug,
        description: cat.description || "",
        color: cat.color || cat.slug,
      }))
    : staticCategories;

  // Normalize articles
  const articles = hasDbArticles 
    ? dbArticles.map(article => ({
        id: article.id,
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt || "",
        content: article.content,
        category: article.category?.name || "Uncategorized",
        categorySlug: article.category?.slug || "uncategorized",
        author: article.author?.display_name || "Staff Writer",
        publishedAt: article.published_at || article.created_at,
        readTime: article.read_time || 5,
        image: article.cover_image || "/placeholder.svg",
        featured: article.is_featured || false,
        trending: (article.views_count || 0) > 100,
        tags: article.seo_keywords || [],
      }))
    : getArticlesByCategory(slug || "");

  const isLoading = categoriesLoading || articlesLoading;

  if (!isLoading && !category) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <h1 className="text-3xl font-bold mb-4">Category Not Found</h1>
          <p className="text-muted-foreground mb-6">The category you're looking for doesn't exist.</p>
          <Link to="/">
            <Button>Back to Home</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEOHead
        title={`${category?.name || 'Category'} News & Updates`}
        description={`Latest ${category?.name?.toLowerCase() || ''} news, analysis, and insights. ${category?.description || ''}`}
        canonical={`/category/${category?.slug || slug}`}
      />

      {/* Header Ad */}
      <div className="container py-4">
        <AdSlot type="banner" />
      </div>

      <div className="container py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
          <span>/</span>
          <span className="text-foreground">{category?.name || 'Loading...'}</span>
        </nav>

        {/* Category Header */}
        <div className="mb-8">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-6 w-96" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-4 h-4 rounded-full bg-category-${category?.color || category?.slug}`} />
                <h1 className="font-display text-3xl md:text-4xl font-bold">{category?.name}</h1>
              </div>
              <p className="text-lg text-muted-foreground max-w-2xl">{category?.description}</p>
            </>
          )}
        </div>

        {/* Other Categories */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories
            .filter((c) => c.slug !== category?.slug)
            .map((cat) => (
              <Link
                key={cat.slug}
                to={`/category/${cat.slug}`}
                className={`category-badge category-${cat.color} hover:opacity-80 transition-opacity`}
              >
                {cat.name}
              </Link>
            ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Articles */}
          <div className="lg:col-span-2">
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
            ) : articles.length > 0 ? (
              <>
                <div className="grid sm:grid-cols-2 gap-6">
                  {articles.slice(0, 4).map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>

                {articles.length > 4 && (
                  <>
                    <div className="my-8">
                      <AdSlot type="inline" />
                    </div>

                    <div className="space-y-6">
                      {articles.slice(4).map((article) => (
                        <ArticleCard key={article.id} article={article} variant="horizontal" />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No articles in this category yet.</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <TrendingSidebar />
        </div>
      </div>
    </Layout>
  );
};

export default Category;

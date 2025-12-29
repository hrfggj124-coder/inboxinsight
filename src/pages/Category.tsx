import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { TrendingSidebar } from "@/components/articles/TrendingSidebar";
import { AdSlot } from "@/components/ads/AdSlot";
import { getArticlesByCategory, categories } from "@/data/articles";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const Category = () => {
  const { slug } = useParams();
  const category = categories.find((c) => c.slug === slug);
  const articles = getArticlesByCategory(slug || "");

  if (!category) {
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
        title={`${category.name} News & Updates`}
        description={`Latest ${category.name.toLowerCase()} news, analysis, and insights. ${category.description}`}
        canonical={`/category/${category.slug}`}
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
          <span className="text-foreground">{category.name}</span>
        </nav>

        {/* Category Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-4 h-4 rounded-full bg-category-${category.color}`} />
            <h1 className="font-display text-3xl md:text-4xl font-bold">{category.name}</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl">{category.description}</p>
        </div>

        {/* Other Categories */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories
            .filter((c) => c.slug !== category.slug)
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
            {articles.length > 0 ? (
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

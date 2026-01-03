import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useCategories, useArticles } from "@/hooks/useArticles";
import { categories as staticCategories, getArticlesByCategory } from "@/data/articles";
import { Skeleton } from "@/components/ui/skeleton";

const Categories = () => {
  const { data: dbCategories, isLoading: categoriesLoading } = useCategories();
  const { data: dbArticles } = useArticles({ status: 'published', limit: 100 });

  const hasDbCategories = dbCategories && dbCategories.length > 0;
  
  const categories = hasDbCategories 
    ? dbCategories.map(cat => ({
        name: cat.name,
        slug: cat.slug,
        description: cat.description || "",
        color: cat.color || cat.slug,
      }))
    : staticCategories;

  // Count articles per category
  const getArticleCount = (categorySlug: string) => {
    if (dbArticles) {
      return dbArticles.filter(a => a.category?.slug === categorySlug).length;
    }
    return getArticlesByCategory(categorySlug).length;
  };

  return (
    <Layout>
      <SEOHead
        title="All Categories"
        description="Browse all technology news categories on TechPulse. From AI and software to cybersecurity, cloud computing, and more."
        canonical="/categories"
      />

      <div className="container py-8">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
          <span>/</span>
          <span className="text-foreground">Categories</span>
        </nav>

        <div className="max-w-4xl">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">Browse Topics</h1>
          <p className="text-xl text-muted-foreground mb-12">
            Explore our comprehensive coverage across all major technology sectors.
          </p>
        </div>

        {categoriesLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="p-6 bg-card rounded-xl border border-border">
                <div className="flex items-start justify-between mb-4">
                  <Skeleton className="w-4 h-4 rounded-full" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-6 w-40 mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => {
              const articleCount = getArticleCount(category.slug);
              return (
                <Link
                  key={category.slug}
                  to={`/category/${category.slug}`}
                  className="group p-6 bg-card rounded-xl border border-border hover:border-primary/50 transition-all card-hover"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-4 h-4 rounded-full bg-category-${category.color}`} />
                    <span className="text-sm text-muted-foreground">{articleCount} articles</span>
                  </div>
                  <h2 className="font-display text-xl font-bold group-hover:text-primary transition-colors mb-2">
                    {category.name}
                  </h2>
                  <p className="text-muted-foreground text-sm mb-4">{category.description}</p>
                  <div className="flex items-center text-sm text-primary font-medium">
                    Browse articles <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Categories;

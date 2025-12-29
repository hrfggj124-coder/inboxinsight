import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { TrendingSidebar } from "@/components/articles/TrendingSidebar";
import { AdSlot } from "@/components/ads/AdSlot";
import { articles, getFeaturedArticles, categories } from "@/data/articles";
import { Link } from "react-router-dom";
import { ArrowRight, Zap } from "lucide-react";

const Index = () => {
  const featured = getFeaturedArticles();
  const latestArticles = articles.slice(0, 12);
  const mainFeatured = featured[0];
  const sideFeatured = featured.slice(1, 3);

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
                {articles.slice(0, 5).map((article) => (
                  <Link
                    key={article.id}
                    to={`/article/${article.slug}`}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {article.title}
                  </Link>
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
              <Link to="/category/all" className="text-sm text-primary hover:text-primary/80 flex items-center gap-1">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              {latestArticles.slice(0, 4).map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>

            {/* Inline Ad */}
            <div className="my-8">
              <AdSlot type="inline" />
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              {latestArticles.slice(4, 8).map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>

            {/* More horizontal articles */}
            <div className="mt-8 space-y-6">
              {latestArticles.slice(8, 12).map((article) => (
                <ArticleCard key={article.id} article={article} variant="horizontal" />
              ))}
            </div>
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

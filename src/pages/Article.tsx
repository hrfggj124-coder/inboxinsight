import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { TrendingSidebar } from "@/components/articles/TrendingSidebar";
import { AdSlot } from "@/components/ads/AdSlot";
import { getArticleBySlug, getRelatedArticles } from "@/data/articles";
import { formatDistanceToNow, format } from "date-fns";
import { Clock, Calendar, Share2, Bookmark, Heart, MessageCircle, Twitter, Linkedin, Facebook, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const Article = () => {
  const { slug } = useParams();
  const article = getArticleBySlug(slug || "");

  if (!article) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <h1 className="text-3xl font-bold mb-4">Article Not Found</h1>
          <p className="text-muted-foreground mb-6">The article you're looking for doesn't exist.</p>
          <Link to="/">
            <Button>Back to Home</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const relatedArticles = getRelatedArticles(article, 4);
  const timeAgo = formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true });
  const formattedDate = format(new Date(article.publishedAt), "MMMM d, yyyy");

  return (
    <Layout>
      <SEOHead
        title={article.title}
        description={article.excerpt}
        canonical={`/article/${article.slug}`}
        type="article"
        image={article.image}
        publishedTime={article.publishedAt}
        author={article.author}
        tags={article.tags}
      />

      {/* Header Ad */}
      <div className="container py-4">
        <AdSlot type="banner" />
      </div>

      <article className="container py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Article Content */}
          <div className="lg:col-span-2">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
              <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1">
                <ArrowLeft className="h-4 w-4" /> Home
              </Link>
              <span>/</span>
              <Link to={`/category/${article.categorySlug}`} className="hover:text-primary transition-colors">
                {article.category}
              </Link>
            </nav>

            {/* Category & Meta */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className={`category-badge category-${article.categorySlug}`}>
                {article.category}
              </span>
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" /> {article.readTime} min read
              </span>
            </div>

            {/* Title */}
            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
              {article.title}
            </h1>

            {/* Excerpt */}
            <p className="text-xl text-muted-foreground mb-6">{article.excerpt}</p>

            {/* Author & Date */}
            <div className="flex flex-wrap items-center gap-4 pb-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-primary font-semibold">{article.author[0]}</span>
                </div>
                <div>
                  <p className="font-medium">{article.author}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-3 w-3" /> {formattedDate} • {timeAgo}
                  </p>
                </div>
              </div>
              {article.source && (
                <span className="text-sm text-muted-foreground">
                  Source: {article.source}
                </span>
              )}
            </div>

            {/* Share Bar */}
            <div className="flex flex-wrap items-center gap-4 py-4 border-b border-border">
              <span className="text-sm text-muted-foreground">Share:</span>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Twitter className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Facebook className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Linkedin className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1" />
              <Button variant="ghost" size="sm" className="gap-2">
                <Bookmark className="h-4 w-4" /> Save
              </Button>
            </div>

            {/* Featured Image */}
            <div className="my-8">
              <img
                src={article.image}
                alt={article.title}
                className="w-full rounded-xl"
              />
            </div>

            {/* Article Body */}
            <div className="prose prose-lg prose-invert max-w-none">
              {article.content.split("\n\n").map((paragraph, index) => (
                <p key={index} className="text-foreground/90 leading-relaxed mb-6">
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Inline Ad */}
            <div className="my-8">
              <AdSlot type="inline" />
            </div>

            {/* Tags */}
            <div className="mt-8 pt-6 border-t border-border">
              <h4 className="text-sm font-semibold mb-3">Related Topics</h4>
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <Link
                    key={tag}
                    to={`/search?q=${tag}`}
                    className="px-3 py-1.5 bg-muted rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            </div>

            {/* Engagement */}
            <div className="mt-8 p-6 bg-card rounded-xl border border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button variant="ghost" className="gap-2">
                    <Heart className="h-5 w-5" /> Like
                  </Button>
                  <Button variant="ghost" className="gap-2">
                    <MessageCircle className="h-5 w-5" /> Comment
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">Sign in to engage</p>
              </div>
            </div>

            {/* Related Articles */}
            {relatedArticles.length > 0 && (
              <div className="mt-12">
                <h2 className="font-display text-2xl font-bold mb-6">Related Articles</h2>
                <div className="grid sm:grid-cols-2 gap-6">
                  {relatedArticles.map((related) => (
                    <ArticleCard key={related.id} article={related} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <TrendingSidebar />
        </div>
      </article>
    </Layout>
  );
};

export default Article;

import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { TrendingSidebar } from "@/components/articles/TrendingSidebar";
import { AdSlot } from "@/components/ads/AdSlot";
import { LikeButton } from "@/components/articles/LikeButton";
import { CommentSection } from "@/components/articles/CommentSection";
import { ShareButtons } from "@/components/articles/ShareButtons";
import { HTMLContent } from "@/components/articles/HTMLContent";
import { HTMLSnippetRenderer } from "@/hooks/useHTMLSnippets";
import { useArticle } from "@/hooks/useArticles";
import { useRealtimeComments } from "@/hooks/useRealtimeComments";
import { useRealtimeLikes } from "@/hooks/useRealtimeLikes";
import { useAuth } from "@/contexts/AuthContext";
import { getArticleBySlug, getRelatedArticles } from "@/data/articles";
import { formatDistanceToNow, format } from "date-fns";
import { Clock, Calendar, Bookmark, MessageCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const Article = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  
  // Try to fetch from database first
  const { data: dbArticle, isLoading: dbLoading } = useArticle(slug || "");
  
  // Fallback to static data
  const staticArticle = getArticleBySlug(slug || "");
  
  // Use database article if available, otherwise static
  const isDbArticle = !!dbArticle;
  const article = dbArticle || staticArticle;

  // Enable realtime subscriptions for DB articles
  useRealtimeComments(isDbArticle ? dbArticle!.id : "");
  useRealtimeLikes(isDbArticle ? dbArticle!.id : "", user?.id);

  if (dbLoading) {
    return (
      <Layout>
        <div className="container py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-64 w-full rounded-xl" />
              <Skeleton className="h-40 w-full" />
            </div>
            <TrendingSidebar />
          </div>
        </div>
      </Layout>
    );
  }

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

  // Normalize data for both DB and static articles
  const articleData = isDbArticle
    ? {
        id: dbArticle.id,
        title: dbArticle.title,
        slug: dbArticle.slug,
        excerpt: dbArticle.excerpt || "",
        content: dbArticle.content,
        image: dbArticle.cover_image || "/placeholder.svg",
        category: dbArticle.category?.name || "Uncategorized",
        categorySlug: dbArticle.category?.slug || "uncategorized",
        readTime: dbArticle.read_time || 5,
        publishedAt: dbArticle.published_at || dbArticle.created_at,
        author: dbArticle.author?.display_name || "Staff Writer",
        authorAvatar: dbArticle.author?.avatar_url,
        source: dbArticle.source_name,
        tags: dbArticle.seo_keywords || [],
        likesCount: dbArticle.likes_count || 0,
        commentsCount: dbArticle.comments_count || 0,
      }
    : {
        id: staticArticle!.id,
        title: staticArticle!.title,
        slug: staticArticle!.slug,
        excerpt: staticArticle!.excerpt,
        content: staticArticle!.content,
        image: staticArticle!.image,
        category: staticArticle!.category,
        categorySlug: staticArticle!.categorySlug,
        readTime: staticArticle!.readTime,
        publishedAt: staticArticle!.publishedAt,
        author: staticArticle!.author,
        authorAvatar: null,
        source: staticArticle!.source,
        tags: staticArticle!.tags,
        likesCount: 0,
        commentsCount: 0,
      };

  const relatedArticles = staticArticle ? getRelatedArticles(staticArticle, 4) : [];
  const timeAgo = formatDistanceToNow(new Date(articleData.publishedAt), { addSuffix: true });
  const formattedDate = format(new Date(articleData.publishedAt), "MMMM d, yyyy");

  return (
    <Layout>
      <SEOHead
        title={articleData.title}
        description={articleData.excerpt}
        canonical={`/article/${articleData.slug}`}
        type="article"
        image={articleData.image}
        publishedTime={articleData.publishedAt}
        author={articleData.author}
        tags={articleData.tags}
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
              <Link to={`/category/${articleData.categorySlug}`} className="hover:text-primary transition-colors">
                {articleData.category}
              </Link>
            </nav>

            {/* Category & Meta */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className={`category-badge category-${articleData.categorySlug}`}>
                {articleData.category}
              </span>
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" /> {articleData.readTime} min read
              </span>
            </div>

            {/* Title */}
            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
              {articleData.title}
            </h1>

            {/* Excerpt */}
            <p className="text-xl text-muted-foreground mb-6">{articleData.excerpt}</p>

            {/* Author & Date */}
            <div className="flex flex-wrap items-center gap-4 pb-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                  {articleData.authorAvatar ? (
                    <img src={articleData.authorAvatar} alt={articleData.author} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-primary font-semibold">{articleData.author[0]}</span>
                  )}
                </div>
                <div>
                  <p className="font-medium">{articleData.author}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-3 w-3" /> {formattedDate} • {timeAgo}
                  </p>
                </div>
              </div>
              {articleData.source && (
                <span className="text-sm text-muted-foreground">
                  Source: {articleData.source}
                </span>
              )}
            </div>

            {/* Share Bar */}
            <div className="flex flex-wrap items-center gap-4 py-4 border-b border-border">
              <span className="text-sm text-muted-foreground">Share:</span>
              <ShareButtons title={articleData.title} />
              <div className="flex-1" />
              <Button variant="ghost" size="sm" className="gap-2">
                <Bookmark className="h-4 w-4" /> Save
              </Button>
            </div>

            {/* Featured Image */}
            <div className="my-8">
              <img
                src={articleData.image}
                alt={articleData.title}
                className="w-full rounded-xl"
              />
            </div>

            {/* Custom HTML Snippet - Article Top */}
            <HTMLSnippetRenderer location="article_top" className="my-4" />

            {/* Article Body - Supports HTML content */}
            <HTMLContent content={articleData.content} />

            {/* Custom HTML Snippet - Article Bottom */}
            <HTMLSnippetRenderer location="article_bottom" className="my-4" />

            {/* Inline Ad */}
            <div className="my-8">
              <AdSlot type="inline" />
            </div>

            {/* Tags */}
            <div className="mt-8 pt-6 border-t border-border">
              <h4 className="text-sm font-semibold mb-3">Related Topics</h4>
              <div className="flex flex-wrap gap-2">
                {articleData.tags.map((tag) => (
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

            {/* Engagement Section */}
            <div className="mt-8 p-6 bg-card rounded-xl border border-border">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  {isDbArticle ? (
                    <>
                      <LikeButton articleId={articleData.id} />
                      <Button variant="ghost" className="gap-2">
                        <MessageCircle className="h-5 w-5" />
                        {articleData.commentsCount > 0 && <span>{articleData.commentsCount}</span>}
                        {articleData.commentsCount === 0 && <span>Comment</span>}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="ghost" className="gap-2" disabled>
                        <MessageCircle className="h-5 w-5" /> Comments unavailable
                      </Button>
                    </>
                  )}
                </div>
                {!isDbArticle && (
                  <p className="text-sm text-muted-foreground">
                    Engagement features available for published articles
                  </p>
                )}
              </div>
            </div>

            {/* Comments Section - Only for DB articles */}
            {isDbArticle && <CommentSection articleId={articleData.id} />}

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

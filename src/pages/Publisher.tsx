import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { useAuth } from "@/contexts/AuthContext";
import { ArticleEditor } from "@/components/publisher/ArticleEditor";
import { ArticleList } from "@/components/publisher/ArticleList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, PenSquare, BarChart3, ShieldAlert } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const Publisher = () => {
  const { user, loading, isPublisher } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("articles");
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  // Track if authorization check is complete to prevent UI flash
  const [authCheckComplete, setAuthCheckComplete] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/auth", { replace: true });
      } else if (!isPublisher) {
        navigate("/", { replace: true });
      } else {
        setAuthCheckComplete(true);
      }
    }
  }, [user, loading, isPublisher, navigate]);

  const handleEditArticle = (articleId: string) => {
    setEditingArticleId(articleId);
    setActiveTab("editor");
  };

  const handleNewArticle = () => {
    setEditingArticleId(null);
    setActiveTab("editor");
  };

  const handleEditorClose = () => {
    setEditingArticleId(null);
    setActiveTab("articles");
  };

  // Show loading state while checking auth
  if (loading || !authCheckComplete) {
    return (
      <Layout>
        <SEOHead
          title="Loading - TechPulse"
          description="Loading..."
          canonical="/publisher"
        />
        <div className="container py-12">
          <div className="space-y-6">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </Layout>
    );
  }

  // Double-check authorization before rendering publisher content
  // This is a defense-in-depth measure - RLS policies protect actual data
  if (!user || !isPublisher) {
    return (
      <Layout>
        <SEOHead
          title="Access Denied - TechPulse"
          description="You don't have permission to access this page."
          canonical="/publisher"
        />
        <div className="container py-12">
          <div className="flex flex-col items-center justify-center text-center">
            <ShieldAlert className="h-16 w-16 text-muted-foreground mb-4" />
            <h1 className="font-display text-2xl font-bold mb-2">Access Denied</h1>
            <p className="text-muted-foreground">
              You don't have permission to access this page.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEOHead
        title="Publisher Portal - TechPulse"
        description="Manage your articles, drafts, and content on TechPulse."
        canonical="/publisher"
      />

      <div className="container py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-2">Publisher Portal</h1>
          <p className="text-muted-foreground">
            Create, edit, and manage your articles
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="articles" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              My Articles
            </TabsTrigger>
            <TabsTrigger value="editor" className="flex items-center gap-2">
              <PenSquare className="h-4 w-4" />
              {editingArticleId ? "Edit Article" : "New Article"}
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Statistics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="articles" className="mt-6">
            <ArticleList 
              onEdit={handleEditArticle} 
              onNew={handleNewArticle}
            />
          </TabsContent>

          <TabsContent value="editor" className="mt-6">
            <ArticleEditor 
              articleId={editingArticleId} 
              onClose={handleEditorClose}
            />
          </TabsContent>

          <TabsContent value="stats" className="mt-6">
            <div className="bg-card rounded-xl border border-border p-8 text-center">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-display text-xl font-semibold mb-2">Statistics Coming Soon</h3>
              <p className="text-muted-foreground">
                Track your article views, likes, and engagement metrics.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Publisher;

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, FileCheck, Rss, Code } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { UserManagement } from "@/components/admin/UserManagement";
import { ArticleApproval } from "@/components/admin/ArticleApproval";
import { RSSFeedManager } from "@/components/admin/RSSFeedManager";
import { HTMLSnippets } from "@/components/admin/HTMLSnippets";

const Admin = () => {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!loading && user && !isAdmin) {
      navigate("/");
    }
  }, [user, loading, isAdmin, navigate]);

  if (loading) {
    return (
      <Layout>
        <div className="container py-12">
          <div className="space-y-6">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <Layout>
      <SEOHead
        title="Admin Dashboard - TechPulse"
        description="Manage users, articles, RSS feeds, and site settings."
        canonical="/admin"
      />

      <div className="container py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage users, content, and site configuration
          </p>
        </div>

        <Tabs defaultValue="articles" className="space-y-6">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="articles" className="flex items-center gap-2">
              <FileCheck className="h-4 w-4" />
              Article Approval
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="rss" className="flex items-center gap-2">
              <Rss className="h-4 w-4" />
              RSS Feeds
            </TabsTrigger>
            <TabsTrigger value="html" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              HTML Snippets
            </TabsTrigger>
          </TabsList>

          <TabsContent value="articles" className="mt-6">
            <ArticleApproval />
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <UserManagement />
          </TabsContent>

          <TabsContent value="rss" className="mt-6">
            <RSSFeedManager />
          </TabsContent>

          <TabsContent value="html" className="mt-6">
            <HTMLSnippets />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Admin;

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, FileCheck, Rss, Code, ShieldAlert, FolderTree, FileText, Settings, BarChart3 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { UserManagement } from "@/components/admin/UserManagement";
import { ArticleApproval } from "@/components/admin/ArticleApproval";
import { RSSFeedManager } from "@/components/admin/RSSFeedManager";
import { HTMLSnippets } from "@/components/admin/HTMLSnippets";
import { CategoryManagement } from "@/components/admin/CategoryManagement";
import { ArticleManagement } from "@/components/admin/ArticleManagement";
import { SettingsPanel } from "@/components/admin/SettingsPanel";
import { AnalyticsDashboard } from "@/components/admin/AnalyticsDashboard";
import { useRealtimeAdmin } from "@/hooks/useRealtimeAdmin";
const Admin = () => {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  // Track if authorization check is complete to prevent UI flash
  const [authCheckComplete, setAuthCheckComplete] = useState(false);
  
  // Enable realtime updates for admin data
  useRealtimeAdmin();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/auth", { replace: true });
      } else if (!isAdmin) {
        navigate("/", { replace: true });
      } else {
        setAuthCheckComplete(true);
      }
    }
  }, [user, loading, isAdmin, navigate]);

  // Show loading state while checking auth
  if (loading || !authCheckComplete) {
    return (
      <Layout>
        <SEOHead
          title="Loading - TechPulse"
          description="Loading..."
          canonical="/admin"
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

  // Double-check authorization before rendering admin content
  // This is a defense-in-depth measure - RLS policies protect actual data
  if (!user || !isAdmin) {
    return (
      <Layout>
        <SEOHead
          title="Access Denied - TechPulse"
          description="You don't have permission to access this page."
          canonical="/admin"
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

        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="bg-card border border-border flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="articles" className="flex items-center gap-2">
              <FileCheck className="h-4 w-4" />
              Approval
            </TabsTrigger>
            <TabsTrigger value="all-articles" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Articles
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-2">
              <FolderTree className="h-4 w-4" />
              Categories
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="rss" className="flex items-center gap-2">
              <Rss className="h-4 w-4" />
              RSS
            </TabsTrigger>
            <TabsTrigger value="html" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              HTML
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="mt-6">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="articles" className="mt-6">
            <ArticleApproval />
          </TabsContent>

          <TabsContent value="all-articles" className="mt-6">
            <ArticleManagement />
          </TabsContent>

          <TabsContent value="categories" className="mt-6">
            <CategoryManagement />
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

          <TabsContent value="settings" className="mt-6">
            <SettingsPanel />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Admin;

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, Heart, MessageCircle, FileText, TrendingUp } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { format, subDays, eachDayOfInterval } from "date-fns";

export const PublisherStats = () => {
  const { user } = useAuth();

  // Fetch publisher's articles with stats
  const { data: articles, isLoading } = useQuery({
    queryKey: ["publisher-stats", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("id, title, status, views_count, likes_count, comments_count, daily_views, created_at, published_at")
        .eq("author_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Calculate totals
  const totals = {
    articles: articles?.length || 0,
    published: articles?.filter((a) => a.status === "published").length || 0,
    views: articles?.reduce((sum, a) => sum + (a.views_count || 0), 0) || 0,
    likes: articles?.reduce((sum, a) => sum + (a.likes_count || 0), 0) || 0,
    comments: articles?.reduce((sum, a) => sum + (a.comments_count || 0), 0) || 0,
  };

  // Generate chart data for the last 30 days
  const generateChartData = () => {
    const last30Days = eachDayOfInterval({
      start: subDays(new Date(), 29),
      end: new Date(),
    });

    return last30Days.map((date) => {
      const dateStr = format(date, "yyyy-MM-dd");
      let totalViews = 0;

      articles?.forEach((article) => {
        const dailyViews = article.daily_views as Array<{ date: string; count: number }> | null;
        if (dailyViews && Array.isArray(dailyViews)) {
          const dayData = dailyViews.find((d) => d.date === dateStr);
          if (dayData) {
            totalViews += dayData.count;
          }
        }
      });

      return {
        date: format(date, "MMM d"),
        views: totalViews,
      };
    });
  };

  // Generate engagement by article data
  const generateArticleEngagementData = () => {
    return (
      articles
        ?.filter((a) => a.status === "published")
        .slice(0, 10)
        .map((article) => ({
          name: article.title.length > 20 ? article.title.substring(0, 20) + "..." : article.title,
          views: article.views_count || 0,
          likes: article.likes_count || 0,
          comments: article.comments_count || 0,
        })) || []
    );
  };

  const chartData = generateChartData();
  const articleEngagementData = generateArticleEngagementData();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Articles
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.articles}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totals.published} published
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Views
            </CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.views.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              All time views
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Likes
            </CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.likes.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all articles
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Comments
            </CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.comments.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Community engagement
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Engagement Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totals.views > 0
                ? (((totals.likes + totals.comments) / totals.views) * 100).toFixed(1)
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              (Likes + Comments) / Views
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Views Over Time Chart */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Views Over Time (Last 30 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="views"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Article Engagement Chart */}
      {articleEngagementData.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top Articles Engagement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={articleEngagementData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    width={150}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="views" fill="hsl(var(--primary))" name="Views" />
                  <Bar dataKey="likes" fill="hsl(var(--chart-2))" name="Likes" />
                  <Bar dataKey="comments" fill="hsl(var(--chart-3))" name="Comments" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No data state */}
      {articles?.length === 0 && (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-display text-xl font-semibold mb-2">No statistics yet</h3>
            <p className="text-muted-foreground">
              Start publishing articles to see your performance metrics.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

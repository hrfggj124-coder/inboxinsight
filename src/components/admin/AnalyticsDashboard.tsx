import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { 
  TrendingUp, Eye, Users, MessageSquare, Heart, 
  FileText, ArrowUp, ArrowDown 
} from "lucide-react";
import { format, subDays, startOfDay, eachDayOfInterval } from "date-fns";

const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "#10B981", "#F59E0B", "#EF4444"];

export const AnalyticsDashboard = () => {
  // Fetch overview stats
  const { data: overviewStats, isLoading: overviewLoading } = useQuery({
    queryKey: ["analytics-overview"],
    queryFn: async () => {
      const [
        articlesRes,
        profilesRes,
        commentsRes,
        likesRes,
        publishedRes,
      ] = await Promise.all([
        supabase.from("articles").select("*", { count: "exact" }),
        supabase.from("profiles").select("*", { count: "exact" }),
        supabase.from("comments").select("*", { count: "exact" }),
        supabase.from("likes").select("*", { count: "exact" }),
        supabase.from("articles").select("views_count").eq("status", "published"),
      ]);

      const totalViews = publishedRes.data?.reduce((sum, a) => sum + (a.views_count || 0), 0) || 0;

      return {
        totalArticles: articlesRes.count || 0,
        totalUsers: profilesRes.count || 0,
        totalComments: commentsRes.count || 0,
        totalLikes: likesRes.count || 0,
        totalViews,
      };
    },
  });

  // Fetch articles by status
  const { data: articlesByStatus } = useQuery({
    queryKey: ["analytics-articles-status"],
    queryFn: async () => {
      const { data } = await supabase
        .from("articles")
        .select("status");

      const counts: Record<string, number> = {
        published: 0,
        draft: 0,
        pending: 0,
        rejected: 0,
      };

      data?.forEach((a) => {
        if (a.status in counts) {
          counts[a.status]++;
        }
      });

      return Object.entries(counts).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
      }));
    },
  });

  // Fetch top articles by views
  const { data: topArticles } = useQuery({
    queryKey: ["analytics-top-articles"],
    queryFn: async () => {
      const { data } = await supabase
        .from("articles")
        .select("title, views_count, likes_count, comments_count")
        .eq("status", "published")
        .order("views_count", { ascending: false })
        .limit(10);

      return data || [];
    },
  });

  // Fetch user growth over time
  const { data: userGrowth } = useQuery({
    queryKey: ["analytics-user-growth"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("created_at")
        .order("created_at", { ascending: true });

      // Group by day for the last 30 days
      const days = eachDayOfInterval({
        start: subDays(new Date(), 29),
        end: new Date(),
      });

      const dailyCounts = days.map((day) => {
        const dayStart = startOfDay(day);
        const count = data?.filter((p) => {
          const created = new Date(p.created_at);
          return (
            created >= dayStart &&
            created < new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
          );
        }).length || 0;

        return {
          date: format(day, "MMM d"),
          users: count,
        };
      });

      return dailyCounts;
    },
  });

  // Fetch article engagement over time
  const { data: engagementTrend } = useQuery({
    queryKey: ["analytics-engagement"],
    queryFn: async () => {
      const [commentsRes, likesRes] = await Promise.all([
        supabase.from("comments").select("created_at"),
        supabase.from("likes").select("created_at"),
      ]);

      const days = eachDayOfInterval({
        start: subDays(new Date(), 13),
        end: new Date(),
      });

      return days.map((day) => {
        const dayStart = startOfDay(day);
        const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

        const comments = commentsRes.data?.filter((c) => {
          const created = new Date(c.created_at);
          return created >= dayStart && created < dayEnd;
        }).length || 0;

        const likes = likesRes.data?.filter((l) => {
          const created = new Date(l.created_at);
          return created >= dayStart && created < dayEnd;
        }).length || 0;

        return {
          date: format(day, "MMM d"),
          comments,
          likes,
        };
      });
    },
  });

  // Fetch categories breakdown
  const { data: categoryStats } = useQuery({
    queryKey: ["analytics-categories"],
    queryFn: async () => {
      const { data: articles } = await supabase
        .from("articles")
        .select("category_id, categories:category_id(name)")
        .eq("status", "published");

      const counts: Record<string, number> = {};
      articles?.forEach((a: any) => {
        const name = a.categories?.name || "Uncategorized";
        counts[name] = (counts[name] || 0) + 1;
      });

      return Object.entries(counts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);
    },
  });

  if (overviewLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Views",
      value: overviewStats?.totalViews?.toLocaleString() || "0",
      icon: Eye,
      color: "text-blue-500",
    },
    {
      title: "Total Users",
      value: overviewStats?.totalUsers?.toLocaleString() || "0",
      icon: Users,
      color: "text-green-500",
    },
    {
      title: "Articles",
      value: overviewStats?.totalArticles?.toLocaleString() || "0",
      icon: FileText,
      color: "text-purple-500",
    },
    {
      title: "Comments",
      value: overviewStats?.totalComments?.toLocaleString() || "0",
      icon: MessageSquare,
      color: "text-orange-500",
    },
    {
      title: "Likes",
      value: overviewStats?.totalLikes?.toLocaleString() || "0",
      icon: Heart,
      color: "text-red-500",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">User Growth (Last 30 Days)</CardTitle>
            <CardDescription>New user registrations over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={userGrowth || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }} 
                    className="text-muted-foreground"
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }} 
                    className="text-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Engagement Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Engagement Trend (Last 14 Days)</CardTitle>
            <CardDescription>Comments and likes over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={engagementTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }}
                  />
                  <Bar dataKey="comments" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="likes" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Articles by Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Articles by Status</CardTitle>
            <CardDescription>Distribution of article statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={articlesByStatus || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {articlesByStatus?.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Categories Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Categories</CardTitle>
            <CardDescription>Most popular content categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {categoryStats?.map((cat, index) => (
                <div key={cat.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm font-medium">{cat.name}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{cat.value} articles</span>
                </div>
              ))}
              {(!categoryStats || categoryStats.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No published articles yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Articles */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Performing Articles</CardTitle>
            <CardDescription>By total views</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topArticles?.slice(0, 5).map((article, index) => (
                <div key={index} className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 min-w-0">
                    <span className="text-sm font-bold text-muted-foreground w-4">
                      {index + 1}.
                    </span>
                    <span className="text-sm font-medium truncate">{article.title}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {article.views_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      {article.likes_count}
                    </span>
                  </div>
                </div>
              ))}
              {(!topArticles || topArticles.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No published articles yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

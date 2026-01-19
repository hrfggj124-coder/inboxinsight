import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { Eye, MousePointerClick, TrendingUp, LayoutGrid, Calendar } from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

interface PerformanceMetrics {
  totalImpressions: number;
  totalClicks: number;
  ctr: number;
  topLocation: string;
}

interface LocationData {
  location: string;
  impressions: number;
  clicks: number;
  ctr: number;
}

interface DailyData {
  date: string;
  impressions: number;
  clicks: number;
}

export const AdPerformanceDashboard = () => {
  const [dateRange, setDateRange] = useState("7");
  const [selectedLocation, setSelectedLocation] = useState("all");

  // Fetch overall performance metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["ad-metrics", dateRange],
    queryFn: async (): Promise<PerformanceMetrics> => {
      const startDate = startOfDay(subDays(new Date(), parseInt(dateRange)));
      
      const { data: impressions, error: impError } = await supabase
        .from("ad_impressions")
        .select("*")
        .gte("created_at", startDate.toISOString());

      if (impError) throw impError;

      const totalImpressions = impressions?.filter(i => i.event_type === "impression").length || 0;
      const totalClicks = impressions?.filter(i => i.event_type === "click").length || 0;
      const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

      // Find top location
      const locationCounts = impressions?.reduce((acc: Record<string, number>, imp) => {
        if (imp.event_type === "impression") {
          acc[imp.location] = (acc[imp.location] || 0) + 1;
        }
        return acc;
      }, {}) || {};

      const topLocation = Object.entries(locationCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

      return { totalImpressions, totalClicks, ctr, topLocation };
    },
  });

  // Fetch data by location
  const { data: locationData, isLoading: locationLoading } = useQuery({
    queryKey: ["ad-location-data", dateRange],
    queryFn: async (): Promise<LocationData[]> => {
      const startDate = startOfDay(subDays(new Date(), parseInt(dateRange)));
      
      const { data: impressions, error } = await supabase
        .from("ad_impressions")
        .select("*")
        .gte("created_at", startDate.toISOString());

      if (error) throw error;

      const locationStats: Record<string, { impressions: number; clicks: number }> = {};
      
      impressions?.forEach(imp => {
        if (!locationStats[imp.location]) {
          locationStats[imp.location] = { impressions: 0, clicks: 0 };
        }
        if (imp.event_type === "impression") {
          locationStats[imp.location].impressions++;
        } else if (imp.event_type === "click") {
          locationStats[imp.location].clicks++;
        }
      });

      return Object.entries(locationStats).map(([location, stats]) => ({
        location,
        impressions: stats.impressions,
        clicks: stats.clicks,
        ctr: stats.impressions > 0 ? (stats.clicks / stats.impressions) * 100 : 0,
      }));
    },
  });

  // Fetch daily trends
  const { data: dailyData, isLoading: dailyLoading } = useQuery({
    queryKey: ["ad-daily-data", dateRange, selectedLocation],
    queryFn: async (): Promise<DailyData[]> => {
      const startDate = startOfDay(subDays(new Date(), parseInt(dateRange)));
      
      let query = supabase
        .from("ad_impressions")
        .select("*")
        .gte("created_at", startDate.toISOString());

      if (selectedLocation !== "all") {
        query = query.eq("location", selectedLocation);
      }

      const { data: impressions, error } = await query;

      if (error) throw error;

      // Group by date
      const dailyStats: Record<string, { impressions: number; clicks: number }> = {};
      
      // Initialize all dates in range
      for (let i = parseInt(dateRange) - 1; i >= 0; i--) {
        const date = format(subDays(new Date(), i), "yyyy-MM-dd");
        dailyStats[date] = { impressions: 0, clicks: 0 };
      }

      impressions?.forEach(imp => {
        const date = format(new Date(imp.created_at), "yyyy-MM-dd");
        if (dailyStats[date]) {
          if (imp.event_type === "impression") {
            dailyStats[date].impressions++;
          } else if (imp.event_type === "click") {
            dailyStats[date].clicks++;
          }
        }
      });

      return Object.entries(dailyStats)
        .map(([date, stats]) => ({
          date: format(new Date(date), "MMM d"),
          impressions: stats.impressions,
          clicks: stats.clicks,
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    },
  });

  const locations = locationData?.map(l => l.location) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Ad Performance</h2>
          <p className="text-muted-foreground">Track impressions and click-through rates</p>
        </div>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-40">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="14">Last 14 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metricsLoading ? "..." : metrics?.totalImpressions.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Ad views in period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metricsLoading ? "..." : metrics?.totalClicks.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Ad interactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Click-Through Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metricsLoading ? "..." : `${metrics?.ctr.toFixed(2)}%`}
            </div>
            <p className="text-xs text-muted-foreground">Average CTR</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Location</CardTitle>
            <LayoutGrid className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {metricsLoading ? "..." : metrics?.topLocation.replace(/-/g, " ")}
            </div>
            <p className="text-xs text-muted-foreground">Most impressions</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Daily Trends</TabsTrigger>
          <TabsTrigger value="locations">By Location</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Daily Performance</CardTitle>
                  <CardDescription>Impressions and clicks over time</CardDescription>
                </div>
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {locations.map(loc => (
                      <SelectItem key={loc} value={loc} className="capitalize">
                        {loc.replace(/-/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {dailyLoading ? (
                <div className="h-80 flex items-center justify-center text-muted-foreground">
                  Loading...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="impressions"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--primary))" }}
                      name="Impressions"
                    />
                    <Line
                      type="monotone"
                      dataKey="clicks"
                      stroke="hsl(var(--chart-2))"
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--chart-2))" }}
                      name="Clicks"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="locations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance by Location</CardTitle>
              <CardDescription>Comparison of ad slots</CardDescription>
            </CardHeader>
            <CardContent>
              {locationLoading ? (
                <div className="h-80 flex items-center justify-center text-muted-foreground">
                  Loading...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={locationData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis
                      type="category"
                      dataKey="location"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      width={100}
                      tickFormatter={(value) => value.replace(/-/g, " ")}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number, name: string) => [
                        name === "ctr" ? `${value.toFixed(2)}%` : value,
                        name === "ctr" ? "CTR" : name.charAt(0).toUpperCase() + name.slice(1),
                      ]}
                    />
                    <Legend />
                    <Bar dataKey="impressions" fill="hsl(var(--primary))" name="Impressions" />
                    <Bar dataKey="clicks" fill="hsl(var(--chart-2))" name="Clicks" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Location Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-muted/50">
                    <tr>
                      <th className="px-4 py-3">Location</th>
                      <th className="px-4 py-3 text-right">Impressions</th>
                      <th className="px-4 py-3 text-right">Clicks</th>
                      <th className="px-4 py-3 text-right">CTR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {locationData?.map((loc) => (
                      <tr key={loc.location} className="border-b border-border">
                        <td className="px-4 py-3 font-medium capitalize">
                          {loc.location.replace(/-/g, " ")}
                        </td>
                        <td className="px-4 py-3 text-right">{loc.impressions.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right">{loc.clicks.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={loc.ctr > 1 ? "text-green-500" : "text-muted-foreground"}>
                            {loc.ctr.toFixed(2)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                    {(!locationData || locationData.length === 0) && (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                          No ad performance data yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Impression Distribution</CardTitle>
                <CardDescription>Share by ad location</CardDescription>
              </CardHeader>
              <CardContent>
                {locationLoading ? (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    Loading...
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={locationData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ location, percent }) =>
                          `${location.replace(/-/g, " ")} (${(percent * 100).toFixed(0)}%)`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="impressions"
                      >
                        {locationData?.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Click Distribution</CardTitle>
                <CardDescription>Engagement by location</CardDescription>
              </CardHeader>
              <CardContent>
                {locationLoading ? (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    Loading...
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={locationData?.filter(l => l.clicks > 0)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ location, percent }) =>
                          `${location.replace(/-/g, " ")} (${(percent * 100).toFixed(0)}%)`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="clicks"
                      >
                        {locationData?.filter(l => l.clicks > 0).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Clock, CheckCircle, TrendingUp, Users, MessageSquare, BarChart3 } from "lucide-react";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, LineChart, Line, ResponsiveContainer } from "recharts";
import { format, subDays, startOfHour, parseISO } from "date-fns";
interface DailyStats {
  date: string;
  conversations: number;
  resolved: number;
  avgResponseTime: number;
}
interface HourlyStats {
  hour: number;
  conversations: number;
}
const chartConfig = {
  conversations: {
    label: "Conversations",
    color: "hsl(var(--primary))",
  },
  resolved: {
    label: "Resolved",
    color: "hsl(var(--secondary))",
  },
  responseTime: {
    label: "Response Time",
    color: "hsl(var(--accent))",
  },
} satisfies ChartConfig;
export const ChatAnalyticsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalConversations: 0,
    resolvedConversations: 0,
    avgResponseTime: 0,
    avgResolutionTime: 0,
    resolutionRate: 0,
    activeAgents: 0
  });
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [hourlyStats, setHourlyStats] = useState<HourlyStats[]>([]);
  useEffect(() => {
    fetchAnalytics();
  }, []);
  const fetchAnalytics = async () => {
    try {
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
      // Fetch conversations data
      const { data: conversations } = await supabase
        .from("chat_conversations")
        .select("id, status, created_at, closed_at")
        .gte("created_at", thirtyDaysAgo);
      // Fetch performance metrics
      const { data: perfMetrics } = await supabase
        .from("agent_performance_metrics")
        .select("first_response_time_seconds, resolution_time_seconds")
        .gte("created_at", thirtyDaysAgo);
      // Fetch active agents
      const { data: agents } = await supabase
        .from("support_agents")
        .select("user_id")
        .eq("is_available", true);
      if (conversations) {
        const total = conversations.length;
        const resolved = conversations.filter(c => c.status === "resolved" || c.status === "closed").length;
        
        // Calculate daily stats
        const dailyMap = new Map<string, { conversations: number; resolved: number }>();
        conversations.forEach(conv => {
          const date = format(parseISO(conv.created_at), "MMM dd");
          const existing = dailyMap.get(date) || { conversations: 0, resolved: 0 };
          existing.conversations++;
          if (conv.status === "resolved" || conv.status === "closed") {
            existing.resolved++;
          }
          dailyMap.set(date, existing);
        });
        const daily = Array.from(dailyMap.entries())
          .map(([date, data]) => ({
            date,
            conversations: data.conversations,
            resolved: data.resolved,
            avgResponseTime: 0
          }))
          .slice(-14);
        setDailyStats(daily);
        // Calculate hourly distribution
        const hourlyMap = new Map<number, number>();
        for (let i = 0; i < 24; i++) hourlyMap.set(i, 0);
        
        conversations.forEach(conv => {
          const hour = parseISO(conv.created_at).getHours();
          hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + 1);
        });
        const hourly = Array.from(hourlyMap.entries())
          .map(([hour, conversations]) => ({ hour, conversations }));
        setHourlyStats(hourly);
        // Calculate averages from performance metrics
        let avgResponse = 0;
        let avgResolution = 0;
        if (perfMetrics && perfMetrics.length > 0) {
          const responseTimes = perfMetrics.filter(m => m.first_response_time_seconds).map(m => m.first_response_time_seconds!);
          const resolutionTimes = perfMetrics.filter(m => m.resolution_time_seconds).map(m => m.resolution_time_seconds!);
          
          if (responseTimes.length > 0) {
            avgResponse = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
          }
          if (resolutionTimes.length > 0) {
            avgResolution = resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length;
          }
        }
        setMetrics({
          totalConversations: total,
          resolvedConversations: resolved,
          avgResponseTime: avgResponse,
          avgResolutionTime: avgResolution,
          resolutionRate: total > 0 ? (resolved / total) * 100 : 0,
          activeAgents: agents?.length || 0
        });
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };
  const formatTime = (seconds: number) => {
    if (seconds === 0) return "N/A";
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}m`;
  };
  const getPeakHour = () => {
    if (hourlyStats.length === 0) return "N/A";
    const peak = hourlyStats.reduce((max, curr) => curr.conversations > max.conversations ? curr : max);
    return `${peak.hour}:00 - ${peak.hour + 1}:00`;
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Conversations</p>
                <p className="text-2xl font-bold">{metrics.totalConversations}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Resolution Rate</p>
                <p className="text-2xl font-bold">{metrics.resolutionRate.toFixed(1)}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Response Time</p>
                <p className="text-2xl font-bold">{formatTime(metrics.avgResponseTime)}</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Agents</p>
                <p className="text-2xl font-bold">{metrics.activeAgents}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Resolved Conversations</p>
                <p className="text-xl font-bold">{metrics.resolvedConversations}</p>
              </div>
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Resolution Time</p>
                <p className="text-xl font-bold">{formatTime(metrics.avgResolutionTime)}</p>
              </div>
              <TrendingUp className="h-6 w-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Peak Hour</p>
                <p className="text-xl font-bold">{getPeakHour()}</p>
              </div>
              <BarChart3 className="h-6 w-6 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Daily Conversations Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daily Conversations (Last 14 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          {dailyStats.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No data available</p>
          ) : (
            <ChartContainer config={chartConfig} className="h-[250px]">
              <BarChart data={dailyStats}>
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="conversations" fill="hsl(var(--primary))" radius={4} name="Total" />
                <Bar dataKey="resolved" fill="hsl(142.1 76.2% 36.3%)" radius={4} name="Resolved" />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
      {/* Hourly Distribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Peak Hours Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          {hourlyStats.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No data available</p>
          ) : (
            <ChartContainer config={chartConfig} className="h-[200px]">
              <LineChart data={hourlyStats}>
                <XAxis 
                  dataKey="hour" 
                  tickFormatter={(h) => `${h}:00`}
                />
                <YAxis />
                <ChartTooltip 
                  content={<ChartTooltipContent />}
                  labelFormatter={(h) => `${h}:00 - ${Number(h) + 1}:00`}
                />
                <Line 
                  type="monotone" 
                  dataKey="conversations" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))" }}
                />
              </LineChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
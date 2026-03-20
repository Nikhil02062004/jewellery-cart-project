import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Star, MessageSquare, TrendingUp, Users } from "lucide-react";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, LineChart, Line, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { ChatAnalyticsExport } from "./ChatAnalyticsExport";

interface FeedbackStats {
  total_feedback: number;
  avg_rating: number;
  rating_1_count: number;
  rating_2_count: number;
  rating_3_count: number;
  rating_4_count: number;
  rating_5_count: number;
  feedback_with_comments: number;
}

interface TrendData {
  date: string;
  avg_rating: number;
  feedback_count: number;
}

interface RecentFeedback {
  id: string;
  rating: number;
  feedback_text: string | null;
  created_at: string;
}

const chartConfig = {
  rating: {
    label: "Rating",
    color: "hsl(var(--primary))",
  },
  count: {
    label: "Count",
    color: "hsl(var(--secondary))",
  },
} satisfies ChartConfig;

const COLORS = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'];

export const FeedbackAnalytics = () => {
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [recentFeedback, setRecentFeedback] = useState<RecentFeedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Fetch overall stats
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_feedback_analytics');

      if (statsError) throw statsError;
      if (statsData && statsData.length > 0) {
        setStats(statsData[0] as FeedbackStats);
      }

      // Fetch trends
      const { data: trendsData, error: trendsError } = await supabase
        .rpc('get_feedback_trends');

      if (trendsError) throw trendsError;
      setTrends((trendsData || []).map((t: TrendData) => ({
        ...t,
        date: new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        avg_rating: Number(t.avg_rating)
      })));

      // Fetch recent feedback
      const { data: feedbackData, error: feedbackError } = await supabase
        .from('chat_feedback')
        .select('id, rating, feedback_text, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

      if (feedbackError) throw feedbackError;
      setRecentFeedback(feedbackData || []);

    } catch (error) {
      console.error('Error fetching feedback analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRatingDistribution = () => {
    if (!stats) return [];
    return [
      { name: '1 Star', value: Number(stats.rating_1_count), fill: COLORS[0] },
      { name: '2 Stars', value: Number(stats.rating_2_count), fill: COLORS[1] },
      { name: '3 Stars', value: Number(stats.rating_3_count), fill: COLORS[2] },
      { name: '4 Stars', value: Number(stats.rating_4_count), fill: COLORS[3] },
      { name: '5 Stars', value: Number(stats.rating_5_count), fill: COLORS[4] },
    ];
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'
            }`}
          />
        ))}
      </div>
    );
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
      
      {/* Header with Export */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Customer Feedback Analytics</h2>
        <ChatAnalyticsExport feedbackStats={stats} type="feedback" />
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Feedback</p>
                <p className="text-2xl font-bold">{stats?.total_feedback || 0}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average Rating</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">
                    {Number(stats?.avg_rating || 0).toFixed(1)}
                  </p>
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                </div>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">5-Star Reviews</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats?.rating_5_count || 0}
                </p>
              </div>
              <Star className="h-8 w-8 fill-green-500 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">With Comments</p>
                <p className="text-2xl font-bold">{stats?.feedback_with_comments || 0}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rating Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rating Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px]">
              <BarChart data={getRatingDistribution()} layout="vertical">
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={60} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" radius={4}>
                  {getRatingDistribution().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Rating Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rating Trends (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px]">
              <LineChart data={trends}>
                <XAxis dataKey="date" />
                <YAxis domain={[0, 5]} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line 
                  type="monotone" 
                  dataKey="avg_rating" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))" }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Feedback */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          {recentFeedback.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No feedback received yet</p>
          ) : (
            <div className="space-y-4">
              {recentFeedback.map((feedback) => (
                <div key={feedback.id} className="flex items-start gap-4 p-3 rounded-lg bg-muted/50">
                  <div className="flex-shrink-0">
                    {renderStars(feedback.rating)}
                  </div>
                  <div className="flex-1 min-w-0">
                    {feedback.feedback_text ? (
                      <p className="text-sm">{feedback.feedback_text}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No comment provided</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(feedback.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Target, Zap, Calendar } from "lucide-react";
import { differenceInDays, parseISO, subDays, format } from "date-fns";

interface Reel {
  id: string;
  views_count: number;
  likes_count: number;
  created_at: string;
  status: string;
}

interface PerformancePredictionsProps {
  reels: Reel[];
}

interface Prediction {
  label: string;
  current: number;
  predicted: number;
  trend: "up" | "down" | "stable";
  confidence: "high" | "medium" | "low";
  timeframe: string;
}

export function PerformancePredictions({ reels }: PerformancePredictionsProps) {
  const predictions = useMemo(() => {
    if (reels.length < 3) return null;

    const now = new Date();
    const approvedReels = reels.filter((r) => r.status === "approved");

    // Calculate average daily growth rates
    const reelsWithAge = approvedReels.map((reel) => {
      const age = Math.max(1, differenceInDays(now, parseISO(reel.created_at)));
      return {
        ...reel,
        age,
        viewsPerDay: reel.views_count / age,
        likesPerDay: reel.likes_count / age,
      };
    });

    if (reelsWithAge.length === 0) return null;

    // Calculate recent vs older performance for trend
    const recentReels = reelsWithAge.filter((r) => r.age <= 14);
    const olderReels = reelsWithAge.filter((r) => r.age > 14);

    const avgViewsPerDayRecent =
      recentReels.length > 0
        ? recentReels.reduce((sum, r) => sum + r.viewsPerDay, 0) / recentReels.length
        : 0;
    const avgViewsPerDayOlder =
      olderReels.length > 0
        ? olderReels.reduce((sum, r) => sum + r.viewsPerDay, 0) / olderReels.length
        : avgViewsPerDayRecent;

    const avgLikesPerDayRecent =
      recentReels.length > 0
        ? recentReels.reduce((sum, r) => sum + r.likesPerDay, 0) / recentReels.length
        : 0;
    const avgLikesPerDayOlder =
      olderReels.length > 0
        ? olderReels.reduce((sum, r) => sum + r.likesPerDay, 0) / olderReels.length
        : avgLikesPerDayRecent;

    // Calculate growth factor
    const viewsGrowthFactor = avgViewsPerDayOlder > 0 ? avgViewsPerDayRecent / avgViewsPerDayOlder : 1;
    const likesGrowthFactor = avgLikesPerDayOlder > 0 ? avgLikesPerDayRecent / avgLikesPerDayOlder : 1;

    // Current totals
    const totalViews = reels.reduce((sum, r) => sum + r.views_count, 0);
    const totalLikes = reels.reduce((sum, r) => sum + r.likes_count, 0);

    // Predicted values (next 30 days)
    const predictedViewsGrowth = avgViewsPerDayRecent * 30 * viewsGrowthFactor;
    const predictedLikesGrowth = avgLikesPerDayRecent * 30 * likesGrowthFactor;

    const getConfidence = (dataPoints: number): "high" | "medium" | "low" => {
      if (dataPoints >= 10) return "high";
      if (dataPoints >= 5) return "medium";
      return "low";
    };

    const getTrend = (factor: number): "up" | "down" | "stable" => {
      if (factor > 1.1) return "up";
      if (factor < 0.9) return "down";
      return "stable";
    };

    const predictions: Prediction[] = [
      {
        label: "Views",
        current: totalViews,
        predicted: Math.round(totalViews + predictedViewsGrowth),
        trend: getTrend(viewsGrowthFactor),
        confidence: getConfidence(reelsWithAge.length),
        timeframe: "Next 30 days",
      },
      {
        label: "Likes",
        current: totalLikes,
        predicted: Math.round(totalLikes + predictedLikesGrowth),
        trend: getTrend(likesGrowthFactor),
        confidence: getConfidence(reelsWithAge.length),
        timeframe: "Next 30 days",
      },
    ];

    // Engagement prediction
    const currentEngagement = totalViews > 0 ? (totalLikes / totalViews) * 100 : 0;
    const predictedEngagement =
      predictedViewsGrowth > 0
        ? ((totalLikes + predictedLikesGrowth) / (totalViews + predictedViewsGrowth)) * 100
        : currentEngagement;

    predictions.push({
      label: "Engagement Rate",
      current: parseFloat(currentEngagement.toFixed(1)),
      predicted: parseFloat(predictedEngagement.toFixed(1)),
      trend: getTrend(predictedEngagement / Math.max(currentEngagement, 0.1)),
      confidence: getConfidence(reelsWithAge.length),
      timeframe: "Next 30 days",
    });

    return {
      predictions,
      bestPerformingTime: calculateBestTime(approvedReels),
      recommendedPostFrequency: calculateRecommendedFrequency(approvedReels),
    };
  }, [reels]);

  if (!predictions) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="h-5 w-5 text-yellow-500" />
            Performance Predictions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Need at least 3 reels with some performance data to generate predictions.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getTrendIcon = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getConfidenceBadge = (confidence: "high" | "medium" | "low") => {
    const colors = {
      high: "bg-green-500",
      medium: "bg-yellow-500",
      low: "bg-muted",
    };
    return (
      <Badge className={`${colors[confidence]} text-xs`}>
        {confidence} confidence
      </Badge>
    );
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Zap className="h-5 w-5 text-yellow-500" />
          Performance Predictions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {predictions.predictions.map((pred) => (
            <div
              key={pred.label}
              className="p-4 border rounded-lg space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{pred.label}</span>
                {getConfidenceBadge(pred.confidence)}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">
                  {pred.label === "Engagement Rate"
                    ? `${pred.predicted}%`
                    : pred.predicted.toLocaleString()}
                </span>
                {getTrendIcon(pred.trend)}
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Current: {pred.label === "Engagement Rate" ? `${pred.current}%` : pred.current.toLocaleString()}
                </span>
                <span>{pred.timeframe}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Recommendations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm font-medium">Best Posting Time</p>
              <p className="text-sm text-muted-foreground">
                {predictions.bestPerformingTime}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Target className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm font-medium">Recommended Frequency</p>
              <p className="text-sm text-muted-foreground">
                {predictions.recommendedPostFrequency}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function calculateBestTime(reels: { created_at: string; views_count: number }[]) {
  if (reels.length === 0) return "Not enough data";

  const hourPerformance: { [hour: number]: { views: number; count: number } } = {};

  reels.forEach((reel) => {
    const hour = parseISO(reel.created_at).getHours();
    if (!hourPerformance[hour]) {
      hourPerformance[hour] = { views: 0, count: 0 };
    }
    hourPerformance[hour].views += reel.views_count;
    hourPerformance[hour].count++;
  });

  let bestHour = 12;
  let bestAvg = 0;

  Object.entries(hourPerformance).forEach(([hour, data]) => {
    const avg = data.views / data.count;
    if (avg > bestAvg) {
      bestAvg = avg;
      bestHour = parseInt(hour);
    }
  });

  const formatHour = (h: number) => {
    if (h === 0) return "12 AM";
    if (h === 12) return "12 PM";
    return h < 12 ? `${h} AM` : `${h - 12} PM`;
  };

  return `Around ${formatHour(bestHour)} - ${formatHour((bestHour + 2) % 24)}`;
}

function calculateRecommendedFrequency(reels: { created_at: string; views_count: number }[]) {
  if (reels.length < 2) return "Post at least 2-3 times per week to build momentum";

  const sortedReels = [...reels].sort(
    (a, b) => parseISO(a.created_at).getTime() - parseISO(b.created_at).getTime()
  );

  let totalGap = 0;
  for (let i = 1; i < sortedReels.length; i++) {
    totalGap += differenceInDays(
      parseISO(sortedReels[i].created_at),
      parseISO(sortedReels[i - 1].created_at)
    );
  }

  const avgGap = totalGap / (sortedReels.length - 1);

  if (avgGap <= 1) return "Great pace! Keep posting daily for maximum engagement";
  if (avgGap <= 3) return "Good frequency. 2-3 posts per week works well";
  if (avgGap <= 7) return "Try increasing to 2-3 posts per week for better growth";
  return "Consider posting more frequently - at least once per week";
}

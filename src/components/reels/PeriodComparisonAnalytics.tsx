import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { GitCompare, TrendingUp, TrendingDown, Minus, Eye, Heart, Film } from "lucide-react";
import { format, subDays, subWeeks, subMonths, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";

interface Reel {
  id: string;
  created_at: string;
  views_count: number;
  likes_count: number;
}

interface PeriodComparisonAnalyticsProps {
  reels: Reel[];
}

type Period = "7days" | "14days" | "30days" | "90days";

const periodOptions: { value: Period; label: string }[] = [
  { value: "7days", label: "Last 7 days" },
  { value: "14days", label: "Last 14 days" },
  { value: "30days", label: "Last 30 days" },
  { value: "90days", label: "Last 90 days" },
];

export function PeriodComparisonAnalytics({ reels }: PeriodComparisonAnalyticsProps) {
  const [open, setOpen] = useState(false);
  const [currentPeriod, setCurrentPeriod] = useState<Period>("7days");
  const [comparePeriod, setComparePeriod] = useState<Period>("7days");

  const getPeriodDays = (period: Period): number => {
    switch (period) {
      case "7days": return 7;
      case "14days": return 14;
      case "30days": return 30;
      case "90days": return 90;
    }
  };

  const getReelsInPeriod = (periodStart: Date, periodEnd: Date) => {
    return reels.filter((reel) => {
      const reelDate = new Date(reel.created_at);
      return isAfter(reelDate, startOfDay(periodStart)) && isBefore(reelDate, endOfDay(periodEnd));
    });
  };

  const comparison = useMemo(() => {
    const now = new Date();
    const currentDays = getPeriodDays(currentPeriod);
    const compareDays = getPeriodDays(comparePeriod);

    // Current period: from (now - currentDays) to now
    const currentEnd = now;
    const currentStart = subDays(now, currentDays);

    // Compare period: from (currentStart - compareDays) to currentStart
    const compareEnd = subDays(currentStart, 1);
    const compareStart = subDays(compareEnd, compareDays);

    const currentReels = getReelsInPeriod(currentStart, currentEnd);
    const compareReels = getReelsInPeriod(compareStart, compareEnd);

    const currentStats = {
      reels: currentReels.length,
      views: currentReels.reduce((sum, r) => sum + (r.views_count || 0), 0),
      likes: currentReels.reduce((sum, r) => sum + (r.likes_count || 0), 0),
      period: `${format(currentStart, "MMM d")} - ${format(currentEnd, "MMM d")}`,
    };

    const compareStats = {
      reels: compareReels.length,
      views: compareReels.reduce((sum, r) => sum + (r.views_count || 0), 0),
      likes: compareReels.reduce((sum, r) => sum + (r.likes_count || 0), 0),
      period: `${format(compareStart, "MMM d")} - ${format(compareEnd, "MMM d")}`,
    };

    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    return {
      current: currentStats,
      compare: compareStats,
      changes: {
        reels: calculateChange(currentStats.reels, compareStats.reels),
        views: calculateChange(currentStats.views, compareStats.views),
        likes: calculateChange(currentStats.likes, compareStats.likes),
      },
    };
  }, [reels, currentPeriod, comparePeriod]);

  const chartData = [
    {
      metric: "Reels",
      current: comparison.current.reels,
      previous: comparison.compare.reels,
    },
    {
      metric: "Views",
      current: comparison.current.views,
      previous: comparison.compare.views,
    },
    {
      metric: "Likes",
      current: comparison.current.likes,
      previous: comparison.compare.likes,
    },
  ];

  const chartConfig = {
    current: {
      label: "Current Period",
      color: "hsl(var(--primary))",
    },
    previous: {
      label: "Previous Period",
      color: "hsl(var(--muted-foreground))",
    },
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return "text-green-500";
    if (change < 0) return "text-red-500";
    return "text-muted-foreground";
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <GitCompare className="h-4 w-4" />
          Compare Periods
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Period Comparison</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Period Selectors */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Current Period</label>
              <Select value={currentPeriod} onValueChange={(v) => setCurrentPeriod(v as Period)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {periodOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {comparison.current.period}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Compare With</label>
              <Select value={comparePeriod} onValueChange={(v) => setComparePeriod(v as Period)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {periodOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {comparison.compare.period}
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Film className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Reels</span>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-bold">{comparison.current.reels}</p>
                    <p className="text-xs text-muted-foreground">
                      vs {comparison.compare.reels}
                    </p>
                  </div>
                  <div className={`flex items-center gap-1 ${getChangeColor(comparison.changes.reels)}`}>
                    {getChangeIcon(comparison.changes.reels)}
                    <span className="text-sm font-medium">
                      {Math.abs(comparison.changes.reels).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Views</span>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-bold">{comparison.current.views.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">
                      vs {comparison.compare.views.toLocaleString()}
                    </p>
                  </div>
                  <div className={`flex items-center gap-1 ${getChangeColor(comparison.changes.views)}`}>
                    {getChangeIcon(comparison.changes.views)}
                    <span className="text-sm font-medium">
                      {Math.abs(comparison.changes.views).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium">Likes</span>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-bold">{comparison.current.likes.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">
                      vs {comparison.compare.likes.toLocaleString()}
                    </p>
                  </div>
                  <div className={`flex items-center gap-1 ${getChangeColor(comparison.changes.likes)}`}>
                    {getChangeIcon(comparison.changes.likes)}
                    <span className="text-sm font-medium">
                      {Math.abs(comparison.changes.likes).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Comparison Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Visual Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[200px] w-full">
                <BarChart data={chartData} layout="vertical">
                  <XAxis type="number" />
                  <YAxis dataKey="metric" type="category" width={60} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="current" fill="hsl(var(--primary))" radius={4} />
                  <Bar dataKey="previous" fill="hsl(var(--muted-foreground))" radius={4} />
                </BarChart>
              </ChartContainer>
              <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-primary" />
                  <span className="text-sm text-muted-foreground">Current</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Previous</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
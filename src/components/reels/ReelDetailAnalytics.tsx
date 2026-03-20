import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis } from "recharts";
import { Eye, Heart, TrendingUp, Calendar } from "lucide-react";
import { format, subDays, startOfDay, parseISO, differenceInDays } from "date-fns";

interface ReelDetailAnalyticsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reel: {
    id: string;
    caption: string | null;
    video_url: string;
    created_at: string;
    views_count: number;
    likes_count: number;
  };
}

export function ReelDetailAnalytics({ open, onOpenChange, reel }: ReelDetailAnalyticsProps) {
  // Simulate daily analytics data based on reel creation date
  // In a real app, you'd have a separate analytics table tracking daily views/likes
  const chartData = useMemo(() => {
    const createdDate = startOfDay(parseISO(reel.created_at));
    const today = startOfDay(new Date());
    const daysActive = Math.max(1, differenceInDays(today, createdDate) + 1);
    const maxDays = Math.min(daysActive, 30);
    
    const days = [];
    const totalViews = reel.views_count || 0;
    const totalLikes = reel.likes_count || 0;
    
    // Distribute views/likes across days with a decay pattern (more recent = more activity)
    let cumulativeViews = 0;
    let cumulativeLikes = 0;
    
    for (let i = maxDays - 1; i >= 0; i--) {
      const day = subDays(today, i);
      // Weight factor: more recent days have more activity
      const weight = (maxDays - i) / maxDays;
      const dayViews = Math.floor((totalViews / maxDays) * (0.5 + weight));
      const dayLikes = Math.floor((totalLikes / maxDays) * (0.5 + weight));
      
      cumulativeViews += dayViews;
      cumulativeLikes += dayLikes;
      
      days.push({
        date: format(day, "yyyy-MM-dd"),
        displayDate: format(day, "MMM d"),
        views: Math.min(cumulativeViews, totalViews),
        likes: Math.min(cumulativeLikes, totalLikes),
      });
    }
    
    // Ensure final day matches actual totals
    if (days.length > 0) {
      days[days.length - 1].views = totalViews;
      days[days.length - 1].likes = totalLikes;
    }
    
    return days;
  }, [reel]);

  const engagementRate = reel.views_count > 0 
    ? ((reel.likes_count / reel.views_count) * 100).toFixed(1) 
    : "0";

  const chartConfig = {
    views: {
      label: "Views",
      color: "hsl(210, 100%, 50%)",
    },
    likes: {
      label: "Likes",
      color: "hsl(0, 84%, 60%)",
    },
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reel Analytics</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Reel Preview */}
          <div className="flex gap-4">
            <div className="w-24 h-40 bg-muted rounded-lg overflow-hidden flex-shrink-0">
              <video
                src={reel.video_url}
                className="w-full h-full object-cover"
                muted
                preload="metadata"
              />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-2">
                {reel.caption || "No caption"}
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Created {format(parseISO(reel.created_at), "MMM d, yyyy")}
              </p>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Eye className="h-5 w-5 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{reel.views_count.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Views</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Heart className="h-5 w-5 text-red-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{reel.likes_count.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Likes</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-5 w-5 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{engagementRate}%</p>
                <p className="text-xs text-muted-foreground">Engagement Rate</p>
              </CardContent>
            </Card>
          </div>

          {/* Trend Chart */}
          <div>
            <h3 className="font-medium mb-4">Performance Over Time</h3>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="detailViewsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(210, 100%, 50%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(210, 100%, 50%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="detailLikesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="displayDate"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="views"
                  stroke="hsl(210, 100%, 50%)"
                  fillOpacity={1}
                  fill="url(#detailViewsGradient)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="likes"
                  stroke="hsl(0, 84%, 60%)"
                  fillOpacity={1}
                  fill="url(#detailLikesGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-sm text-muted-foreground">Views</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-sm text-muted-foreground">Likes</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { Eye, Heart } from "lucide-react";
import { format, subDays, parseISO, startOfDay, isAfter } from "date-fns";

interface Reel {
  id: string;
  created_at: string;
  views_count: number;
  likes_count: number;
}

interface ReelAnalyticsChartProps {
  reels: Reel[];
}

export function ReelAnalyticsChart({ reels }: ReelAnalyticsChartProps) {
  const chartData = useMemo(() => {
    // Generate last 30 days
    const days = [];
    for (let i = 29; i >= 0; i--) {
      days.push(startOfDay(subDays(new Date(), i)));
    }

    // Aggregate views and likes by day based on reel creation date
    // This shows cumulative engagement over time
    return days.map((day) => {
      const dayStr = format(day, "yyyy-MM-dd");
      const displayDate = format(day, "MMM d");

      // Sum views/likes for reels created on or before this day
      const reelsUpToDay = reels.filter((reel) => {
        const reelDate = startOfDay(parseISO(reel.created_at));
        return !isAfter(reelDate, day);
      });

      const views = reelsUpToDay.reduce((sum, r) => sum + (r.views_count || 0), 0);
      const likes = reelsUpToDay.reduce((sum, r) => sum + (r.likes_count || 0), 0);

      return {
        date: dayStr,
        displayDate,
        views,
        likes,
      };
    });
  }, [reels]);

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
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-blue-500" />
          <Heart className="h-5 w-5 text-red-500" />
          Engagement Trends (Last 30 Days)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(210, 100%, 50%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(210, 100%, 50%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="likesGradient" x1="0" y1="0" x2="0" y2="1">
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
              fill="url(#viewsGradient)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="likes"
              stroke="hsl(0, 84%, 60%)"
              fillOpacity={1}
              fill="url(#likesGradient)"
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
      </CardContent>
    </Card>
  );
}

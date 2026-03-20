import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer } from "recharts";
import { Eye, Heart, TrendingUp, Trophy, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { format, parseISO } from "date-fns";

interface Reel {
  id: string;
  caption: string | null;
  video_url: string;
  created_at: string;
  views_count: number;
  likes_count: number;
  status: string;
}

interface ReelCompareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reels: Reel[];
}

const COLORS = ["hsl(210, 100%, 50%)", "hsl(142, 76%, 36%)", "hsl(45, 93%, 47%)", "hsl(0, 84%, 60%)"];

export function ReelCompareDialog({ open, onOpenChange, reels }: ReelCompareDialogProps) {
  const comparisonData = useMemo(() => {
    if (reels.length < 2) return null;

    const viewsData = reels.map((reel, i) => ({
      name: `Reel ${i + 1}`,
      value: reel.views_count,
      caption: reel.caption || "No caption",
    }));

    const likesData = reels.map((reel, i) => ({
      name: `Reel ${i + 1}`,
      value: reel.likes_count,
      caption: reel.caption || "No caption",
    }));

    const engagementData = reels.map((reel, i) => ({
      name: `Reel ${i + 1}`,
      value: reel.views_count > 0 ? parseFloat(((reel.likes_count / reel.views_count) * 100).toFixed(1)) : 0,
      caption: reel.caption || "No caption",
    }));

    // Find winners
    const maxViews = Math.max(...reels.map((r) => r.views_count));
    const maxLikes = Math.max(...reels.map((r) => r.likes_count));
    const maxEngagement = Math.max(
      ...reels.map((r) => (r.views_count > 0 ? (r.likes_count / r.views_count) * 100 : 0))
    );

    return { viewsData, likesData, engagementData, maxViews, maxLikes, maxEngagement };
  }, [reels]);

  const getComparisonIcon = (value: number, maxValue: number, allValues: number[]) => {
    if (value === maxValue && allValues.filter((v) => v === maxValue).length === 1) {
      return <Trophy className="h-4 w-4 text-yellow-500" />;
    }
    const avg = allValues.reduce((a, b) => a + b, 0) / allValues.length;
    if (value > avg) return <ArrowUp className="h-4 w-4 text-green-500" />;
    if (value < avg) return <ArrowDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const chartConfig = {
    value: { label: "Value" },
  };

  if (!comparisonData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Compare Reels ({reels.length} selected)</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Reel Previews */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {reels.map((reel, i) => (
              <Card key={reel.id} className="overflow-hidden">
                <div className="relative aspect-[9/16] bg-muted">
                  <video
                    src={reel.video_url}
                    className="w-full h-full object-cover"
                    muted
                    preload="metadata"
                  />
                  <Badge 
                    className="absolute top-2 left-2" 
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  >
                    Reel {i + 1}
                  </Badge>
                </div>
                <CardContent className="p-3">
                  <p className="text-xs truncate mb-1">{reel.caption || "No caption"}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(parseISO(reel.created_at), "MMM d, yyyy")}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Stats Comparison Table */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-4">Performance Comparison</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 pr-4">Metric</th>
                      {reels.map((_, i) => (
                        <th key={i} className="text-center py-2 px-4">
                          <span 
                            className="inline-block w-3 h-3 rounded-full mr-2" 
                            style={{ backgroundColor: COLORS[i % COLORS.length] }} 
                          />
                          Reel {i + 1}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-3 pr-4 flex items-center gap-2">
                        <Eye className="h-4 w-4 text-blue-500" /> Views
                      </td>
                      {reels.map((reel, i) => (
                        <td key={i} className="text-center py-3 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <span className="font-medium">{reel.views_count.toLocaleString()}</span>
                            {getComparisonIcon(
                              reel.views_count,
                              comparisonData.maxViews,
                              reels.map((r) => r.views_count)
                            )}
                          </div>
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 pr-4 flex items-center gap-2">
                        <Heart className="h-4 w-4 text-red-500" /> Likes
                      </td>
                      {reels.map((reel, i) => (
                        <td key={i} className="text-center py-3 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <span className="font-medium">{reel.likes_count.toLocaleString()}</span>
                            {getComparisonIcon(
                              reel.likes_count,
                              comparisonData.maxLikes,
                              reels.map((r) => r.likes_count)
                            )}
                          </div>
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-500" /> Engagement
                      </td>
                      {reels.map((reel, i) => {
                        const engagement =
                          reel.views_count > 0
                            ? ((reel.likes_count / reel.views_count) * 100).toFixed(1)
                            : "0";
                        return (
                          <td key={i} className="text-center py-3 px-4">
                            <div className="flex items-center justify-center gap-2">
                              <span className="font-medium">{engagement}%</span>
                              {getComparisonIcon(
                                parseFloat(engagement),
                                comparisonData.maxEngagement,
                                reels.map((r) =>
                                  r.views_count > 0 ? (r.likes_count / r.views_count) * 100 : 0
                                )
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Views Bar Chart */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <Eye className="h-4 w-4 text-blue-500" /> Views Comparison
              </h3>
              <ChartContainer config={chartConfig} className="h-[200px] w-full">
                <BarChart data={comparisonData.viewsData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={50} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {comparisonData.viewsData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Likes Bar Chart */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <Heart className="h-4 w-4 text-red-500" /> Likes Comparison
              </h3>
              <ChartContainer config={chartConfig} className="h-[200px] w-full">
                <BarChart data={comparisonData.likesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={50} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {comparisonData.likesData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Engagement Bar Chart */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" /> Engagement Rate Comparison (%)
              </h3>
              <ChartContainer config={chartConfig} className="h-[200px] w-full">
                <BarChart data={comparisonData.engagementData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={50} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {comparisonData.engagementData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

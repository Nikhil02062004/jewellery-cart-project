import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Clock, MessageSquare, Star, CheckCircle, User } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, Cell } from "recharts";
import { ChatAnalyticsExport } from "./ChatAnalyticsExport";

interface AgentStats {
  agent_id: string;
  display_name: string;
  total_conversations: number;
  avg_response_time_seconds: number;
  avg_resolution_time_seconds: number;
  avg_satisfaction_rating: number;
  total_messages_sent: number;
}

const chartConfig = {
  conversations: {
    label: "Conversations",
    color: "hsl(var(--primary))",
  },
  rating: {
    label: "Rating",
    color: "hsl(var(--secondary))",
  },
} satisfies ChartConfig;

export const AgentPerformanceMetrics = () => {
  const [agentStats, setAgentStats] = useState<AgentStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgentStats();
  }, []);

  const fetchAgentStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_agent_performance_stats');

      if (error) throw error;
      setAgentStats((data || []).map((agent: AgentStats) => ({
        ...agent,
        total_conversations: Number(agent.total_conversations),
        avg_response_time_seconds: Number(agent.avg_response_time_seconds),
        avg_resolution_time_seconds: Number(agent.avg_resolution_time_seconds),
        avg_satisfaction_rating: Number(agent.avg_satisfaction_rating),
        total_messages_sent: Number(agent.total_messages_sent)
      })));
    } catch (error) {
      console.error('Error fetching agent stats:', error);
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

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return "text-green-600";
    if (rating >= 3.5) return "text-yellow-600";
    if (rating >= 2.5) return "text-orange-600";
    return "text-red-600";
  };

  const getPerformanceBadge = (rating: number) => {
    if (rating >= 4.5) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    if (rating >= 3.5) return <Badge className="bg-yellow-100 text-yellow-800">Good</Badge>;
    if (rating >= 2.5) return <Badge className="bg-orange-100 text-orange-800">Fair</Badge>;
    if (rating > 0) return <Badge className="bg-red-100 text-red-800">Needs Improvement</Badge>;
    return <Badge variant="secondary">No Data</Badge>;
  };

  const totalConversations = agentStats.reduce((sum, a) => sum + a.total_conversations, 0);
  const avgResponseTime = agentStats.length > 0 
    ? agentStats.reduce((sum, a) => sum + a.avg_response_time_seconds, 0) / agentStats.length 
    : 0;
  const avgRating = agentStats.length > 0
    ? agentStats.reduce((sum, a) => sum + a.avg_satisfaction_rating, 0) / agentStats.filter(a => a.avg_satisfaction_rating > 0).length || 0
    : 0;

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
        <h2 className="text-lg font-semibold">Agent Performance Metrics</h2>
        <ChatAnalyticsExport agentStats={agentStats} type="agents" />
      </div>
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Agents</p>
                <p className="text-2xl font-bold">{agentStats.length}</p>
              </div>
              <User className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Conversations</p>
                <p className="text-2xl font-bold">{totalConversations}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Response Time</p>
                <p className="text-2xl font-bold">{formatTime(avgResponseTime)}</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Satisfaction</p>
                <div className="flex items-center gap-2">
                  <p className={`text-2xl font-bold ${getRatingColor(avgRating)}`}>
                    {avgRating > 0 ? avgRating.toFixed(1) : "N/A"}
                  </p>
                  {avgRating > 0 && <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />}
                </div>
              </div>
              <CheckCircle className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversations Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conversations by Agent</CardTitle>
        </CardHeader>
        <CardContent>
          {agentStats.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No agent data available</p>
          ) : (
            <ChartContainer config={chartConfig} className="h-[200px]">
              <BarChart data={agentStats} layout="vertical">
                <XAxis type="number" />
                <YAxis dataKey="display_name" type="category" width={100} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="total_conversations" fill="hsl(var(--primary))" radius={4} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Agent Details Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Agent Performance Details</CardTitle>
        </CardHeader>
        <CardContent>
          {agentStats.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No agents found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead className="text-center">Conversations</TableHead>
                  <TableHead className="text-center">Avg Response</TableHead>
                  <TableHead className="text-center">Avg Resolution</TableHead>
                  <TableHead className="text-center">Messages Sent</TableHead>
                  <TableHead className="text-center">Satisfaction</TableHead>
                  <TableHead className="text-center">Performance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agentStats.map((agent) => (
                  <TableRow key={agent.agent_id}>
                    <TableCell className="font-medium">{agent.display_name}</TableCell>
                    <TableCell className="text-center">{agent.total_conversations}</TableCell>
                    <TableCell className="text-center">
                      {formatTime(agent.avg_response_time_seconds)}
                    </TableCell>
                    <TableCell className="text-center">
                      {formatTime(agent.avg_resolution_time_seconds)}
                    </TableCell>
                    <TableCell className="text-center">{agent.total_messages_sent}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span className={getRatingColor(agent.avg_satisfaction_rating)}>
                          {agent.avg_satisfaction_rating > 0 
                            ? agent.avg_satisfaction_rating.toFixed(1) 
                            : "N/A"}
                        </span>
                        {agent.avg_satisfaction_rating > 0 && (
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {getPerformanceBadge(agent.avg_satisfaction_rating)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

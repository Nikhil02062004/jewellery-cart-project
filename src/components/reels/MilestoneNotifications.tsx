import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trophy, Eye, Heart, Check, Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface Milestone {
  id: string;
  reel_id: string;
  milestone_type: "views" | "likes";
  milestone_value: number;
  reached_at: string;
  is_read: boolean;
  reel_caption?: string;
}

interface MilestoneNotificationsProps {
  userId: string;
  reels: { id: string; caption: string | null; views_count: number; likes_count: number }[];
}

const MILESTONES = {
  views: [100, 500, 1000, 5000, 10000, 50000, 100000],
  likes: [50, 100, 500, 1000, 5000, 10000],
};

export function MilestoneNotifications({ userId, reels }: MilestoneNotificationsProps) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchMilestones();
    checkAndCreateMilestones();
  }, [userId, reels]);

  const fetchMilestones = async () => {
    try {
      const { data, error } = await supabase
        .from("reel_milestones")
        .select("*")
        .eq("user_id", userId)
        .order("reached_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      // Enrich with reel captions
      const enrichedMilestones = (data || []).map((milestone) => {
        const reel = reels.find((r) => r.id === milestone.reel_id);
        return {
          ...milestone,
          milestone_type: milestone.milestone_type as "views" | "likes",
          reel_caption: reel?.caption || "Untitled Reel",
        };
      });

      setMilestones(enrichedMilestones);
      setUnreadCount(enrichedMilestones.filter((m) => !m.is_read).length);
    } catch (error) {
      console.error("Error fetching milestones:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkAndCreateMilestones = async () => {
    if (!reels.length) return;

    // Get existing milestones
    const { data: existingMilestones } = await supabase
      .from("reel_milestones")
      .select("reel_id, milestone_type, milestone_value")
      .eq("user_id", userId);

    const existing = new Set(
      (existingMilestones || []).map(
        (m) => `${m.reel_id}-${m.milestone_type}-${m.milestone_value}`
      )
    );

    const newMilestones: {
      reel_id: string;
      user_id: string;
      milestone_type: string;
      milestone_value: number;
    }[] = [];

    for (const reel of reels) {
      // Check views milestones
      for (const milestone of MILESTONES.views) {
        const key = `${reel.id}-views-${milestone}`;
        if (reel.views_count >= milestone && !existing.has(key)) {
          newMilestones.push({
            reel_id: reel.id,
            user_id: userId,
            milestone_type: "views",
            milestone_value: milestone,
          });
        }
      }

      // Check likes milestones
      for (const milestone of MILESTONES.likes) {
        const key = `${reel.id}-likes-${milestone}`;
        if (reel.likes_count >= milestone && !existing.has(key)) {
          newMilestones.push({
            reel_id: reel.id,
            user_id: userId,
            milestone_type: "likes",
            milestone_value: milestone,
          });
        }
      }
    }

    if (newMilestones.length > 0) {
      const { error } = await supabase.from("reel_milestones").insert(newMilestones);

      if (!error) {
        toast.success(`🎉 New milestone${newMilestones.length > 1 ? "s" : ""} reached!`);
        fetchMilestones();
      }
    }
  };

  const markAsRead = async (milestoneId: string) => {
    const { error } = await supabase
      .from("reel_milestones")
      .update({ is_read: true })
      .eq("id", milestoneId);

    if (!error) {
      setMilestones((prev) =>
        prev.map((m) => (m.id === milestoneId ? { ...m, is_read: true } : m))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  const markAllAsRead = async () => {
    const { error } = await supabase
      .from("reel_milestones")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (!error) {
      setMilestones((prev) => prev.map((m) => ({ ...m, is_read: true })));
      setUnreadCount(0);
    }
  };

  const getMilestoneIcon = (type: string) => {
    return type === "views" ? (
      <Eye className="h-4 w-4 text-blue-500" />
    ) : (
      <Heart className="h-4 w-4 text-red-500" />
    );
  };

  const formatMilestoneValue = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toString();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Milestones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Milestones
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-1">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              <Check className="h-4 w-4 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {milestones.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No milestones yet</p>
            <p className="text-xs mt-1">Keep creating great content!</p>
          </div>
        ) : (
          <ScrollArea className="h-[250px] pr-2">
            <div className="space-y-2">
              {milestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className={`flex items-start gap-3 p-3 rounded-lg transition-colors cursor-pointer ${
                    milestone.is_read
                      ? "bg-muted/30"
                      : "bg-primary/5 border border-primary/20"
                  }`}
                  onClick={() => !milestone.is_read && markAsRead(milestone.id)}
                >
                  <div className="p-2 rounded-full bg-background">
                    {getMilestoneIcon(milestone.milestone_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      🎉 {formatMilestoneValue(milestone.milestone_value)}{" "}
                      {milestone.milestone_type}!
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {milestone.reel_caption}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(milestone.reached_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  {!milestone.is_read && (
                    <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

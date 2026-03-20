import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { ReelLikesNotifications } from "@/components/reels/ReelLikesNotifications";
import { ReelAnalyticsChart } from "@/components/reels/ReelAnalyticsChart";
import { ReelEditDialog } from "@/components/reels/ReelEditDialog";
import { DateRangeFilter } from "@/components/reels/DateRangeFilter";
import { ReelDetailAnalytics } from "@/components/reels/ReelDetailAnalytics";
import { AnalyticsExport } from "@/components/reels/AnalyticsExport";
import { ReelCompareDialog } from "@/components/reels/ReelCompareDialog";
import { ScheduleReportDialog } from "@/components/reels/ScheduleReportDialog";
import { PerformancePredictions } from "@/components/reels/PerformancePredictions";
import { ReelDuplicateDialog } from "@/components/reels/ReelDuplicateDialog";
import { MilestoneNotifications } from "@/components/reels/MilestoneNotifications";
import { ReelTemplatesManager } from "@/components/reels/ReelTemplatesManager";
import { SaveAsTemplateDialog } from "@/components/reels/SaveAsTemplateDialog";
import { AutoArchiveSettings } from "@/components/reels/AutoArchiveSettings";
import { NotificationPreferences } from "@/components/reels/NotificationPreferences";
import { PeriodComparisonAnalytics } from "@/components/reels/PeriodComparisonAnalytics";
import { RealtimeMilestoneAlerts } from "@/components/reels/RealtimeMilestoneAlerts";
import { PushNotificationToggle } from "@/components/reels/PushNotificationToggle";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Eye,
  Heart,
  Film,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Pencil,
  Trash2,
  BarChart3,
  GitCompare,
  Calendar,
  Copy,
  Archive,
  ArchiveRestore,
  FileText,
  Save,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { DateRange } from "react-day-picker";
import { isWithinInterval, parseISO, startOfDay, endOfDay } from "date-fns";

interface UserReel {
  id: string;
  video_url: string;
  caption: string | null;
  status: string;
  is_featured: boolean;
  is_archived: boolean;
  created_at: string;
  views_count: number;
  likes_count: number;
  scheduled_at: string | null;
  product_id: string | null;
  products: {
    id: string;
    name: string;
  } | null;
}

export default function UserReelsProfile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("User");
  const [userEmail, setUserEmail] = useState<string>("");
  const [editingReel, setEditingReel] = useState<UserReel | null>(null);
  const [deletingReelId, setDeletingReelId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedReelForAnalytics, setSelectedReelForAnalytics] = useState<UserReel | null>(null);
  const [selectedReelIds, setSelectedReelIds] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [showCompareDialog, setShowCompareDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [duplicatingReel, setDuplicatingReel] = useState<UserReel | null>(null);
  const [showTemplatesManager, setShowTemplatesManager] = useState(false);
  const [savingAsTemplate, setSavingAsTemplate] = useState<UserReel | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        navigate("/auth");
        return;
      }

      setUserId(session.user.id);
      setUserEmail(session.user.email || "");
      setUserName(
        session.user.user_metadata?.name ||
          session.user.email?.split("@")[0] ||
          "User"
      );
    };

    checkAuth();
  }, [navigate]);

  const { data: reels, isLoading } = useQuery({
    queryKey: ["user-reels", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reels")
        .select(`*, products (id, name)`)
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data as unknown as UserReel[]).map((reel) => ({
        ...reel,
        is_archived: reel.is_archived ?? false,
      }));
    },
    enabled: !!userId,
  });

  // Separate active and archived reels
  const activeReels = useMemo(() => reels?.filter((r) => !r.is_archived) || [], [reels]);
  const archivedReels = useMemo(() => reels?.filter((r) => r.is_archived) || [], [reels]);

  // Filter reels by date range for analytics
  const filteredReelsForChart = useMemo(() => {
    if (!reels) return [];
    if (!dateRange?.from) return reels;

    return reels.filter((reel) => {
      const reelDate = parseISO(reel.created_at);
      const from = startOfDay(dateRange.from!);
      const to = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from!);
      return isWithinInterval(reelDate, { start: from, end: to });
    });
  }, [reels, dateRange]);

  // Get selected reels for comparison
  const selectedReelsForCompare = useMemo(() => {
    if (!reels) return [];
    return reels.filter((reel) => selectedReelIds.has(reel.id));
  }, [reels, selectedReelIds]);

  const stats = {
    totalReels: activeReels.length,
    archivedReels: archivedReels.length,
    totalViews: activeReels.reduce((sum, r) => sum + (r.views_count || 0), 0),
    totalLikes: activeReels.reduce((sum, r) => sum + (r.likes_count || 0), 0),
    approvedReels: activeReels.filter((r) => r.status === "approved").length,
    pendingReels: activeReels.filter((r) => r.status === "pending").length,
    scheduledReels: activeReels.filter((r) => r.status === "scheduled").length,
    engagementRate:
      activeReels.length > 0
        ? (
            (activeReels.reduce((sum, r) => sum + (r.likes_count || 0), 0) /
              Math.max(
                activeReels.reduce((sum, r) => sum + (r.views_count || 0), 0),
                1
              )) *
            100
          ).toFixed(1)
        : "0",
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-500 gap-1">
            <CheckCircle className="h-3 w-3" /> Live
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" /> Rejected
          </Badge>
        );
      case "scheduled":
        return (
          <Badge className="bg-blue-500 gap-1">
            <Clock className="h-3 w-3" /> Scheduled
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" /> Pending
          </Badge>
        );
    }
  };

  const filterReelsByStatus = (status: string | null, isArchived: boolean = false) => {
    const source = isArchived ? archivedReels : activeReels;
    if (status === null) return source;
    return source.filter((r) => r.status === status);
  };

  const handleArchiveReel = async (reelId: string, archive: boolean) => {
    try {
      const { error } = await supabase
        .from("reels")
        .update({ is_archived: archive })
        .eq("id", reelId);

      if (error) throw error;

      toast.success(archive ? "Reel archived" : "Reel restored");
      queryClient.invalidateQueries({ queryKey: ["user-reels", userId] });
    } catch (error) {
      console.error("Error archiving reel:", error);
      toast.error("Failed to update reel");
    }
  };

  const handleBulkArchive = async (archive: boolean) => {
    if (selectedReelIds.size === 0) return;
    try {
      const { error } = await supabase
        .from("reels")
        .update({ is_archived: archive })
        .in("id", Array.from(selectedReelIds));

      if (error) throw error;

      toast.success(
        `${selectedReelIds.size} reels ${archive ? "archived" : "restored"}`
      );
      setSelectedReelIds(new Set());
      queryClient.invalidateQueries({ queryKey: ["user-reels", userId] });
    } catch (error) {
      console.error("Error archiving reels:", error);
      toast.error("Failed to update reels");
    }
  };

  const handleDeleteReel = async () => {
    if (!deletingReelId) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("reels")
        .delete()
        .eq("id", deletingReelId);

      if (error) throw error;

      toast.success("Reel deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["user-reels", userId] });
    } catch (error) {
      console.error("Error deleting reel:", error);
      toast.error("Failed to delete reel");
    } finally {
      setIsDeleting(false);
      setDeletingReelId(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedReelIds.size === 0) return;
    setIsBulkDeleting(true);
    try {
      const { error } = await supabase
        .from("reels")
        .delete()
        .in("id", Array.from(selectedReelIds));

      if (error) throw error;

      toast.success(`${selectedReelIds.size} reels deleted successfully`);
      setSelectedReelIds(new Set());
      queryClient.invalidateQueries({ queryKey: ["user-reels", userId] });
    } catch (error) {
      console.error("Error deleting reels:", error);
      toast.error("Failed to delete reels");
    } finally {
      setIsBulkDeleting(false);
      setShowBulkDeleteDialog(false);
    }
  };

  const toggleReelSelection = (reelId: string) => {
    const newSelection = new Set(selectedReelIds);
    if (newSelection.has(reelId)) {
      newSelection.delete(reelId);
    } else {
      newSelection.add(reelId);
    }
    setSelectedReelIds(newSelection);
  };

  const toggleSelectAll = (reelsToSelect: UserReel[]) => {
    if (reelsToSelect.every((r) => selectedReelIds.has(r.id))) {
      const newSelection = new Set(selectedReelIds);
      reelsToSelect.forEach((r) => newSelection.delete(r.id));
      setSelectedReelIds(newSelection);
    } else {
      const newSelection = new Set(selectedReelIds);
      reelsToSelect.forEach((r) => newSelection.add(r.id));
      setSelectedReelIds(newSelection);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Realtime Milestone Push Notifications */}
      {userId && <RealtimeMilestoneAlerts userId={userId} />}
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="font-display text-4xl mb-2">My Reels</h1>
            <p className="text-muted-foreground">
              Welcome back, {userName}! Here's an overview of your jewelry reels.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowTemplatesManager(true)}
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              Templates
            </Button>
            <AutoArchiveSettings 
              onArchiveComplete={() => queryClient.invalidateQueries({ queryKey: ["user-reels", userId] })}
            />
            <Button
              variant="outline"
              onClick={() => setShowScheduleDialog(true)}
              className="gap-2"
            >
              <Calendar className="h-4 w-4" />
              Schedule Reports
            </Button>
            <PushNotificationToggle />
            <AnalyticsExport
              reels={filteredReelsForChart}
              totalStats={{
                totalReels: stats.totalReels,
                totalViews: stats.totalViews,
                totalLikes: stats.totalLikes,
                engagementRate: stats.engagementRate,
              }}
            />
            <Link to="/reels">
              <Button className="gap-2">
                <Film className="h-4 w-4" />
                Upload New Reel
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Reels
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Film className="h-5 w-5 text-primary" />
                <span className="text-2xl font-bold">{stats.totalReels}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Views
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-500" />
                <span className="text-2xl font-bold">
                  {stats.totalViews.toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Likes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                <span className="text-2xl font-bold">
                  {stats.totalLikes.toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Engagement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <span className="text-2xl font-bold">
                  {stats.engagementRate}%
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Live Reels
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-2xl font-bold">{stats.approvedReels}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                <span className="text-2xl font-bold">{stats.pendingReels}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Date Range Filter */}
        {reels && reels.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-medium mb-2">Filter Analytics by Date</h3>
            <DateRangeFilter dateRange={dateRange} onDateRangeChange={setDateRange} />
          </div>
        )}

        {/* Analytics Chart */}
        {filteredReelsForChart.length > 0 && <ReelAnalyticsChart reels={filteredReelsForChart} />}

        {/* Performance Predictions */}
        {reels && reels.length > 0 && <PerformancePredictions reels={reels} />}

        {/* Period Comparison Analytics */}
        {reels && reels.length > 0 && (
          <div className="mb-6">
            <PeriodComparisonAnalytics reels={reels} />
          </div>
        )}

        {/* Notifications Section */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Milestones</h3>
              {userId && <NotificationPreferences userId={userId} />}
            </div>
            {userId && reels && <MilestoneNotifications userId={userId} reels={reels} />}
          </div>
          {userId && <ReelLikesNotifications userId={userId} />}
        </div>

        {/* Bulk Actions */}
        {selectedReelIds.size > 0 && (
          <div className="mb-4 p-4 bg-muted rounded-lg flex flex-wrap items-center justify-between gap-4">
            <span className="text-sm font-medium">
              {selectedReelIds.size} reel{selectedReelIds.size > 1 ? "s" : ""} selected
            </span>
            <div className="flex flex-wrap gap-2">
              {selectedReelIds.size >= 2 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCompareDialog(true)}
                  className="gap-1"
                >
                  <GitCompare className="h-4 w-4" />
                  Compare ({selectedReelIds.size})
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkArchive(!showArchived)}
                className="gap-1"
              >
                {showArchived ? (
                  <>
                    <ArchiveRestore className="h-4 w-4" />
                    Restore Selected
                  </>
                ) : (
                  <>
                    <Archive className="h-4 w-4" />
                    Archive Selected
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedReelIds(new Set())}
              >
                Clear Selection
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowBulkDeleteDialog(true)}
                className="gap-1"
              >
                <Trash2 className="h-4 w-4" />
                Delete Selected
              </Button>
            </div>
          </div>
        )}

        {/* Reels Tabs */}
        <Tabs defaultValue="all" className="w-full" onValueChange={(v) => setShowArchived(v === "archived")}>
          <TabsList className="mb-6">
            <TabsTrigger value="all">All ({stats.totalReels})</TabsTrigger>
            <TabsTrigger value="approved">Live ({stats.approvedReels})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({stats.pendingReels})</TabsTrigger>
            <TabsTrigger value="scheduled">
              Scheduled ({stats.scheduledReels})
            </TabsTrigger>
            <TabsTrigger value="archived" className="gap-1">
              <Archive className="h-3 w-3" />
              Archived ({stats.archivedReels})
            </TabsTrigger>
          </TabsList>

          {["all", "approved", "pending", "scheduled", "archived"].map((tab) => {
            const isArchivedTab = tab === "archived";
            const tabReels = filterReelsByStatus(tab === "all" || tab === "archived" ? null : tab, isArchivedTab);
            const allSelected = tabReels.length > 0 && tabReels.every((r) => selectedReelIds.has(r.id));

            return (
              <TabsContent key={tab} value={tab}>
                {tabReels.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    {isArchivedTab ? (
                      <Archive className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    ) : (
                      <Film className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    )}
                    <p>No {isArchivedTab ? "archived " : ""}reels found{!isArchivedTab ? " in this category" : ""}.</p>
                    {tab === "all" && (
                      <Link to="/reels">
                        <Button className="mt-4">Upload Your First Reel</Button>
                      </Link>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Select All */}
                    <div className="mb-4 flex items-center gap-2">
                      <Checkbox
                        id={`select-all-${tab}`}
                        checked={allSelected}
                        onCheckedChange={() => toggleSelectAll(tabReels)}
                      />
                      <label
                        htmlFor={`select-all-${tab}`}
                        className="text-sm text-muted-foreground cursor-pointer"
                      >
                        Select all {tabReels.length} reels
                      </label>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {tabReels.map((reel) => (
                        <Card
                          key={reel.id}
                          className="overflow-hidden group cursor-pointer relative"
                        >
                          {/* Selection Checkbox */}
                          <div className="absolute top-2 left-2 z-10">
                            <Checkbox
                              checked={selectedReelIds.has(reel.id)}
                              onCheckedChange={() => toggleReelSelection(reel.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="bg-background/80"
                            />
                          </div>

                          <div
                            className="relative aspect-[9/16] bg-muted"
                            onClick={() => setSelectedReelForAnalytics(reel)}
                          >
                            <video
                              src={reel.video_url}
                              className="w-full h-full object-cover"
                              muted
                              preload="metadata"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <div className="flex flex-col items-center gap-2">
                                <BarChart3 className="h-8 w-8 text-white" />
                                <span className="text-white text-sm">View Analytics</span>
                              </div>
                            </div>
                            <div className="absolute top-2 right-2">
                              {getStatusBadge(reel.status)}
                            </div>
                            {reel.is_featured && (
                              <Badge className="absolute top-10 left-8 bg-yellow-500">
                                Featured
                              </Badge>
                            )}
                          </div>
                          <CardContent className="p-4">
                            <p className="text-sm truncate mb-2">
                              {reel.caption || "No caption"}
                            </p>
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                              <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1">
                                  <Eye className="h-3 w-3" /> {reel.views_count}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Heart className="h-3 w-3" /> {reel.likes_count}
                                </span>
                              </div>
                              <span className="text-xs">
                                {new Date(reel.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            {reel.products && (
                              <Link
                                to={`/product/${reel.products.id}`}
                                className="text-xs text-primary hover:underline mt-2 block"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Linked: {reel.products.name}
                              </Link>
                            )}
                            {reel.scheduled_at && reel.status === "scheduled" && (
                              <p className="text-xs text-blue-500 mt-2">
                                Publishes:{" "}
                                {new Date(reel.scheduled_at).toLocaleString()}
                              </p>
                            )}
                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t">
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 gap-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingReel(reel);
                                }}
                              >
                                <Pencil className="h-3 w-3" /> Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 gap-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDuplicatingReel(reel);
                                }}
                              >
                                <Copy className="h-3 w-3" /> Clone
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 gap-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSavingAsTemplate(reel);
                                }}
                              >
                                <Save className="h-3 w-3" /> Template
                              </Button>
                            </div>
                            <div className="flex gap-1 mt-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 gap-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleArchiveReel(reel.id, !isArchivedTab);
                                }}
                              >
                                {isArchivedTab ? (
                                  <>
                                    <ArchiveRestore className="h-3 w-3" /> Restore
                                  </>
                                ) : (
                                  <>
                                    <Archive className="h-3 w-3" /> Archive
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 gap-1 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeletingReelId(reel.id);
                                }}
                              >
                                <Trash2 className="h-3 w-3" /> Delete
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </>
                )}
              </TabsContent>
            );
          })}
        </Tabs>

        {/* Edit Dialog */}
        {editingReel && (
          <ReelEditDialog
            open={!!editingReel}
            onOpenChange={(open) => !open && setEditingReel(null)}
            reel={editingReel}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ["user-reels", userId] });
            }}
          />
        )}

        {/* Reel Detail Analytics Dialog */}
        {selectedReelForAnalytics && (
          <ReelDetailAnalytics
            open={!!selectedReelForAnalytics}
            onOpenChange={(open) => !open && setSelectedReelForAnalytics(null)}
            reel={selectedReelForAnalytics}
          />
        )}

        {/* Compare Dialog */}
        {showCompareDialog && selectedReelsForCompare.length >= 2 && (
          <ReelCompareDialog
            open={showCompareDialog}
            onOpenChange={setShowCompareDialog}
            reels={selectedReelsForCompare}
          />
        )}

        {/* Schedule Report Dialog */}
        <ScheduleReportDialog
          open={showScheduleDialog}
          onOpenChange={setShowScheduleDialog}
          userEmail={userEmail}
        />

        {/* Duplicate Reel Dialog */}
        {duplicatingReel && userId && (
          <ReelDuplicateDialog
            open={!!duplicatingReel}
            onOpenChange={(open) => !open && setDuplicatingReel(null)}
            reel={{ ...duplicatingReel, user_id: userId }}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ["user-reels", userId] });
            }}
          />
        )}

        {/* Templates Manager Dialog */}
        {userId && (
          <ReelTemplatesManager
            open={showTemplatesManager}
            onOpenChange={setShowTemplatesManager}
            userId={userId}
          />
        )}

        {/* Save as Template Dialog */}
        {savingAsTemplate && userId && (
          <SaveAsTemplateDialog
            open={!!savingAsTemplate}
            onOpenChange={(open) => !open && setSavingAsTemplate(null)}
            reel={savingAsTemplate}
            userId={userId}
          />
        )}

        <AlertDialog open={!!deletingReelId} onOpenChange={(open) => !open && setDeletingReelId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Reel</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this reel? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteReel}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Bulk Delete Confirmation Dialog */}
        <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {selectedReelIds.size} Reels</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {selectedReelIds.size} reel{selectedReelIds.size > 1 ? "s" : ""}? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleBulkDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={isBulkDeleting}
              >
                {isBulkDeleting ? "Deleting..." : `Delete ${selectedReelIds.size} Reels`}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}

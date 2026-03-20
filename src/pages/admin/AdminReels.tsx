import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  MessageSquare,
  Film,
  LogOut,
  Check,
  X,
  Trash2,
  Star,
  StarOff,
  ExternalLink,
  Pencil,
  Eye,
  Heart,
  TrendingUp,
  Clock,
  Calendar,
} from "lucide-react";
import { Link } from "react-router-dom";

interface Reel {
  id: string;
  video_url: string;
  caption: string | null;
  status: string;
  is_featured: boolean;
  created_at: string;
  views_count: number;
  likes_count: number;
  user_id: string;
  product_id: string | null;
  scheduled_at: string | null;
  products: {
    id: string;
    name: string;
  } | null;
}

interface Product {
  id: string;
  name: string;
}

export default function AdminReels() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingReel, setEditingReel] = useState<Reel | null>(null);
  const [editCaption, setEditCaption] = useState("");
  const [editProductId, setEditProductId] = useState<string>("");
  const [schedulingReel, setSchedulingReel] = useState<Reel | null>(null);
  const [scheduleDate, setScheduleDate] = useState<string>("");

  useEffect(() => {
    const checkAdmin = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!roleData) {
        navigate("/");
        return;
      }

      setIsAdmin(true);
      setLoading(false);
    };

    checkAdmin();
  }, [navigate]);

  const { data: reels, isLoading: reelsLoading } = useQuery({
    queryKey: ["admin-reels"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reels")
        .select(`*, products (id, name)`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Reel[];
    },
    enabled: isAdmin,
  });

  const { data: products } = useQuery({
    queryKey: ["products-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data as Product[];
    },
    enabled: isAdmin,
  });

  // Calculate analytics
  const analytics = {
    totalReels: reels?.length || 0,
    totalViews: reels?.reduce((sum, r) => sum + (r.views_count || 0), 0) || 0,
    totalLikes: reels?.reduce((sum, r) => sum + (r.likes_count || 0), 0) || 0,
    pendingReels: reels?.filter((r) => r.status === "pending").length || 0,
    approvedReels: reels?.filter((r) => r.status === "approved").length || 0,
    scheduledReels: reels?.filter((r) => r.status === "scheduled").length || 0,
    featuredReels: reels?.filter((r) => r.is_featured).length || 0,
    engagementRate:
      reels && reels.length > 0
        ? (
            (reels.reduce((sum, r) => sum + (r.likes_count || 0), 0) /
              Math.max(reels.reduce((sum, r) => sum + (r.views_count || 0), 0), 1)) *
            100
          ).toFixed(1)
        : "0",
  };

  const sendNotificationEmail = async (reelId: string, status: string, userId: string) => {
    try {
      const { error } = await supabase.functions.invoke("send-reel-notification", {
        body: { reel_id: reelId, status, user_id: userId },
      });
      if (error) {
        console.error("Failed to send notification email:", error);
      } else {
        console.log("Notification email sent successfully");
      }
    } catch (err) {
      console.error("Error sending notification:", err);
    }
  };

  const updateReelMutation = useMutation({
    mutationFn: async ({
      id,
      updates,
      userId,
      sendEmail,
    }: {
      id: string;
      updates: { status?: string; is_featured?: boolean; caption?: string; product_id?: string | null; scheduled_at?: string | null };
      userId?: string;
      sendEmail?: boolean;
    }) => {
      const { error } = await supabase.from("reels").update(updates).eq("id", id);
      if (error) throw error;
      
      // Send email notification for status changes
      if (sendEmail && userId && updates.status) {
        await sendNotificationEmail(id, updates.status, userId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reels"] });
      toast({ title: "Reel updated successfully" });
      setEditingReel(null);
      setSchedulingReel(null);
      setScheduleDate("");
    },
    onError: (error: any) => {
      toast({
        title: "Error updating reel",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteReelMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reels").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reels"] });
      toast({ title: "Reel deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting reel",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const openEditDialog = (reel: Reel) => {
    setEditingReel(reel);
    setEditCaption(reel.caption || "");
    setEditProductId(reel.product_id || "");
  };

  const handleSaveEdit = () => {
    if (!editingReel) return;
    updateReelMutation.mutate({
      id: editingReel.id,
      updates: {
        caption: editCaption.trim() || null,
        product_id: editProductId || null,
      },
    });
  };

  const handleStatusChange = (reel: Reel, newStatus: string) => {
    const previousStatus = reel.status;
    // Only send email if status actually changes and it's approved/rejected
    const shouldSendEmail = previousStatus !== newStatus && (newStatus === "approved" || newStatus === "rejected");
    
    updateReelMutation.mutate({
      id: reel.id,
      updates: { status: newStatus },
      userId: reel.user_id,
      sendEmail: shouldSendEmail,
    });
  };

  const getStatusBadge = (status: string, scheduledAt?: string | null) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      case "scheduled":
        return (
          <Badge className="bg-blue-500 gap-1">
            <Clock className="h-3 w-3" />
            {scheduledAt ? new Date(scheduledAt).toLocaleDateString() : "Scheduled"}
          </Badge>
        );
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  if (loading || reelsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <div className="flex gap-4">
            <Link to="/">
              <Button variant="outline" size="sm">
                View Store
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="w-64 border-r border-border min-h-[calc(100vh-73px)] bg-card p-4">
          <nav className="space-y-2">
            <Link to="/admin">
              <Button variant="ghost" className="w-full justify-start">
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            <Link to="/admin/products">
              <Button variant="ghost" className="w-full justify-start">
                <Package className="h-4 w-4 mr-2" />
                Products
              </Button>
            </Link>
            <Link to="/admin/orders">
              <Button variant="ghost" className="w-full justify-start">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Orders
              </Button>
            </Link>
            <Link to="/admin/inquiries">
              <Button variant="ghost" className="w-full justify-start">
                <MessageSquare className="h-4 w-4 mr-2" />
                Inquiries
              </Button>
            </Link>
            <Link to="/admin/reels">
              <Button variant="secondary" className="w-full justify-start">
                <Film className="h-4 w-4 mr-2" />
                Reels
              </Button>
            </Link>
          </nav>
        </aside>

        <main className="flex-1 p-6">
          <div className="mb-6">
            <h2 className="text-3xl font-bold">Manage Reels</h2>
            <p className="text-muted-foreground">
              Approve, reject, feature, edit, or delete user-submitted reels
            </p>
          </div>

          {/* Analytics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Reels</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Film className="h-4 w-4 text-primary" />
                  <span className="text-2xl font-bold">{analytics.totalReels}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Views</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-blue-500" />
                  <span className="text-2xl font-bold">{analytics.totalViews.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Likes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-red-500" />
                  <span className="text-2xl font-bold">{analytics.totalLikes.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Engagement Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-2xl font-bold">{analytics.engagementRate}%</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{analytics.pendingReels}</Badge>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Featured</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="text-2xl font-bold">{analytics.featuredReels}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Preview</TableHead>
                  <TableHead>Caption</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Featured</TableHead>
                  <TableHead>Stats</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reels?.map((reel) => (
                  <TableRow key={reel.id}>
                    <TableCell>
                      <div className="relative w-16 h-28 bg-muted rounded overflow-hidden">
                        <video
                          src={reel.video_url}
                          className="w-full h-full object-cover"
                          muted
                          preload="metadata"
                        />
                        <a
                          href={reel.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity"
                        >
                          <ExternalLink className="h-4 w-4 text-white" />
                        </a>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {reel.caption || "-"}
                    </TableCell>
                    <TableCell>
                      {reel.products ? (
                        <Link
                          to={`/product/${reel.products.id}`}
                          className="text-primary hover:underline"
                        >
                          {reel.products.name}
                        </Link>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(reel.status, reel.scheduled_at)}</TableCell>
                    <TableCell>
                      {reel.is_featured ? (
                        <Badge className="bg-yellow-500">Featured</Badge>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" /> {reel.views_count}
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="h-3 w-3" /> {reel.likes_count}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(reel.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => openEditDialog(reel)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {reel.status !== "approved" && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-green-500"
                            onClick={() => handleStatusChange(reel, "approved")}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        {reel.status !== "rejected" && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-red-500"
                            onClick={() => handleStatusChange(reel, "rejected")}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-blue-500"
                          onClick={() => {
                            setSchedulingReel(reel);
                            setScheduleDate(reel.scheduled_at || "");
                          }}
                          title="Schedule"
                        >
                          <Calendar className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-yellow-500"
                          onClick={() =>
                            updateReelMutation.mutate({
                              id: reel.id,
                              updates: { is_featured: !reel.is_featured },
                            })
                          }
                        >
                          {reel.is_featured ? (
                            <StarOff className="h-4 w-4" />
                          ) : (
                            <Star className="h-4 w-4" />
                          )}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Reel?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. The reel will be permanently deleted.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteReelMutation.mutate(reel.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {reels?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No reels found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </main>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingReel} onOpenChange={() => setEditingReel(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Reel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-caption">Caption</Label>
              <Textarea
                id="edit-caption"
                value={editCaption}
                onChange={(e) => setEditCaption(e.target.value)}
                placeholder="Enter reel caption..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Linked Product</Label>
              <Select value={editProductId} onValueChange={setEditProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No product link</SelectItem>
                  {products?.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingReel(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={updateReelMutation.isPending}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Dialog */}
      <Dialog open={!!schedulingReel} onOpenChange={() => setSchedulingReel(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Reel Publication</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Set a date and time when this reel should automatically be published.
              The reel will go live at the scheduled time.
            </p>
            <div className="space-y-2">
              <Label htmlFor="schedule-date">Publish Date & Time</Label>
              <Input
                id="schedule-date"
                type="datetime-local"
                value={scheduleDate ? new Date(scheduleDate).toISOString().slice(0, 16) : ""}
                onChange={(e) => setScheduleDate(e.target.value ? new Date(e.target.value).toISOString() : "")}
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
            {schedulingReel?.scheduled_at && (
              <p className="text-sm text-blue-500">
                Currently scheduled for: {new Date(schedulingReel.scheduled_at).toLocaleString()}
              </p>
            )}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            {schedulingReel?.status === "scheduled" && (
              <Button
                variant="outline"
                onClick={() => {
                  if (schedulingReel) {
                    updateReelMutation.mutate({
                      id: schedulingReel.id,
                      updates: { status: "pending", scheduled_at: null },
                    });
                  }
                }}
              >
                Cancel Schedule
              </Button>
            )}
            <Button variant="outline" onClick={() => setSchedulingReel(null)}>
              Close
            </Button>
            <Button
              onClick={() => {
                if (schedulingReel && scheduleDate) {
                  updateReelMutation.mutate({
                    id: schedulingReel.id,
                    updates: { status: "scheduled", scheduled_at: scheduleDate },
                  });
                }
              }}
              disabled={!scheduleDate || updateReelMutation.isPending}
            >
              <Clock className="h-4 w-4 mr-2" />
              Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

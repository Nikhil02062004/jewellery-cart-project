import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Film, 
  Trash2, 
  Eye, 
  Plus, 
  Clock, 
  CheckCircle,
  AlertCircle,
  MoreVertical,
  Volume2,
  VolumeX,
  Play,
  ArrowLeft,
  ShoppingBag,
  Package,
  MessageSquare,
  Headphones,
  BarChart3,
  Users,
  LayoutDashboard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import React from 'react';

interface Reel {
  id: string;
  video_url: string;
  thumbnail_url: string | null;
  caption: string | null;
  status: string;
  created_at: string;
  scheduled_at: string | null;
  product_id: string | null;
}

const AdminReels = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [newReel, setNewReel] = useState({ video_url: "", caption: "", product_id: "" });
  const [schedulingReel, setSchedulingReel] = useState<Reel | null>(null);
  const [scheduleDate, setScheduleDate] = useState("");
  
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/auth'); return; }
      
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (!roleData) { navigate('/'); return; }
      
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
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Reel[];
    },
    enabled: isAdmin,
  });

  const uploadReelMutation = useMutation({
    mutationFn: async (reel: Omit<Reel, "id" | "created_at" | "status" | "scheduled_at" | "thumbnail_url">) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const { data, error } = await supabase
        .from("reels")
        .insert({
          ...reel,
          status: "pending",
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reels"] });
      setIsUploadOpen(false);
      setNewReel({ video_url: "", caption: "", product_id: "" });
      toast.success("Reel submitted for processing");
    },
    onError: (error) => {
      toast.error(`Fault: ${error.message}`);
    },
  });

  const deleteReelMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reels").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reels"] });
      toast.success("Reel purged from archives");
    },
  });

  const updateReelMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Reel> }) => {
      const { error } = await supabase.from("reels").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reels"] });
      setSchedulingReel(null);
      toast.success("Reel parameters updated");
    },
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
     return (
       <div className="min-h-screen bg-slate-50 flex items-center justify-center">
         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold" />
       </div>
     );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 h-16 px-8 flex items-center justify-between sticky top-0 z-30 shadow-sm shrink-0">
        <div className="flex items-center gap-4">
          <Link to="/admin" className="text-slate-400 hover:text-charcoal transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="h-6 w-px bg-slate-200" />
          <h1 className="font-display text-xl font-bold text-charcoal">Cinematic Asset Manager</h1>
        </div>
        <div className="flex items-center gap-6">
          <Button onClick={() => setIsUploadOpen(true)} className="bg-gold hover:bg-gold/90 text-white rounded-xl font-bold text-xs uppercase tracking-widest gap-2 shadow-sm h-10 px-6">
            <Plus className="w-4 h-4" /> Commission Cinematic
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 bg-white border-r border-slate-200 p-6 hidden lg:flex flex-col shrink-0">
          <nav className="p-4 space-y-1 flex-1">
            <SidebarItem to="/admin" icon={<LayoutDashboard />} label="Dashboard" />
            <SidebarItem to="/admin/products" icon={<Package />} label="Products" />
            <SidebarItem to="/admin/orders" icon={<ShoppingBag />} label="Orders" />
            <SidebarItem to="/admin/inquiries" icon={<MessageSquare />} label="Inquiries" />
            <SidebarItem to="/admin/reels" icon={<Film />} label="Reels" active />
            <SidebarItem to="/admin/chat" icon={<Headphones />} label="Live Chat" />
            <SidebarItem to="/admin/analytics" icon={<BarChart3 />} label="Analytics" />
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 md:p-12 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700">
            <div className="flex items-end justify-between">
               <h2 className="font-display text-4xl font-bold text-charcoal italic leading-none">Portfolio Cinematics</h2>
               <div className="text-[10px] font-black uppercase tracking-widest text-slate-300">Total Assets: {reels?.length || 0}</div>
            </div>

            {reelsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="aspect-[9/16] bg-slate-100 animate-pulse rounded-[2.5rem]" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {reels?.map((reel) => (
                  <ReelCard 
                    key={reel.id} 
                    reel={reel} 
                    onDelete={() => deleteReelMutation.mutate(reel.id)}
                    onSchedule={() => setSchedulingReel(reel)}
                  />
                ))}
                {reels?.length === 0 && (
                  <div className="col-span-full bg-white rounded-[3rem] p-32 text-center border border-dashed border-slate-200">
                    <Film className="w-16 h-16 text-slate-100 mx-auto mb-6" />
                    <p className="text-slate-400 font-body text-lg italic uppercase tracking-widest font-black opacity-30">No Cinematic Footage Recorded</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Upload Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="max-w-xl bg-white rounded-[2.5rem] p-0 shadow-2xl overflow-hidden border-none text-charcoal">
          <div className="bg-charcoal p-8 text-white relative">
             <div className="absolute inset-0 bg-gold/5" />
             <DialogTitle className="font-display text-2xl font-bold relative z-10 italic">Commission New Cinematic</DialogTitle>
          </div>
          <div className="p-10 space-y-8">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400 ml-1">Footage URL (MP4)</Label>
              <Input
                value={newReel.video_url}
                onChange={(e) => setNewReel({ ...newReel, video_url: e.target.value })}
                placeholder="https://..."
                className="h-12 bg-slate-50 border-slate-100 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400 ml-1">Narrative Caption</Label>
              <Input
                value={newReel.caption}
                onChange={(e) => setNewReel({ ...newReel, caption: e.target.value })}
                placeholder="The essence of artisanal jewelry..."
                className="h-12 bg-slate-50 border-slate-100 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400 ml-1">Linked Asset (Product ID)</Label>
              <Input
                value={newReel.product_id}
                onChange={(e) => setNewReel({ ...newReel, product_id: e.target.value })}
                placeholder="Asset Reference Token"
                className="h-12 bg-slate-50 border-slate-100 rounded-xl"
              />
            </div>
            <Button
              className="w-full h-14 bg-gold text-white hover:bg-gold/90 font-black uppercase tracking-widest rounded-xl shadow-lg shadow-gold/10"
              onClick={() => uploadReelMutation.mutate(newReel)}
              disabled={!newReel.video_url || uploadReelMutation.isPending}
            >
              Authorize Deployment
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Schedule Dialog */}
      <Dialog open={!!schedulingReel} onOpenChange={() => setSchedulingReel(null)}>
        <DialogContent className="max-w-md bg-white rounded-[2.5rem] p-10 shadow-2xl border-none text-charcoal">
          <DialogHeader className="mb-8">
            <DialogTitle className="font-display text-2xl font-bold text-charcoal">Deployment Schedule</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Target Timestamp</Label>
              <Input
                type="datetime-local"
                value={scheduleDate ? new Date(scheduleDate).toISOString().slice(0, 16) : ""}
                onChange={(e) => setScheduleDate(e.target.value ? new Date(e.target.value).toISOString() : "")}
                className="h-12 bg-slate-50 border-slate-100 rounded-xl"
              />
            </div>
            <div className="flex flex-col gap-3">
               <Button
                 className="h-12 bg-gold text-white hover:bg-gold/90 font-black uppercase tracking-widest rounded-xl"
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
                 Authorize Schedule
               </Button>
               <Button variant="ghost" onClick={() => setSchedulingReel(null)} className="h-12 rounded-xl text-slate-400 hover:text-charcoal uppercase text-[10px] font-black tracking-widest">
                 Cancel Review
               </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

/* --- Reel Card Component with Mobile Fix --- */
const ReelCard = ({ reel, onDelete, onSchedule }: { reel: Reel, onDelete: () => void, onSchedule: () => void }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(
    JSON.parse(localStorage.getItem('reel-volume-state') || 'false')
  );
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    localStorage.setItem('reel-volume-state', JSON.stringify(isMuted));
    if (videoRef.current) {
        videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const toggleVolume = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
  };

  return (
    <div className="relative aspect-[9/16] bg-black rounded-[2.5rem] overflow-hidden group shadow-2xl shadow-charcoal/30">
      <video
        ref={videoRef}
        src={reel.video_url}
        poster={reel.thumbnail_url || undefined}
        className="w-full h-full object-cover"
        loop
        muted={isMuted}
        autoPlay={isPlaying}
        playsInline
      />
      
      {/* Overlay UI */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 flex flex-col justify-between p-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="flex justify-between items-start">
           <Badge className={cn("bg-white/10 backdrop-blur-md border-none text-[8px] uppercase font-black tracking-widest px-4 h-6 text-white", reel.status === 'live' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-gold/20 text-gold')}>
              {reel.status}
           </Badge>
           {/* Repositioned Volume Button for Mobile Fix */}
           <Button size="icon" variant="ghost" className="text-white hover:bg-white/10 rounded-full h-10 w-10 backdrop-blur-md" onClick={toggleVolume}>
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
           </Button>
        </div>

        <div className="space-y-6">
           <div>
              <p className="text-white font-body text-sm line-clamp-2 italic leading-relaxed">"{reel.caption || 'Authentic Cinematic Asset'}"</p>
           </div>
           <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1 bg-white/10 border-white/20 text-white hover:bg-gold hover:text-charcoal hover:border-gold rounded-xl h-10 text-[9px] font-black uppercase tracking-widest transition-all" onClick={onSchedule}>
                 <Clock className="w-3.5 h-3.5 mr-2" /> Schedule
              </Button>
              <Button size="sm" variant="outline" className="bg-white/10 border-white/20 text-red-400 hover:bg-red-500/20 hover:text-red-300 border-none rounded-xl h-10 w-10 p-0 flex items-center justify-center transition-all" onClick={onDelete}>
                 <Trash2 className="w-4 h-4" />
              </Button>
           </div>
        </div>
      </div>

      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Play className="w-16 h-16 text-white/40 fill-white/10" />
        </div>
      )}
    </div>
  );
};

const SidebarItem = ({ to, icon, label, active = false }: { to: string, icon: any, label: string, active?: boolean }) => (
  <Link
    to={to}
    className={cn(
      "flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all group",
      active 
        ? "bg-gold/10 text-gold shadow-sm font-bold" 
        : "text-slate-500 hover:bg-slate-50 hover:text-charcoal"
    )}
  >
    {React.cloneElement(icon as React.ReactElement, { className: "w-4 h-4 flex-shrink-0" })}
    <span className="font-body text-sm font-medium">{label}</span>
  </Link>
);

const Badge = ({ children, className }: { children: any, className?: string }) => (
  <span className={cn("inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", className)}>
    {children}
  </span>
);

export default AdminReels;

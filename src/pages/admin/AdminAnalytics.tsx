import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LayoutDashboard,
  Package,
  ShoppingBag,
  Film,
  Headphones,
  ArrowLeft,
  BarChart3,
  Star,
  Users,
  Bot,
  Calendar,
  MessageSquare,
  ChevronLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import React from 'react';
import { FeedbackAnalytics } from "@/components/admin/FeedbackAnalytics";
import { AgentPerformanceMetrics } from "@/components/admin/AgentPerformanceMetrics";
import { ChatAnalyticsDashboard } from "@/components/admin/ChatAnalyticsDashboard";
import { AgentScheduling } from "@/components/admin/AgentScheduling";
import { AutoResponsesManager } from "@/components/admin/AutoResponsesManager";

const AdminAnalytics = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (!roleData) {
        navigate('/');
        return;
      }

      setIsAdmin(true);
      setLoading(false);
    };

    checkAdmin();
  }, [navigate]);

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
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="h-6 w-px bg-slate-200" />
          <h1 className="font-display text-xl font-bold text-charcoal">Market Intelligence</h1>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 bg-white border-r border-slate-200 p-6 hidden lg:flex flex-col shrink-0">
          <nav className="p-4 space-y-1">
            <SidebarItem to="/admin" icon={<LayoutDashboard />} label="Dashboard" />
            <SidebarItem to="/admin/products" icon={<Package />} label="Products" />
            <SidebarItem to="/admin/orders" icon={<ShoppingBag />} label="Orders" />
            <SidebarItem to="/admin/inquiries" icon={<MessageSquare />} label="Inquiries" />
            <SidebarItem to="/admin/reels" icon={<Film />} label="Reels" />
            <SidebarItem to="/admin/chat" icon={<Headphones />} label="Live Chat" />
            <SidebarItem to="/admin/analytics" icon={<BarChart3 />} label="Analytics" active />
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 md:p-12 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700">
            <div className="flex items-end justify-between">
               <h2 className="font-display text-4xl font-bold text-charcoal italic leading-none">Intelligence Panel</h2>
               <div className="text-[10px] font-black uppercase tracking-widest text-slate-300">Synchronized Real-time Metrics</div>
            </div>

            <Tabs defaultValue="dashboard" className="space-y-10">
              <TabsList className="bg-white border border-slate-100 p-1.5 rounded-2xl w-full max-w-2xl shadow-sm h-14">
                <TabsTrigger value="dashboard" className="flex-1 rounded-xl data-[state=active]:bg-gold data-[state=active]:text-white flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                  <MessageSquare className="h-3.5 w-3.5" />
                  Chat Stats
                </TabsTrigger>
                <TabsTrigger value="feedback" className="flex-1 rounded-xl data-[state=active]:bg-gold data-[state=active]:text-white flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                  <Star className="h-3.5 w-3.5" />
                  Feedback
                </TabsTrigger>
                <TabsTrigger value="agents" className="flex-1 rounded-xl data-[state=active]:bg-gold data-[state=active]:text-white flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                  <Users className="h-3.5 w-3.5" />
                  Agents
                </TabsTrigger>
                <TabsTrigger value="scheduling" className="flex-1 rounded-xl data-[state=active]:bg-gold data-[state=active]:text-white flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                  <Calendar className="h-3.5 w-3.5" />
                  Schedule
                </TabsTrigger>
                <TabsTrigger value="autoresponses" className="flex-1 rounded-xl data-[state=active]:bg-gold data-[state=active]:text-white flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                  <Bot className="h-3.5 w-3.5" />
                  Auto-Bot
                </TabsTrigger>
              </TabsList>

              <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm min-h-[600px]">
                <TabsContent value="dashboard" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <ChatAnalyticsDashboard />
                </TabsContent>

                <TabsContent value="feedback" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <FeedbackAnalytics />
                </TabsContent>

                <TabsContent value="agents" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <AgentPerformanceMetrics />
                </TabsContent>

                <TabsContent value="scheduling" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <AgentScheduling />
                </TabsContent>
                
                <TabsContent value="autoresponses" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <AutoResponsesManager />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </main>
      </div>
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

export default AdminAnalytics;

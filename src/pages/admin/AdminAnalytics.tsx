import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LayoutDashboard,
  Package,
  FileText,
  Film,
  Headphones,
  ArrowLeft,
  BarChart3,
  Star,
  Users,
  Bot,
  Calendar,
  MessageSquare
} from "lucide-react";
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-background border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="font-display text-xl">Analytics Dashboard</h1>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-background border-r min-h-[calc(100vh-65px)] hidden lg:block">
          <nav className="p-4 space-y-2">
            <Link to="/admin" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors">
              <LayoutDashboard className="h-4 w-4" />
              <span className="text-sm">Dashboard</span>
            </Link>
            <Link to="/admin/products" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors">
              <Package className="h-4 w-4" />
              <span className="text-sm">Products</span>
            </Link>
            <Link to="/admin/orders" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors">
              <FileText className="h-4 w-4" />
              <span className="text-sm">Orders</span>
            </Link>
            <Link to="/admin/reels" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors">
              <Film className="h-4 w-4" />
              <span className="text-sm">Reels</span>
            </Link>
            <Link to="/admin/chat" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors">
              <Headphones className="h-4 w-4" />
              <span className="text-sm">Live Chat</span>
            </Link>
            <Link to="/admin/analytics" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary">
              <BarChart3 className="h-4 w-4" />
              <span className="text-sm">Analytics</span>
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
                    <Tabs defaultValue="dashboard" className="space-y-6">
            <TabsList className="grid w-full max-w-2xl grid-cols-5">
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Chat Stats</span>
              </TabsTrigger>

              <TabsTrigger value="feedback" className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                <span className="hidden sm:inline">Feedback</span>
              </TabsTrigger>
              <TabsTrigger value="agents" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                                <span className="hidden sm:inline">Agents</span>
              </TabsTrigger>
              <TabsTrigger value="scheduling" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Scheduling</span>
              </TabsTrigger>
              <TabsTrigger value="autoresponses" className="flex items-center gap-2">
                <Bot className="h-4 w-4" />
                <span className="hidden sm:inline">Auto-Bot</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard">
              <ChatAnalyticsDashboard />
            </TabsContent>

            <TabsContent value="feedback">
              <FeedbackAnalytics />
            </TabsContent>

            <TabsContent value="agents">
              <AgentPerformanceMetrics />
            </TabsContent>

            <TabsContent value="scheduling">
              <AgentScheduling />
            </TabsContent>
            <TabsContent value="autoresponses">
              <AutoResponsesManager />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default AdminAnalytics;

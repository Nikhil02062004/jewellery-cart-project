import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Package, 
  ShoppingBag, 
  MessageSquare, 
  Users, 
  LogOut, 
  Film, 
  BarChart3, 
  Headphones, 
  CheckCircle, 
  XCircle, 
  UserCheck,
  ChevronRight,
  TrendingUp,
  LayoutDashboard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import React from 'react';

const AdminDashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ products: 0, orders: 0, inquiries: 0, reels: 0 });
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/auth'); return; }

      setUser(session.user);
      
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (!roleData) {
        toast({ title: 'Access Denied', description: "You don't have admin privileges.", variant: 'destructive' });
        navigate('/');
        return;
      }

      setIsAdmin(true);

      // Fetch stats
      const [productsRes, ordersRes, inquiriesRes, reelsRes] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id', { count: 'exact', head: true }),
        supabase.from('contact_inquiries').select('id', { count: 'exact', head: true }),
        supabase.from('reels').select('id', { count: 'exact', head: true }),
      ]);

      setStats({
        products: productsRes.count || 0,
        orders: ordersRes.count || 0,
        inquiries: inquiriesRes.count || 0,
        reels: reelsRes.count || 0,
      });

      // Fetch pending admin requests
      const { data: requests } = await (supabase as any)
        .from('profiles')
        .select('id, email, name, created_at')
        .eq('requested_admin', true)
        .eq('role', 'user')
        .order('created_at', { ascending: false });

      setPendingRequests(requests || []);
      setLoading(false);
    };

    checkAdmin();
  }, [navigate, toast]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const approveAdminRequest = async (userId: string) => {
    const { error } = await (supabase as any)
      .from('profiles')
      .update({ role: 'admin', requested_admin: false })
      .eq('id', userId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setPendingRequests(prev => prev.filter((r: any) => r.id !== userId));
      toast({ title: 'Admin Access Granted', description: 'User is now an admin.' });
    }
  };

  const rejectAdminRequest = async (userId: string) => {
    const { error } = await (supabase as any)
      .from('profiles')
      .update({ requested_admin: false })
      .eq('id', userId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setPendingRequests(prev => prev.filter((r: any) => r.id !== userId));
      toast({ title: 'Request Rejected' });
    }
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
      <header className="bg-white border-b border-slate-200 h-16 px-8 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-charcoal text-gold p-2 rounded-lg">
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <h1 className="font-display text-xl font-bold text-charcoal">Control Center</h1>
        </div>
        <div className="flex items-center gap-6">
          <Link to="/" className="font-body text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-gold transition-colors">
            Visit Boutique
          </Link>
          <div className="h-8 w-px bg-slate-200" />
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-500 hover:text-red-500 hover:bg-red-50 gap-2 font-bold text-xs uppercase tracking-widest">
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-72 bg-white border-r border-slate-200 p-6 hidden lg:block">
          <nav className="space-y-1">
            <SidebarItem to="/admin" icon={<LayoutDashboard />} label="Dashboard" active />
            <SidebarItem to="/admin/products" icon={<Package />} label="Products" />
            <SidebarItem to="/admin/orders" icon={<ShoppingBag />} label="Orders" />
            <SidebarItem to="/admin/inquiries" icon={<MessageSquare />} label="Inquiries" />
            <SidebarItem to="/admin/reels" icon={<Film />} label="Reels" badge={stats.reels} />
            <SidebarItem to="/admin/chat" icon={<Headphones />} label="Live Chat" />
            <SidebarItem to="/admin/analytics" icon={<BarChart3 />} label="Analytics" />
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 md:p-12 overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <p className="font-body text-gold text-[10px] uppercase tracking-[0.4em] font-black mb-2">Management Portal</p>
                <h2 className="font-display text-4xl font-bold text-charcoal leading-tight">Welcome, {user?.user_metadata?.name || 'Director'}</h2>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <StatCard icon={<Package className="text-blue-500" />} label="Total Products" value={stats.products} color="bg-blue-500/10" />
              <StatCard icon={<ShoppingBag className="text-emerald-500" />} label="Total Orders" value={stats.orders} color="bg-emerald-500/10" />
              <StatCard icon={<MessageSquare className="text-indigo-500" />} label="Contact Inquiries" value={stats.inquiries} color="bg-indigo-500/10" />
            </div>

            {/* Pending Admin Requests */}
            {pendingRequests.length > 0 && (
              <div className="bg-white border border-amber-200 rounded-3xl p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-charcoal">
                    Pending Administrator Applications ({pendingRequests.length})
                  </h3>
                </div>
                <div className="grid gap-4">
                  {pendingRequests.map(req => (
                    <div key={req.id} className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-2xl p-6 group hover:border-amber-200 transition-all">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center text-charcoal font-display text-lg shadow-sm">
                            {req.name?.[0] || 'U'}
                         </div>
                         <div>
                            <p className="font-bold text-charcoal">{req.name || 'Anonymous'}</p>
                            <p className="text-xs text-slate-500 lowercase">{req.email} • Requested {new Date(req.created_at).toLocaleDateString()}</p>
                         </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 rounded-xl px-6"
                          onClick={() => approveAdminRequest(req.id)}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:bg-red-50 rounded-xl px-6"
                          onClick={() => rejectAdminRequest(req.id)}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-8">
              <NavCard 
                to="/admin/orders" 
                title="Manage Orders" 
                description="Monitor fulfillment status and track global logistics." 
                icon={<ShoppingBag className="text-gold" />}
              />
              <NavCard 
                to="/admin/products" 
                title="Manage Inventory" 
                description="Curate collections, update stock, and refine pricing." 
                icon={<Package className="text-gold" />}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

const SidebarItem = ({ to, icon, label, active = false, badge }: { to: string, icon: any, label: string, active?: boolean, badge?: number }) => (
  <Link
    to={to}
    className={cn(
      "flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-body text-sm font-medium",
      active 
        ? "bg-gold/10 text-gold shadow-sm" 
        : "text-slate-500 hover:bg-slate-50 hover:text-charcoal"
    )}
  >
    {React.cloneElement(icon as React.ReactElement, { className: "w-4 h-4" })}
    <span className="flex-1">{label}</span>
    {badge !== undefined && badge > 0 && (
      <span className="bg-gold text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
        {badge}
      </span>
    )}
  </Link>
);

const StatCard = ({ icon, label, value, color }: { icon: any, label: string, value: number, color: string }) => (
  <div className="bg-white border border-slate-100 p-8 rounded-[2rem] shadow-sm hover:shadow-md transition-all group">
    <div className="flex items-center justify-between mb-6">
      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500 shadow-sm", color)}>
        {React.cloneElement(icon as React.ReactElement, { className: "w-6 h-6" })}
      </div>
      <div className="flex items-center gap-1 text-emerald-500 text-xs font-bold">
         <TrendingUp className="w-3 h-3" /> Still Growing
      </div>
    </div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
    <p className="font-display text-4xl font-black text-charcoal tabular-nums">{value}</p>
  </div>
);

const NavCard = ({ to, title, description, icon }: { to: string, title: string, description: string, icon: any }) => (
  <Link to={to} className="group">
    <div className="bg-white border border-slate-100 rounded-[2rem] p-10 shadow-sm hover:shadow-xl hover:border-gold/30 hover:-translate-y-1 transition-all flex items-center justify-between">
      <div className="flex items-center gap-8">
        <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-gold/10 transition-colors">
          {React.cloneElement(icon as React.ReactElement, { className: "w-7 h-7" })}
        </div>
        <div className="space-y-1">
          <h3 className="font-display text-2xl font-bold text-charcoal group-hover:text-gold transition-colors">{title}</h3>
          <p className="text-sm text-slate-400 font-body leading-relaxed">{description}</p>
        </div>
      </div>
      <ChevronRight className="w-6 h-6 text-slate-200 group-hover:text-gold group-hover:translate-x-1 transition-all" />
    </div>
  </Link>
);

export default AdminDashboard;

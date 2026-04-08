import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, ShoppingBag, MessageSquare, Users, LogOut, Film, BarChart3, Headphones, CheckCircle, XCircle, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

      // ✅ Check role from profiles table (cast needed until supabase types are regenerated)
      const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      const hasAdminRole = profile?.role === 'admin';
      setIsAdmin(hasAdminRole || false);

      if (!hasAdminRole) {
        toast({ title: 'Access Denied', description: "You don't have admin privileges.", variant: 'destructive' });
        navigate('/');
        return;
      }

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="font-body text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-charcoal text-primary-foreground py-4 px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="font-display text-2xl">Admin Dashboard</h1>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/" className="font-body text-sm hover:text-gold transition-colors">
            View Store
          </Link>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-[calc(100vh-64px)] bg-card border-r border-border p-6">
          <nav className="space-y-2">
            <Link
              to="/admin"
              className="flex items-center gap-3 px-4 py-3 rounded-sm bg-gold/10 text-gold font-body text-sm"
            >
              <Users className="w-4 h-4" />
              Dashboard
            </Link>
            <Link
              to="/admin/products"
              className="flex items-center gap-3 px-4 py-3 rounded-sm text-muted-foreground hover:bg-muted font-body text-sm transition-colors"
            >
              <Package className="w-4 h-4" />
              Products
            </Link>
            <Link
              to="/admin/orders"
              className="flex items-center gap-3 px-4 py-3 rounded-sm text-muted-foreground hover:bg-muted font-body text-sm transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              Orders
            </Link>
            <Link
              to="/admin/inquiries"
              className="flex items-center gap-3 px-4 py-3 rounded-sm text-muted-foreground hover:bg-muted font-body text-sm transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              Inquiries
            </Link>
            <Link
              to="/admin/reels"
              className="flex items-center gap-3 px-4 py-3 rounded-sm text-muted-foreground hover:bg-muted font-body text-sm transition-colors"
            >
              <Film className="w-4 h-4" />
              Reels
              {stats.reels > 0 && (
                <span className="ml-auto bg-gold text-charcoal text-xs px-2 py-0.5 rounded-full">
                  {stats.reels}
                </span>
              )}
            </Link>
            <Link
              to="/admin/chat"
              className="flex items-center gap-3 px-4 py-3 rounded-sm text-muted-foreground hover:bg-muted font-body text-sm transition-colors"
            >
              <Headphones className="w-4 h-4" />
              Live Chat
            </Link>
            <Link
              to="/admin/analytics"
              className="flex items-center gap-3 px-4 py-3 rounded-sm text-muted-foreground hover:bg-muted font-body text-sm transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
              Analytics
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <h2 className="font-display text-3xl mb-8">Welcome, {user?.user_metadata?.name || 'Admin'}</h2>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <Package className="w-10 h-10 text-gold" />
                <span className="font-display text-4xl">{stats.products}</span>
              </div>
              <p className="font-body text-muted-foreground">Total Products</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <ShoppingBag className="w-10 h-10 text-gold" />
                <span className="font-display text-4xl">{stats.orders}</span>
              </div>
              <p className="font-body text-muted-foreground">Total Orders</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <MessageSquare className="w-10 h-10 text-gold" />
                <span className="font-display text-4xl">{stats.inquiries}</span>
              </div>
              <p className="font-body text-muted-foreground">Contact Inquiries</p>
            </div>
          </div>

          {/* Pending Admin Requests */}
          {pendingRequests.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-8">
              <div className="flex items-center gap-2 mb-4">
                <UserCheck className="w-5 h-5 text-amber-600" />
                <h3 className="font-display text-lg text-amber-800">
                  Pending Admin Requests ({pendingRequests.length})
                </h3>
              </div>
              <div className="space-y-3">
                {pendingRequests.map(req => (
                  <div key={req.id} className="flex items-center justify-between bg-white border border-amber-100 rounded-lg p-4">
                    <div>
                      <p className="font-medium text-sm">{req.name || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground">{req.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Requested {new Date(req.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 gap-1"
                        onClick={() => approveAdminRequest(req.id)}
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-300 text-red-600 hover:bg-red-50 gap-1"
                        onClick={() => rejectAdminRequest(req.id)}
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <Link to="/admin/orders" className="block">
              <div className="bg-card border border-border rounded-lg p-6 hover:border-gold transition-colors">
                <h3 className="font-display text-xl mb-2">Manage Orders</h3>
                <p className="font-body text-muted-foreground">View and update order statuses</p>
              </div>
            </Link>
            <Link to="/admin/products" className="block">
              <div className="bg-card border border-border rounded-lg p-6 hover:border-gold transition-colors">
                <h3 className="font-display text-xl mb-2">Manage Products</h3>
                <p className="font-body text-muted-foreground">Add, edit, or remove products</p>
              </div>
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;

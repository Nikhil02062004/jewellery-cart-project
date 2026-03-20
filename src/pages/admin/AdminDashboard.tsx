import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, ShoppingBag, MessageSquare, Users, LogOut, Film, BarChart3, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const AdminDashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ products: 0, orders: 0, inquiries: 0, reels: 0 });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
      
      setUser(session.user);
      
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id);
      
      const hasAdminRole = roles?.some(r => r.role === 'admin');
      setIsAdmin(hasAdminRole || false);
      
      if (!hasAdminRole) {
        toast({ title: "Access Denied", description: "You don't have admin privileges.", variant: "destructive" });
        navigate('/');
        return;
      }

      // Fetch stats
      const [productsRes, ordersRes, inquiriesRes, reelsRes] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id', { count: 'exact', head: true }),
        supabase.from('contact_inquiries').select('id', { count: 'exact', head: true }),
        supabase.from('reels').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      ]);

      setStats({
        products: productsRes.count || 0,
        orders: ordersRes.count || 0,
        inquiries: inquiriesRes.count || 0,
        reels: reelsRes.count || 0,
      });
      
      setLoading(false);
    };

    checkAdmin();
  }, [navigate, toast]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
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

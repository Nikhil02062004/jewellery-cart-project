import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Package, Heart, LogOut, Shield, Eye, RefreshCw, Download, Loader2, Clock, CheckCircle } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useWishlist } from '@/contexts/WishlistContext';
import OrderStatusTracker from '@/components/orders/OrderStatusTracker';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface Order {
  id: string;
  items: OrderItem[];
  total_amount: number;
  status: string;
  created_at: string;
  updated_at: string;
}

const AccountPage = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders'>('dashboard');
  const [isAdmin, setIsAdmin] = useState(false);
  const [requestedAdmin, setRequestedAdmin] = useState(false);
  const [requestingAdmin, setRequestingAdmin] = useState(false);
  const [downloadingInvoice, setDownloadingInvoice] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { items: wishlistItems } = useWishlist();

  // Remove the old hardcoded checkUser block — handled by checkAdmin now

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        fetchOrders(session.user.id);
        checkAdmin(session.user.id);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        fetchOrders(session.user.id);
        checkAdmin(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Real-time subscription for order updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('order-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Order updated:', payload);
          const updatedOrder = payload.new as Order;
          
          // Update orders list
          setOrders(prev => prev.map(order => 
            order.id === updatedOrder.id 
              ? { ...order, ...updatedOrder, items: updatedOrder.items as unknown as OrderItem[] }
              : order
          ));
          
          // Update selected order if viewing
          if (selectedOrder?.id === updatedOrder.id) {
            setSelectedOrder(prev => prev ? { 
              ...prev, 
              ...updatedOrder, 
              items: updatedOrder.items as unknown as OrderItem[] 
            } : null);
          }
          
          toast({
            title: "Order Updated",
            description: `Order #${updatedOrder.id.slice(0, 8)} status changed to ${updatedOrder.status}`,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedOrder, toast]);

  const fetchOrders = async (userId: string) => {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (data) {
      setOrders(data.map(order => ({
        ...order,
        items: order.items as unknown as OrderItem[]
      })));
    }
  };

  const checkAdmin = async (userId: string) => {
    try {
      const { data: profile, error } = await (supabase as any)
        .from('profiles')
        .select('role, requested_admin')
        .eq('id', userId)
        .single();
      // Silently ignore if profiles table / columns not yet created in DB
      if (error) { console.warn('Profiles not ready:', error.message); return; }
      setIsAdmin(profile?.role === 'admin');
      setRequestedAdmin(profile?.requested_admin ?? false);
    } catch (err) {
      console.warn('checkAdmin failed silently:', err);
    }
  };

  const handleRequestAdmin = async () => {
    if (!user) return;
    setRequestingAdmin(true);
    try {
      const { error } = await (supabase as any)
        .from('profiles')
        .update({ requested_admin: true })
        .eq('id', user.id);
      if (error) throw error;
      setRequestedAdmin(true);
      toast({ title: 'Request Sent!', description: 'Your admin access request has been submitted. The admin will review it shortly.' });
    } catch (err: any) {
      // Show helpful message if DB not set up
      const msg = err.message || '';
      if (msg.includes('schema cache') || msg.includes('does not exist')) {
        toast({ title: 'Setup Required', description: 'Please ask the site admin to run the database migration first.', variant: 'destructive' });
      } else {
        toast({ title: 'Error', description: msg, variant: 'destructive' });
      }
    } finally {
      setRequestingAdmin(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: "Logged out", description: "You've been successfully logged out." });
    navigate('/');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'paid': return 'bg-emerald-100 text-emerald-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDownloadInvoice = async (order: Order) => {
    setDownloadingInvoice(order.id);
    try {
      const { data, error } = await supabase.functions.invoke('generate-invoice', {
        body: { orderId: order.id }
      });
      
      if (error) throw error;
      
      // Convert base64 to blob and download
      const byteCharacters = atob(data.pdf);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${order.id.slice(0, 8)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({ title: "Success", description: "Invoice downloaded successfully" });
    } catch (error: any) {
      console.error('Invoice download error:', error);
      toast({ 
        title: "Error", 
        description: "Failed to download invoice", 
        variant: "destructive" 
      });
    } finally {
      setDownloadingInvoice(null);
    }
  };

  if (loading) {
    return (
      <Layout>
        <section className="py-20">
          <div className="container mx-auto px-4 text-center">
            <p className="font-body text-muted-foreground">Loading...</p>
          </div>
        </section>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-lg mx-auto text-center">
              <User className="w-20 h-20 text-muted-foreground/30 mx-auto mb-6" />
              <h1 className="font-display text-3xl mb-4">Please Login</h1>
              <p className="font-body text-muted-foreground mb-8">
                You need to be logged in to view your account.
              </p>
              <Button asChild size="lg">
                <Link to="/auth">Login / Register</Link>
              </Button>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Hero */}
      <section className="relative h-[25vh] flex items-center justify-center bg-charcoal">
        <div className="relative z-10 text-center">
          <p className="font-body text-gold tracking-[0.3em] uppercase text-sm mb-4">Welcome Back</p>
          <h1 className="font-display text-5xl md:text-6xl text-primary-foreground">My Account</h1>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="md:col-span-1">
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
                  <div className="w-14 h-14 bg-gold/10 rounded-full flex items-center justify-center">
                    <User className="w-7 h-7 text-gold" />
                  </div>
                  <div>
                    <p className="font-display text-lg">{user.user_metadata?.name || 'User'}</p>
                    <p className="font-body text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>

                <nav className="space-y-2">
                  <button 
                    onClick={() => setActiveTab('dashboard')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-sm font-body text-sm transition-colors ${activeTab === 'dashboard' ? 'bg-gold/10 text-gold' : 'text-muted-foreground hover:bg-muted'}`}
                  >
                    <User className="w-4 h-4" />
                    Dashboard
                  </button>
                  <button 
                    onClick={() => setActiveTab('orders')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-sm font-body text-sm transition-colors ${activeTab === 'orders' ? 'bg-gold/10 text-gold' : 'text-muted-foreground hover:bg-muted'}`}
                  >
                    <Package className="w-4 h-4" />
                    My Orders
                    {orders.filter(o => o.status === 'shipped').length > 0 && (
                      <span className="ml-auto bg-gold text-charcoal text-xs px-1.5 py-0.5 rounded-full">
                        {orders.filter(o => o.status === 'shipped').length}
                      </span>
                    )}
                  </button>
                  <Link to="/wishlist" className="flex items-center gap-3 px-4 py-3 rounded-sm text-muted-foreground hover:bg-muted font-body text-sm transition-colors">
                    <Heart className="w-4 h-4" />
                    Wishlist
                  </Link>
                  {isAdmin ? (
                    <Link to="/admin" className="flex items-center gap-3 px-4 py-3 rounded-sm text-gold hover:bg-gold/10 font-body text-sm transition-colors">
                      <Shield className="w-4 h-4" />
                      Admin Dashboard
                    </Link>
                  ) : requestedAdmin ? (
                    <div className="flex items-center gap-3 px-4 py-3 rounded-sm text-muted-foreground font-body text-sm">
                      <Clock className="w-4 h-4 text-amber-500" />
                      <span>Admin Request Pending</span>
                    </div>
                  ) : (
                    <button
                      onClick={handleRequestAdmin}
                      disabled={requestingAdmin}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-sm text-muted-foreground hover:bg-muted font-body text-sm transition-colors disabled:opacity-50"
                    >
                      <Shield className="w-4 h-4" />
                      {requestingAdmin ? 'Sending...' : 'Request Admin Access'}
                    </button>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-sm text-destructive hover:bg-destructive/10 font-body text-sm transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </nav>
              </div>
            </div>

            {/* Content */}
            <div className="md:col-span-3">
              {activeTab === 'dashboard' && (
                <div className="bg-card border border-border rounded-lg p-6">
                  <h2 className="font-display text-2xl mb-6">Dashboard</h2>
                  
                  <div className="grid sm:grid-cols-3 gap-6 mb-8">
                    <div className="bg-background border border-border rounded-lg p-6 text-center">
                      <Package className="w-10 h-10 text-gold mx-auto mb-3" />
                      <p className="font-display text-2xl mb-1">{orders.length}</p>
                      <p className="font-body text-sm text-muted-foreground">Orders</p>
                    </div>
                    <div className="bg-background border border-border rounded-lg p-6 text-center">
                      <Heart className="w-10 h-10 text-gold mx-auto mb-3" />
                      <p className="font-display text-2xl mb-1">{wishlistItems.length}</p>
                      <p className="font-body text-sm text-muted-foreground">Wishlist Items</p>
                    </div>
                    <div className="bg-background border border-border rounded-lg p-6 text-center">
                      <User className="w-10 h-10 text-gold mx-auto mb-3" />
                      <p className="font-display text-2xl mb-1">Active</p>
                      <p className="font-body text-sm text-muted-foreground">Account Status</p>
                    </div>
                  </div>

                  {/* Active Orders */}
                  {orders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length > 0 && (
                    <div className="mb-8">
                      <h3 className="font-display text-lg mb-4">Active Orders</h3>
                      <div className="space-y-4">
                        {orders.filter(o => !['delivered', 'cancelled'].includes(o.status)).map((order) => (
                          <div key={order.id} className="bg-background border border-border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <p className="font-body text-sm text-muted-foreground">Order #{order.id.slice(0, 8)}</p>
                                <p className="font-body text-gold">₹{order.total_amount.toLocaleString()}</p>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-body capitalize ${getStatusColor(order.status)}`}>
                                {order.status}
                              </span>
                            </div>
                            <OrderStatusTracker status={order.status} updatedAt={order.updated_at} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-gold/10 border border-gold/30 rounded-lg p-6">
                    <h3 className="font-display text-lg mb-2">Start Shopping!</h3>
                    <p className="font-body text-muted-foreground mb-4">
                      Browse our collections and find your perfect jewelry piece.
                    </p>
                    <Button asChild>
                      <Link to="/silver">Shop Now</Link>
                    </Button>
                  </div>
                </div>
              )}

              {activeTab === 'orders' && (
                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="font-display text-2xl">My Orders</h2>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => user && fetchOrders(user.id)}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                  
                  {orders.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                      <p className="font-body text-muted-foreground mb-4">You haven't placed any orders yet.</p>
                      <Button asChild>
                        <Link to="/silver">Start Shopping</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div key={order.id} className="border border-border rounded-lg p-4">
                          <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                              <p className="font-body text-sm text-muted-foreground">Order ID</p>
                              <p className="font-mono text-sm">{order.id.slice(0, 8)}</p>
                            </div>
                            <div>
                              <p className="font-body text-sm text-muted-foreground">Date</p>
                              <p className="font-body text-sm">{new Date(order.created_at).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <p className="font-body text-sm text-muted-foreground">Total</p>
                              <p className="font-body text-sm text-gold">₹{order.total_amount.toLocaleString()}</p>
                            </div>
                            <div>
                              <span className={`px-3 py-1 rounded-full text-xs font-body capitalize ${getStatusColor(order.status)}`}>
                                {order.status}
                              </span>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>
                              <Eye className="w-4 h-4" />
                              View
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Status Tracker */}
              <OrderStatusTracker 
                status={selectedOrder.status} 
                updatedAt={selectedOrder.updated_at}
              />

              <div className="grid grid-cols-2 gap-4 text-sm font-body">
                <div>
                  <p className="text-muted-foreground">Order ID</p>
                  <p className="font-mono">{selectedOrder.id.slice(0, 8)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p>{new Date(selectedOrder.created_at).toLocaleString()}</p>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <p className="font-body text-sm font-medium mb-3">Items</p>
                <div className="space-y-3">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded" />
                      <div className="flex-1">
                        <p className="font-body text-sm">{item.name}</p>
                        <p className="font-body text-xs text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-body text-sm">₹{(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-border pt-4 flex justify-between items-center">
                <div>
                  <span className="font-display text-lg">Total</span>
                  <span className="font-display text-lg text-gold ml-2">₹{selectedOrder.total_amount.toLocaleString()}</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleDownloadInvoice(selectedOrder)}
                  disabled={downloadingInvoice === selectedOrder.id}
                >
                  {downloadingInvoice === selectedOrder.id ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  Invoice
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default AccountPage;

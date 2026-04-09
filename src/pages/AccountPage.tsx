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
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

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

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchOrders(session.user.id);
        checkAdmin(session.user.id);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchOrders(session.user.id);
        checkAdmin(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

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
          const updatedOrder = payload.new as Order;
          setOrders(prev => prev.map(order => 
            order.id === updatedOrder.id 
              ? { ...order, ...updatedOrder, items: updatedOrder.items as unknown as OrderItem[] }
              : order
          ));
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
    return () => { supabase.removeChannel(channel); };
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
      if (error) return;
      setIsAdmin(profile?.role === 'admin');
      setRequestedAdmin(profile?.requested_admin ?? false);
    } catch (err) {
      console.warn('checkAdmin failed:', err);
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
      toast({ title: 'Request Sent!', description: 'Your admin access request has been submitted.' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setRequestingAdmin(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: "Logged out" });
    navigate('/');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20';
      case 'processing': return 'bg-blue-500/10 text-blue-500 border border-blue-500/20';
      case 'shipped': return 'bg-purple-500/10 text-purple-500 border border-purple-500/20';
      case 'delivered': return 'bg-green-500/10 text-green-500 border border-green-500/20';
      case 'cancelled': return 'bg-red-500/10 text-red-500 border border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border border-gray-500/20';
    }
  };

  const handleDownloadInvoice = async (order: Order) => {
    setDownloadingInvoice(order.id);
    try {
      const { data, error } = await supabase.functions.invoke('generate-invoice', {
        body: { orderId: order.id }
      });
      if (error) throw error;
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
      toast({ title: "Success", description: "Invoice downloaded" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to download invoice", variant: "destructive" });
    } finally {
      setDownloadingInvoice(null);
    }
  };

  const dashboardStats = [
    { title: 'Orders', value: orders.length, icon: Package, link: () => setActiveTab('orders') },
    { title: 'Wishlist', value: wishlistItems.length, icon: Heart, link: () => navigate('/wishlist') },
    { title: 'Account Status', value: 'Active', icon: Shield, link: () => {} },
  ];

  if (loading) {
    return (
      <Layout>
        <div className="h-[70dvh] flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-gold" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="min-h-[70dvh] flex flex-col items-center justify-center px-6 text-center">
          <div className="w-20 h-20 rounded-full bg-gold/10 flex items-center justify-center mb-6">
            <User className="w-10 h-10 text-gold" />
          </div>
          <h1 className="font-display text-4xl mb-4">Your Account</h1>
          <p className="font-body text-muted-foreground mb-8 max-w-sm">Sign in to track your orders and manage your profile.</p>
          <Button asChild size="lg" className="luxury-button px-12 h-14">
            <Link to="/auth">Sign In / Join Now</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50/50 pb-20">
        <section className="bg-charcoal text-white pt-12 pb-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gold/5 opacity-50" />
          <div className="container mx-auto px-6 relative z-10">
            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
              <div className="w-24 h-24 rounded-full border-4 border-gold/20 p-1 relative">
                <div className="w-full h-full rounded-full bg-gradient-gold flex items-center justify-center">
                  <span className="text-charcoal text-3xl font-bold uppercase">{user.email?.[0]}</span>
                </div>
              </div>
              <div className="text-center md:text-left">
                <p className="font-body text-gold/60 text-[10px] tracking-[0.3em] uppercase mb-1">Legacy Member</p>
                <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
                  Welcome back, <span className="text-gold italic">{user.email?.split('@')[0]}</span>
                </h1>
                <p className="text-white/40 text-sm font-body">{user.email}</p>
              </div>
              <div className="md:ml-auto">
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 bg-transparent h-12 rounded-xl" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" /> Sign Out
                </Button>
              </div>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-6 -mt-12 relative z-20">
          <div className="flex bg-white/80 backdrop-blur-md rounded-2xl p-1.5 shadow-soft border border-gray-200/50 mb-8 max-w-md mx-auto md:mx-0">
            {(['dashboard', 'orders'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "flex-1 py-3 px-4 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all duration-300",
                  activeTab === tab ? "bg-charcoal text-white shadow-lg" : "text-muted-foreground hover:text-charcoal"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">
              {activeTab === 'dashboard' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {dashboardStats.map((stat) => (
                      <button key={stat.title} onClick={stat.link} className="bg-white border border-gray-100 p-6 rounded-2xl shadow-soft hover:shadow-xl hover:-translate-y-1 transition-all text-left group">
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-12 h-12 rounded-2xl bg-gold/10 flex items-center justify-center text-gold group-hover:bg-gold group-hover:text-charcoal transition-colors">
                            <stat.icon className="w-6 h-6" />
                          </div>
                        </div>
                        <p className="text-muted-foreground text-[10px] font-body tracking-[0.2em] uppercase">{stat.title}</p>
                        <p className="font-display text-2xl font-bold mt-1">{stat.value}</p>
                      </button>
                    ))}
                  </div>

                  <div className="bg-white rounded-3xl p-8 shadow-soft border border-gray-100 overflow-hidden relative">
                    <h3 className="font-display text-xl font-bold mb-6">Live Asset Tracking</h3>
                    {orders.filter(o => ['processing', 'shipped'].includes(o.status)).length > 0 ? (
                      <div className="space-y-6">
                        {orders.filter(o => ['processing', 'shipped'].includes(o.status)).map((order) => (
                          <div key={order.id} className="bg-gray-50/50 border border-gray-100 rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-6">
                              <div>
                                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Order Ref</p>
                                <p className="font-mono text-xs text-charcoal font-bold tracking-tighter">#{order.id.slice(0, 10)}</p>
                              </div>
                              <span className={cn("px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest", getStatusColor(order.status))}>
                                {order.status}
                              </span>
                            </div>
                            <OrderStatusTracker status={order.status} updatedAt={order.updated_at} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10 px-4 flex flex-col items-center">
                        <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                          <Package className="w-8 h-8 text-gray-300" />
                        </div>
                        <p className="text-muted-foreground text-sm font-body">No pending shipments at the moment.</p>
                      </div>
                    )}
                  </div>

                  <div className="bg-charcoal rounded-3xl p-8 md:p-12 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gold/5 opacity-50" />
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
                      <div className="max-w-md">
                        <p className="text-gold font-body text-[10px] tracking-[0.4em] uppercase mb-4">Exclusive Access</p>
                        <h3 className="text-white font-display text-3xl font-bold mb-6">Handcrafted Excellence</h3>
                        <Button asChild variant="gold" className="luxury-button px-12 h-12">
                          <Link to="/silver">Browse Collections</Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'orders' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-4 px-2">
                    <h2 className="font-display text-2xl font-bold">Purchase History</h2>
                    <button onClick={() => user && fetchOrders(user.id)} className="text-gold flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em]">
                      <RefreshCw className="w-3.5 h-3.5" /> Refresh
                    </button>
                  </div>
                  {orders.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-dashed border-gray-200 py-24 text-center">
                      <p className="text-muted-foreground font-body mb-8">History is currently empty.</p>
                      <Button asChild size="lg" variant="gold"><Link to="/silver">Explore Store</Link></Button>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {orders.map((order) => (
                        <div key={order.id} className="bg-white border border-gray-100 rounded-2xl p-6 transition-all hover:shadow-lg">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-charcoal/5 flex items-center justify-center text-charcoal"><Package className="w-5 h-5" /></div>
                              <div>
                                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Ref No.</p>
                                <p className="font-mono text-sm font-bold tracking-tighter">#{order.id.slice(0, 10)}</p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <span className={cn("px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest", getStatusColor(order.status))}>{order.status}</span>
                              <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-xl hover:bg-gold/10 hover:text-gold" onClick={() => setSelectedOrder(order)}><Eye className="w-5 h-5" /></Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="lg:col-span-4 space-y-8">
              <div className="bg-white rounded-3xl p-8 shadow-soft border border-gray-100">
                <h3 className="font-display text-lg font-bold mb-6 flex items-center gap-3"><Shield className="w-5 h-5 text-gold" /> Profile Integrity</h3>
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <p className="text-[11px] font-bold text-charcoal">Secure Identity Verified</p>
                  </div>
                  {isAdmin ? (
                    <div className="p-5 rounded-2xl bg-gold/5 border border-gold/20">
                      <h4 className="text-[10px] font-black text-charcoal uppercase tracking-[0.2em] mb-3">Admin Console</h4>
                      <Button asChild variant="gold" className="w-full h-10 rounded-xl luxury-button text-[10px] font-bold uppercase"><Link to="/admin">Access Vault</Link></Button>
                    </div>
                  ) : (
                    <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100">
                      <p className="text-[11px] text-muted-foreground mb-4">Register as an official merchant partner.</p>
                      <Button variant="outline" size="sm" className="w-full h-10 text-[10px] font-bold uppercase rounded-xl" onClick={handleRequestAdmin} disabled={requestingAdmin || requestedAdmin}>
                        {requestedAdmin ? 'Request Pending' : 'Merchant Registration'}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={selectedOrder !== null} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-3xl glass-card border-white/20 p-0 overflow-hidden">
          {selectedOrder && (
            <div className="bg-white">
              <div className="bg-charcoal p-8 text-white relative flex flex-col md:flex-row justify-between items-end gap-6 overflow-hidden">
                 <div className="absolute inset-0 bg-gold/5" />
                 <div className="relative z-10">
                    <p className="text-gold font-body text-[10px] tracking-[0.4em] uppercase mb-4">Transaction Details</p>
                    <h1 className="font-display text-3xl font-bold tracking-tight">Purchase Archive</h1>
                 </div>
                 <div className="relative z-10 flex flex-col items-end gap-2">
                    <span className={cn("px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest", getStatusColor(selectedOrder.status))}>{selectedOrder.status}</span>
                    <p className="text-2xl font-display font-bold text-gold mt-1">₹{selectedOrder.total_amount.toLocaleString()}</p>
                 </div>
              </div>
              <div className="p-8">
                <div className="grid md:grid-cols-2 gap-8 mb-10 pb-10 border-b border-gray-100">
                  <div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Asset Reference</p>
                    <p className="font-mono text-xs font-bold bg-gray-50 p-3 rounded-lg border border-gray-100">#{selectedOrder.id}</p>
                  </div>
                  <div className="flex md:justify-end items-end">
                    <Button className="w-full md:w-auto luxury-button px-8 h-12 rounded-xl" onClick={() => handleDownloadInvoice(selectedOrder)} disabled={downloadingInvoice === selectedOrder.id}>
                      {downloadingInvoice === selectedOrder.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />} Get Invoice
                    </Button>
                  </div>
                </div>
                <div className="space-y-6">
                  <h3 className="text-[10px] font-black tracking-[0.3em] uppercase mb-6">Secured Assets</h3>
                  <div className="max-h-[300px] overflow-y-auto pr-4 space-y-4 scrollbar-hide">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex gap-6 p-4 rounded-2xl bg-gray-50/50">
                        <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-xl shadow-sm border border-white" />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-charcoal truncate">{item.name}</p>
                          <p className="text-[11px] text-muted-foreground">Quantity: {item.quantity}</p>
                          <p className="text-gold font-bold text-sm mt-1">₹{item.price.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default AccountPage;

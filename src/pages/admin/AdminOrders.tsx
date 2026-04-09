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
  XCircle,
  Clock,
  CheckCircle2,
  Truck,
  Eye,
  ChevronLeft,
  LayoutDashboard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  status: string;
  created_at: string;
  customer_address: string | null;
  customer_name: string;
  customer_email: string;
  payment_status: string;
}

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();

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
      fetchOrders();
    };

    checkAdmin();
  }, [navigate]);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: `Order status updated to ${status}` });
      fetchOrders();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'processing': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'shipped': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'delivered': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'cancelled': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-slate-100 text-slate-500 border-slate-200';
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
          <Link to="/admin" className="text-slate-400 hover:text-charcoal transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="h-6 w-px bg-slate-200" />
          <h1 className="font-display text-xl font-bold text-charcoal">Global Commission Hub</h1>
        </div>
        <div className="flex items-center gap-4">
           <div className="bg-slate-50 px-4 py-1.5 rounded-full border border-slate-100 text-[10px] uppercase font-black tracking-widest text-slate-400">
             Authenticated Executive Review
           </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 bg-white border-r border-slate-200 p-6 hidden lg:flex flex-col">
          <nav className="space-y-1 flex-1">
            <SidebarItem to="/admin" icon={<LayoutDashboard />} label="Dashboard" />
            <SidebarItem to="/admin/products" icon={<Package />} label="Products" />
            <SidebarItem to="/admin/orders" icon={<ShoppingBag />} label="Orders" active />
            <SidebarItem to="/admin/inquiries" icon={<MessageSquare />} label="Inquiries" />
            <SidebarItem to="/admin/reels" icon={<Film />} label="Reels" />
            <SidebarItem to="/admin/chat" icon={<Headphones />} label="Live Chat" />
            <SidebarItem to="/admin/analytics" icon={<BarChart3 />} label="Analytics" />
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 md:p-12 overflow-y-auto bg-slate-50">
          <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
            
            <div className="flex items-center justify-between mb-8">
               <h2 className="font-display text-3xl font-bold text-charcoal">Recent Transactions</h2>
               <div className="flex gap-4">
                  <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-6">
                     <div className="text-center">
                        <p className="text-[8px] uppercase font-bold text-slate-400 mb-0.5 tracking-widest">Active Orders</p>
                        <p className="font-display text-lg font-bold text-gold">{orders.filter(o => o.status !== 'delivered').length}</p>
                     </div>
                     <div className="w-px h-8 bg-slate-100" />
                     <div className="text-center">
                        <p className="text-[8px] uppercase font-bold text-slate-400 mb-0.5 tracking-widest">Completed</p>
                        <p className="font-display text-lg font-bold text-charcoal">{orders.filter(o => o.status === 'delivered').length}</p>
                     </div>
                  </div>
               </div>
            </div>

            {/* Orders Feed */}
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row items-center gap-8 group">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-gold/10 group-hover:text-gold transition-colors">
                     <ShoppingBag className="w-6 h-6" />
                  </div>

                  <div className="flex-1 grid md:grid-cols-4 gap-8 w-full">
                    <div className="space-y-1">
                      <p className="text-[8px] uppercase tracking-widest font-black text-slate-400">Order Token</p>
                      <p className="font-mono text-xs font-bold text-charcoal truncate">#{order.id.slice(0, 12)}...</p>
                      <p className="text-[10px] text-slate-400 font-medium">{new Date(order.created_at).toLocaleDateString()}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[8px] uppercase tracking-widest font-black text-slate-400">Consignee</p>
                      <p className="font-bold text-charcoal truncate">{order.customer_name || 'Anonymous'}</p>
                      <p className="text-[10px] text-slate-400 truncate lowercase">{order.customer_email}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[8px] uppercase tracking-widest font-black text-slate-400">Value</p>
                      <p className="font-display text-xl font-bold text-charcoal">${order.total_amount.toLocaleString()}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[8px] uppercase tracking-widest font-black text-slate-400">Logistics State</p>
                      <div className={cn("inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest", getStatusColor(order.status))}>
                         <div className={cn("w-1 h-1 rounded-full", order.status === 'delivered' ? 'bg-emerald-500' : 'bg-current')} />
                         {order.status}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full lg:w-auto pt-6 lg:pt-0 border-t lg:border-t-0 border-slate-50">
                    <Select value={order.status} onValueChange={(val) => updateOrderStatus(order.id, val)}>
                      <SelectTrigger className="w-full lg:w-40 h-11 bg-slate-50 border-slate-100 rounded-xl text-[10px] font-bold uppercase tracking-widest text-charcoal">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Reviewing</SelectItem>
                        <SelectItem value="processing">Production</SelectItem>
                        <SelectItem value="shipped">In Transit</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Annulled</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl bg-slate-50 text-slate-400 hover:text-gold hover:bg-gold/10 flex-shrink-0" onClick={() => { setSelectedOrder(order); setDialogOpen(true); }}>
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {orders.length === 0 && (
                <div className="bg-white rounded-[3rem] p-24 text-center border border-dashed border-slate-200">
                  <ShoppingBag className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-400 font-body text-sm italic">No commission history recorded in the ledger.</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl bg-white rounded-[2.5rem] p-10 shadow-2xl overflow-hidden border-none text-charcoal">
          <DialogHeader className="mb-8">
            <DialogTitle className="font-display text-3xl font-bold italic tracking-tight">Order Specifications</DialogTitle>
            <p className="text-[10px] uppercase tracking-widest font-black text-slate-400 mt-2">Dossier #{selectedOrder?.id}</p>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-10">
              <div className="grid grid-cols-2 gap-x-12 gap-y-8">
                 <SpecificationBox label="Client Full Name" value={selectedOrder.customer_name || 'Anonymous'} />
                 <SpecificationBox label="Digital Contact" value={selectedOrder.customer_email || 'N/A'} />
                 <SpecificationBox label="Consignment Destination" value={selectedOrder.customer_address || 'N/A'} />
                 <SpecificationBox label="Payment Integrity" value={selectedOrder.payment_status} />
              </div>
              
              <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center justify-between">
                 <div>
                    <p className="text-[8px] uppercase tracking-widest font-black text-slate-400 mb-1">Total Acquisition Value</p>
                    <p className="font-display text-3xl font-bold text-gold italic">${selectedOrder.total_amount.toLocaleString()}</p>
                 </div>
                 <Button className="bg-charcoal text-gold hover:bg-charcoal/90 rounded-xl px-8 h-12 font-black text-[10px] uppercase tracking-widest">
                    Generate Invoice
                 </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
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
    {React.cloneElement(icon as React.ReactElement, { className: "w-4 h-4" })}
    <span className="font-body text-sm">{label}</span>
  </Link>
);

const SpecificationBox = ({ label, value }: { label: string, value: string }) => (
  <div className="space-y-1">
    <p className="text-[8px] uppercase tracking-widest font-black text-slate-300">{label}</p>
    <p className="text-sm font-medium text-slate-700 leading-snug">{value}</p>
  </div>
);

export default AdminOrders;

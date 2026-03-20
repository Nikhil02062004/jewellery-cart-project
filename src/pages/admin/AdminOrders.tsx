import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, ShoppingBag, MessageSquare, Users, LogOut, Eye, Mail, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  customer_address: string | null;
  items: OrderItem[];
  total_amount: number;
  status: string;
  notes: string | null;
  created_at: string;
}

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
      
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id);
      
      const hasAdminRole = roles?.some(r => r.role === 'admin');
      if (!hasAdminRole) {
        navigate('/');
        return;
      }
      
      setIsAdmin(true);
      fetchOrders();
    };

    checkAdmin();
  }, [navigate]);

  const fetchOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) {
      setOrders(data.map(order => ({
        ...order,
        items: order.items as unknown as OrderItem[]
      })));
    }
    setLoading(false);
  };

  const updateStatus = async (orderId: string, status: string) => {
    const order = orders.find(o => o.id === orderId);
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);
    
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Order status updated" });
            
      // Send shipping email for shipping-related status changes
      if (order && order.customer_email && ['shipped', 'out_for_delivery', 'delivered'].includes(status)) {
        sendShippingEmail(order, status as 'shipped' | 'out_for_delivery' | 'delivered');
      }
      
      fetchOrders();
    }
  };
    const sendShippingEmail = async (order: Order, status: 'shipped' | 'out_for_delivery' | 'delivered') => {
    try {
      await supabase.functions.invoke('send-shipping-email', {
        body: {
          orderId: order.id,
          customerName: order.customer_name,
          customerEmail: order.customer_email,
          status,
          shippingAddress: order.customer_address || 'Address on file',
          trackingNumber: `LUM${order.id.slice(0, 8).toUpperCase()}`,
          carrier: 'Premium Delivery',
          estimatedDelivery: status === 'delivered' ? 'Delivered' : 'Within 2-3 business days'
        }
      });
      toast({ title: "Email Sent", description: `${status.replace('_', ' ')} notification sent to customer` });
    } catch (error) {
      console.error('Failed to send shipping email:', error);
    }
  };
  const sendManualEmail = async (order: Order, emailType: 'confirmation' | 'shipped' | 'out_for_delivery' | 'delivered') => {
    if (!order.customer_email) {
      toast({ title: "Error", description: "No customer email available", variant: "destructive" });
      return;
    }
    try {
      if (emailType === 'confirmation') {
        await supabase.functions.invoke('send-order-email', {
          body: {
            orderId: order.id,
            customerName: order.customer_name,
            customerEmail: order.customer_email,
            items: order.items.map(item => ({
              name: item.name,
              quantity: item.quantity,
              price: item.price
            })),
            totalAmount: order.total_amount,
            shippingAddress: order.customer_address || 'Address on file'
          }
        });
      } else {
        await supabase.functions.invoke('send-shipping-email', {
          body: {
            orderId: order.id,
            customerName: order.customer_name,
            customerEmail: order.customer_email,
            status: emailType,
            shippingAddress: order.customer_address || 'Address on file',
            trackingNumber: `LUM${order.id.slice(0, 8).toUpperCase()}`,
            carrier: 'Premium Delivery',
            estimatedDelivery: emailType === 'delivered' ? 'Delivered' : 'Within 2-3 business days'
          }
        });
      }
      toast({ title: "Email Sent", description: `${emailType.replace('_', ' ')} email sent successfully` });
    } catch (error) {
      console.error('Failed to send email:', error);
      toast({ title: "Error", description: "Failed to send email", variant: "destructive" });
    }
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

  if (!isAdmin || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="font-body text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-charcoal text-primary-foreground py-4 px-6 flex items-center justify-between">
        <h1 className="font-display text-2xl">Admin Dashboard</h1>
        <div className="flex items-center gap-4">
          <Link to="/" className="font-body text-sm hover:text-gold transition-colors">View Store</Link>
          <Button variant="outline" size="sm" onClick={() => supabase.auth.signOut().then(() => navigate('/'))}>
            <LogOut className="w-4 h-4" />Logout
          </Button>
        </div>
      </header>

      <div className="flex">
        <aside className="w-64 min-h-[calc(100vh-64px)] bg-card border-r border-border p-6">
          <nav className="space-y-2">
            <Link to="/admin" className="flex items-center gap-3 px-4 py-3 rounded-sm text-muted-foreground hover:bg-muted font-body text-sm transition-colors">
              <Users className="w-4 h-4" />Dashboard
            </Link>
            <Link to="/admin/products" className="flex items-center gap-3 px-4 py-3 rounded-sm text-muted-foreground hover:bg-muted font-body text-sm transition-colors">
              <Package className="w-4 h-4" />Products
            </Link>
            <Link to="/admin/orders" className="flex items-center gap-3 px-4 py-3 rounded-sm bg-gold/10 text-gold font-body text-sm">
              <ShoppingBag className="w-4 h-4" />Orders
            </Link>
            <Link to="/admin/inquiries" className="flex items-center gap-3 px-4 py-3 rounded-sm text-muted-foreground hover:bg-muted font-body text-sm transition-colors">
              <MessageSquare className="w-4 h-4" />Inquiries
            </Link>
            <Link to="/admin/chat" className="flex items-center gap-3 px-4 py-3 rounded-sm text-muted-foreground hover:bg-muted font-body text-sm transition-colors">
              <Headphones className="w-4 h-4" />Live Chat
            </Link>
          </nav>
        </aside>

        <main className="flex-1 p-8">
          <h2 className="font-display text-3xl mb-8">Orders</h2>

          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-4 font-body text-sm font-medium">Order ID</th>
                  <th className="text-left p-4 font-body text-sm font-medium">Customer</th>
                  <th className="text-left p-4 font-body text-sm font-medium">Total</th>
                  <th className="text-left p-4 font-body text-sm font-medium">Status</th>
                  <th className="text-left p-4 font-body text-sm font-medium">Date</th>
                  <th className="text-right p-4 font-body text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-t border-border">
                    <td className="p-4 font-body text-sm font-mono">{order.id.slice(0, 8)}</td>
                    <td className="p-4">
                      <div>
                        <p className="font-body text-sm">{order.customer_name}</p>
                        <p className="font-body text-xs text-muted-foreground">{order.customer_email}</p>
                      </div>
                    </td>
                    <td className="p-4 font-body text-sm">₹{order.total_amount.toLocaleString()}</td>
                    <td className="p-4">
                      <Select value={order.status} onValueChange={(v) => updateStatus(order.id, v)}>
                        <SelectTrigger className="w-32">
                          <span className={`px-2 py-1 rounded text-xs font-body ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="shipped">Shipped</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-4 font-body text-sm text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                                        <td className="p-4 text-right space-x-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Mail className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => sendManualEmail(order, 'confirmation')}>
                            Send Order Confirmation
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => sendManualEmail(order, 'shipped')}>
                            Send Shipped Notification
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => sendManualEmail(order, 'out_for_delivery')}>
                            Send Out for Delivery
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => sendManualEmail(order, 'delivered')}>
                            Send Delivered Notification
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center font-body text-muted-foreground">
                      No orders yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm font-body">
                <div>
                  <p className="text-muted-foreground">Order ID</p>
                  <p className="font-mono">{selectedOrder.id.slice(0, 8)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p>{new Date(selectedOrder.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Customer</p>
                  <p>{selectedOrder.customer_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p>{selectedOrder.customer_email}</p>
                </div>
                {selectedOrder.customer_phone && (
                  <div>
                    <p className="text-muted-foreground">Phone</p>
                    <p>{selectedOrder.customer_phone}</p>
                  </div>
                )}
                {selectedOrder.customer_address && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Address</p>
                    <p>{selectedOrder.customer_address}</p>
                  </div>
                )}
              </div>
              <div className="border-t border-border pt-4">
                <p className="font-body text-sm font-medium mb-2">Items</p>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded" />
                      <div className="flex-1">
                        <p className="font-body text-sm">{item.name}</p>
                        <p className="font-body text-xs text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-body text-sm">₹{(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t border-border pt-4 flex justify-between">
                <span className="font-display text-lg">Total</span>
                <span className="font-display text-lg text-gold">₹{selectedOrder.total_amount.toLocaleString()}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrders;

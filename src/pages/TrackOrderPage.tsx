import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import OrderStatusTracker from '@/components/orders/OrderStatusTracker';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Search, Package } from 'lucide-react';

const TrackOrderPage = () => {
  const [orderId, setOrderId] = useState('');
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim()) {
      toast.error('Please enter an order ID');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId.trim())
        .single();

      if (error || !data) {
        toast.error('Order not found');
        setOrder(null);
      } else {
        setOrder(data);
      }
    } catch (error) {
      toast.error('Failed to fetch order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <Package className="w-16 h-16 mx-auto mb-4 text-gold" />
            <h1 className="font-display text-4xl mb-4">Track Your Order</h1>
            <p className="text-muted-foreground">
              Enter your order ID to track your shipment status
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Order Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="flex gap-4 mb-8">
                <Input
                  placeholder="Enter your order ID"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" disabled={loading}>
                  <Search className="w-4 h-4 mr-2" />
                  Track
                </Button>
              </form>

              {order && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Order ID:</span>
                      <p className="font-medium">{order.id}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total:</span>
                      <p className="font-medium">₹{order.total_amount?.toLocaleString()}</p>
                    </div>
                  </div>
                  <OrderStatusTracker status={order.status} updatedAt={order.updated_at} />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default TrackOrderPage;

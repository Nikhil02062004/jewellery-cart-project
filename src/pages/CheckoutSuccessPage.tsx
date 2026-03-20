import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, Package, ArrowRight } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';

const CheckoutSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { clearCart, items, totalPrice } = useCart();
  const [orderSaved, setOrderSaved] = useState(false);

  useEffect(() => {
    const saveOrderAndSendEmail = async () => {
      if (sessionId && items.length > 0 && !orderSaved) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          
          // Get customer email from items or session
          const customerEmail = session?.user?.email || '';
          
          const orderData = {
            customer_name: 'Online Payment Customer',
            customer_email: customerEmail,
            customer_phone: '',
            customer_address: 'Address collected via Stripe',
            items: JSON.parse(JSON.stringify(items)),
            total_amount: totalPrice,
            status: 'paid',
            user_id: session?.user?.id || null,
          };

          const { data: order, error } = await supabase.from('orders').insert(orderData).select().single();

          if (!error && order) {
            // Send confirmation email
            await supabase.functions.invoke('send-order-email', {
              body: {
                orderId: order.id,
                customerName: orderData.customer_name,
                customerEmail: orderData.customer_email,
                items: items.map(item => ({
                  name: item.name,
                  quantity: item.quantity,
                  price: item.price,
                })),
                totalAmount: totalPrice,
                shippingAddress: orderData.customer_address,
              },
            });
          }

          setOrderSaved(true);
          clearCart();
        } catch (err) {
          console.error('Error saving order:', err);
        }
      } else if (items.length === 0) {
        setOrderSaved(true);
      }
    };

    saveOrderAndSendEmail();
  }, [sessionId, items, totalPrice, clearCart, orderSaved]);

  return (
    <Layout>
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            
            <h1 className="font-display text-4xl mb-4">Payment Successful!</h1>
            <p className="font-body text-muted-foreground mb-8">
              Thank you for your purchase. Your order has been confirmed and you'll receive a confirmation email shortly.
            </p>

            {sessionId && (
              <div className="bg-muted rounded-lg p-4 mb-8">
                <p className="font-body text-sm text-muted-foreground">
                  Transaction ID: <span className="font-mono text-foreground">{sessionId.slice(0, 20)}...</span>
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <Link to="/account">
                  <Package className="w-4 h-4 mr-2" />
                  View Orders
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/">
                  Continue Shopping
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default CheckoutSuccessPage;

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Truck, Shield, Banknote } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

const CheckoutPage = () => {
  const { items, totalPrice, clearCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('online');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    notes: '',
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
      if (session?.user?.email) {
        setFormData(prev => ({ ...prev, email: session.user.email || '' }));
      }
    });
  }, []);

  const handleStripeCheckout = async () => {
    setLoading(true);

    try {
      const customerInfo = {
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        phone: formData.phone,
        address: `${formData.address}, ${formData.city}, ${formData.state} - ${formData.pincode}`,
      };

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { items, customerInfo },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err: any) {
      console.error('Stripe checkout error:', err);
      toast({
        title: "Error",
        description: "Failed to initiate payment. Please try again.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleCODOrder = async () => {
    setLoading(true);

    try {
      const orderData = {
        customer_name: `${formData.firstName} ${formData.lastName}`,
        customer_email: formData.email,
        customer_phone: formData.phone,
        customer_address: `${formData.address}, ${formData.city}, ${formData.state} - ${formData.pincode}`,
        items: JSON.parse(JSON.stringify(items)),
        total_amount: totalPrice,
        notes: formData.notes || null,
        user_id: userId,
        status: 'pending',
      };

      const { data: order, error } = await supabase.from('orders').insert(orderData).select().single();

      if (error) throw error;

      // Send order confirmation email
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

      clearCart();
      toast({
        title: "Order Placed Successfully!",
        description: "We'll contact you shortly to confirm your order.",
      });
      navigate('/account');
    } catch (err: any) {
      console.error('COD order error:', err);
      toast({
        title: "Error",
        description: "Failed to place order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (paymentMethod === 'online') {
      await handleStripeCheckout();
    } else {
      await handleCODOrder();
    }
  };

  if (items.length === 0) {
    return (
      <Layout>
        <section className="py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="font-display text-3xl mb-4">Your Cart is Empty</h1>
            <p className="font-body text-muted-foreground mb-8">Add some items to checkout.</p>
            <Button asChild>
              <Link to="/silver">Shop Now</Link>
            </Button>
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
          <p className="font-body text-gold tracking-[0.3em] uppercase text-sm mb-4">Secure</p>
          <h1 className="font-display text-5xl md:text-6xl text-primary-foreground">Checkout</h1>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <Link to="/cart" className="inline-flex items-center gap-2 font-body text-muted-foreground hover:text-gold transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" />
            Back to Cart
          </Link>

          <form onSubmit={handleSubmit}>
            <div className="grid lg:grid-cols-3 gap-12">
              {/* Form */}
              <div className="lg:col-span-2 space-y-8">
                {/* Contact */}
                <div className="bg-card border border-border rounded-lg p-6">
                  <h2 className="font-display text-xl mb-6">Contact Information</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-body text-sm text-muted-foreground mb-2 block">First Name *</label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        required
                        className="w-full px-4 py-3 bg-background border border-border rounded-sm font-body focus:outline-none focus:border-gold"
                      />
                    </div>
                    <div>
                      <label className="font-body text-sm text-muted-foreground mb-2 block">Last Name *</label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        required
                        className="w-full px-4 py-3 bg-background border border-border rounded-sm font-body focus:outline-none focus:border-gold"
                      />
                    </div>
                    <div>
                      <label className="font-body text-sm text-muted-foreground mb-2 block">Email *</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        className="w-full px-4 py-3 bg-background border border-border rounded-sm font-body focus:outline-none focus:border-gold"
                      />
                    </div>
                    <div>
                      <label className="font-body text-sm text-muted-foreground mb-2 block">Phone *</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                        className="w-full px-4 py-3 bg-background border border-border rounded-sm font-body focus:outline-none focus:border-gold"
                      />
                    </div>
                  </div>
                </div>

                {/* Shipping */}
                <div className="bg-card border border-border rounded-lg p-6">
                  <h2 className="font-display text-xl mb-6">Shipping Address</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="font-body text-sm text-muted-foreground mb-2 block">Address *</label>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        required
                        className="w-full px-4 py-3 bg-background border border-border rounded-sm font-body focus:outline-none focus:border-gold"
                      />
                    </div>
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div>
                        <label className="font-body text-sm text-muted-foreground mb-2 block">City *</label>
                        <input
                          type="text"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          required
                          className="w-full px-4 py-3 bg-background border border-border rounded-sm font-body focus:outline-none focus:border-gold"
                        />
                      </div>
                      <div>
                        <label className="font-body text-sm text-muted-foreground mb-2 block">State *</label>
                        <input
                          type="text"
                          value={formData.state}
                          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                          required
                          className="w-full px-4 py-3 bg-background border border-border rounded-sm font-body focus:outline-none focus:border-gold"
                        />
                      </div>
                      <div>
                        <label className="font-body text-sm text-muted-foreground mb-2 block">PIN Code *</label>
                        <input
                          type="text"
                          value={formData.pincode}
                          onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                          required
                          className="w-full px-4 py-3 bg-background border border-border rounded-sm font-body focus:outline-none focus:border-gold"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="font-body text-sm text-muted-foreground mb-2 block">Order Notes (Optional)</label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-3 bg-background border border-border rounded-sm font-body focus:outline-none focus:border-gold resize-none"
                        placeholder="Any special instructions..."
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="bg-card border border-border rounded-lg p-6">
                  <h2 className="font-display text-xl mb-6">Payment Method</h2>
                  <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as 'online' | 'cod')} className="space-y-4">
                    <div className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${paymentMethod === 'online' ? 'border-gold bg-gold/5' : 'border-border hover:border-gold/50'}`}>
                      <RadioGroupItem value="online" id="online" />
                      <Label htmlFor="online" className="flex items-center gap-3 cursor-pointer flex-1">
                        <CreditCard className="w-5 h-5 text-gold" />
                        <div>
                          <p className="font-body font-medium">Pay Online</p>
                          <p className="font-body text-sm text-muted-foreground">Credit/Debit Card, UPI, Net Banking</p>
                        </div>
                      </Label>
                    </div>
                    <div className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${paymentMethod === 'cod' ? 'border-gold bg-gold/5' : 'border-border hover:border-gold/50'}`}>
                      <RadioGroupItem value="cod" id="cod" />
                      <Label htmlFor="cod" className="flex items-center gap-3 cursor-pointer flex-1">
                        <Banknote className="w-5 h-5 text-gold" />
                        <div>
                          <p className="font-body font-medium">Cash on Delivery</p>
                          <p className="font-body text-sm text-muted-foreground">Pay when your order arrives</p>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              {/* Summary */}
              <div className="lg:col-span-1">
                <div className="bg-card border border-border rounded-lg p-6 sticky top-24">
                  <h2 className="font-display text-2xl mb-6">Order Summary</h2>
                  
                  <div className="space-y-4 pb-6 border-b border-border max-h-[300px] overflow-y-auto">
                    {items.map((item) => (
                      <div key={item.id} className="flex gap-3">
                        <div className="w-16 h-16 bg-muted rounded overflow-hidden shrink-0">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-body text-sm truncate">{item.name}</h4>
                          <p className="font-body text-xs text-muted-foreground">Qty: {item.quantity}</p>
                          <p className="font-body text-sm text-gold">₹{(item.price * item.quantity).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3 py-6 border-b border-border">
                    <div className="flex justify-between font-body text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>₹{totalPrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-body text-sm">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="text-green-600">Free</span>
                    </div>
                  </div>

                  <div className="flex justify-between py-6">
                    <span className="font-display text-lg">Total</span>
                    <span className="font-display text-2xl text-gold">₹{totalPrice.toLocaleString()}</span>
                  </div>

                  <Button type="submit" size="lg" className="w-full" disabled={loading}>
                    {loading ? 'Processing...' : paymentMethod === 'online' ? 'Pay Now' : 'Place Order'}
                  </Button>

                  <div className="mt-6 space-y-3">
                    <div className="flex items-center gap-2 font-body text-xs text-muted-foreground">
                      <Shield className="w-4 h-4 text-gold" />
                      <span>Secure checkout</span>
                    </div>
                    <div className="flex items-center gap-2 font-body text-xs text-muted-foreground">
                      <Truck className="w-4 h-4 text-gold" />
                      <span>Free shipping on orders above ₹5000</span>
                    </div>
                    <div className="flex items-center gap-2 font-body text-xs text-muted-foreground">
                      <CreditCard className="w-4 h-4 text-gold" />
                      <span>Multiple payment options available</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </section>
    </Layout>
  );
};

export default CheckoutPage;

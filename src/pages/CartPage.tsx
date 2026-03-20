import { Link } from 'react-router-dom';
import { Trash2, Minus, Plus, ArrowRight, ShoppingBag } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';

const CartPage = () => {
  const { items, removeFromCart, updateQuantity, totalPrice, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <Layout>
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-lg mx-auto text-center">
              <ShoppingBag className="w-20 h-20 text-muted-foreground/30 mx-auto mb-6" />
              <h1 className="font-display text-3xl mb-4">Your Cart is Empty</h1>
              <p className="font-body text-muted-foreground mb-8">
                Looks like you haven't added any items to your cart yet.
              </p>
              <Button asChild size="lg">
                <Link to="/silver">Start Shopping</Link>
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
          <p className="font-body text-gold tracking-[0.3em] uppercase text-sm mb-4">Your</p>
          <h1 className="font-display text-5xl md:text-6xl text-primary-foreground">Shopping Cart</h1>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="border border-border rounded-lg overflow-hidden">
                {/* Header */}
                <div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-muted font-body text-sm uppercase tracking-wider text-muted-foreground">
                  <div className="col-span-6">Product</div>
                  <div className="col-span-2 text-center">Price</div>
                  <div className="col-span-2 text-center">Quantity</div>
                  <div className="col-span-2 text-right">Total</div>
                </div>

                {/* Items */}
                {items.map((item) => (
                  <div key={item.id} className="grid grid-cols-12 gap-4 p-4 border-t border-border items-center">
                    <div className="col-span-12 md:col-span-6 flex items-center gap-4">
                      <div className="w-20 h-20 bg-muted rounded overflow-hidden shrink-0">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h3 className="font-display text-lg">{item.name}</h3>
                        <p className="font-body text-sm text-muted-foreground capitalize">{item.category}</p>
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="text-destructive text-sm font-body mt-1 flex items-center gap-1 hover:underline"
                        >
                          <Trash2 className="w-3 h-3" /> Remove
                        </button>
                      </div>
                    </div>
                    <div className="col-span-4 md:col-span-2 text-center font-body">
                      ₹{item.price.toLocaleString()}
                    </div>
                    <div className="col-span-4 md:col-span-2 flex items-center justify-center gap-2">
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:border-gold hover:text-gold transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-body w-8 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:border-gold hover:text-gold transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="col-span-4 md:col-span-2 text-right font-display text-lg text-gold">
                      ₹{(item.price * item.quantity).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center mt-6">
                <Button variant="ghost" onClick={clearCart} className="text-destructive hover:text-destructive">
                  Clear Cart
                </Button>
                <Button asChild variant="outline">
                  <Link to="/silver">Continue Shopping</Link>
                </Button>
              </div>
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="font-display text-2xl mb-6">Order Summary</h2>
                
                <div className="space-y-4 pb-6 border-b border-border">
                  <div className="flex justify-between font-body">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>₹{totalPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-body">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="text-green-600">Free</span>
                  </div>
                </div>

                <div className="flex justify-between py-6 border-b border-border">
                  <span className="font-display text-lg">Total</span>
                  <span className="font-display text-2xl text-gold">₹{totalPrice.toLocaleString()}</span>
                </div>

                <Button asChild size="lg" className="w-full mt-6">
                  <Link to="/checkout">
                    Proceed to Checkout
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>

                <p className="font-body text-xs text-muted-foreground text-center mt-4">
                  Taxes and shipping calculated at checkout
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default CartPage;

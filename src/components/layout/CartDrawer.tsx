import { X, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from "react-router-dom";


export const CartDrawer = () => {
  const navigate = useNavigate();

  const { items, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, totalPrice, clearCart } = useCart();

  if (!isCartOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-charcoal/60 backdrop-blur-sm z-50 animate-fade-in"
        onClick={() => setIsCartOpen(false)}
      />
      
      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-background z-50 shadow-2xl animate-slide-up">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-border">
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-5 h-5 text-gold" />
              <h2 className="font-display text-xl">Your Cart</h2>
            </div>
            <button 
              onClick={() => setIsCartOpen(false)}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <ShoppingBag className="w-16 h-16 text-muted-foreground/30 mb-4" />
                <p className="font-body text-muted-foreground">Your cart is empty</p>
                <p className="font-body text-sm text-muted-foreground/70 mt-1">Add some beautiful pieces to get started</p>
              </div>
            ) : (
              <div className="space-y-6">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4 p-4 bg-card rounded-lg">
                    <div className="w-20 h-20 bg-muted rounded overflow-hidden shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display text-sm font-medium truncate">{item.name}</h3>
                      <p className="font-body text-sm text-gold mt-1">₹{item.price.toLocaleString()}</p>
                      <div className="flex items-center gap-3 mt-3">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:border-gold hover:text-gold transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-body text-sm w-6 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:border-gold hover:text-gold transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="px-6 py-6 border-t border-border bg-card">
              <div className="flex items-center justify-between mb-4">
                <span className="font-body text-muted-foreground">Subtotal</span>
                <span className="font-display text-xl">₹{totalPrice.toLocaleString()}</span>
              </div>
              <Button 
                className="w-full" 
                size="lg"
                onClick={() => {
                setIsCartOpen(false);
                navigate("/checkout");
              }}
              >
              Proceed to Checkout
              </Button>

              <button 
                onClick={clearCart}
                className="w-full mt-3 font-body text-sm text-muted-foreground hover:text-destructive transition-colors"
              >
                Clear Cart
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

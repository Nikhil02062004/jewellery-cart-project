import { Package, Truck, CheckCircle, Clock, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrderStatusTrackerProps {
  status: string;
  updatedAt?: string;
}

const statusSteps = [
  { key: 'pending', label: 'Order Placed', icon: Clock },
  { key: 'processing', label: 'Processing', icon: Package },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle },
];

const getStatusIndex = (status: string) => {
  if (status === 'cancelled') return -1;
  if (status === 'paid') return 0; // Treat paid as same as pending step
  const index = statusSteps.findIndex(s => s.key === status);
  return index >= 0 ? index : 0;
};

const OrderStatusTracker = ({ status, updatedAt }: OrderStatusTrackerProps) => {
  const currentIndex = getStatusIndex(status);
  const isCancelled = status === 'cancelled';

  if (isCancelled) {
    return (
      <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-center">
        <XCircle className="w-10 h-10 text-destructive mx-auto mb-2" />
        <p className="font-display text-lg text-destructive">Order Cancelled</p>
        {updatedAt && (
          <p className="font-body text-sm text-muted-foreground mt-1">
            Updated: {new Date(updatedAt).toLocaleString()}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="py-4">
      <div className="relative">
        {/* Progress Line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-border" />
        <div 
          className="absolute top-5 left-0 h-0.5 bg-gold transition-all duration-500"
          style={{ width: `${(currentIndex / (statusSteps.length - 1)) * 100}%` }}
        />

        {/* Steps */}
        <div className="relative flex justify-between">
          {statusSteps.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = index <= currentIndex;
            const isCurrent = index === currentIndex;

            return (
              <div key={step.key} className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 z-10",
                    isCompleted
                      ? "bg-gold text-charcoal"
                      : "bg-muted text-muted-foreground",
                    isCurrent && "ring-4 ring-gold/30"
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <p
                  className={cn(
                    "font-body text-xs mt-2 text-center max-w-[70px]",
                    isCompleted ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {step.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {updatedAt && (
        <p className="font-body text-xs text-muted-foreground text-center mt-4">
          Last updated: {new Date(updatedAt).toLocaleString()}
        </p>
      )}
    </div>
  );
};

export default OrderStatusTracker;

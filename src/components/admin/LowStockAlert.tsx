import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface LowStockProduct {
  id: string;
  name: string;
  stock_quantity: number;
  low_stock_threshold: number;
}

interface LowStockAlertProps {
  products: LowStockProduct[];
}

export const LowStockAlert = ({ products }: LowStockAlertProps) => {
  if (products.length === 0) return null;

  return (
    <Alert variant="destructive" className="mb-6">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="font-display">Low Stock Alert</AlertTitle>
      <AlertDescription>
        <p className="font-body text-sm mb-2">
          {products.length} product{products.length > 1 ? 's are' : ' is'} running low on stock:
        </p>
        <div className="flex flex-wrap gap-2">
          {products.map((product) => (
            <Badge key={product.id} variant="outline" className="bg-background">
              {product.name}: {product.stock_quantity} left
            </Badge>
          ))}
        </div>
      </AlertDescription>
    </Alert>
  );
};

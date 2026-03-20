import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Award } from "lucide-react";
import { cn } from "@/lib/utils";
type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'new';
interface TierConfig {
  label: string;
  color: string;
  bgColor: string;
  minOrders: number;
  minSpend: number;
}
const tierConfig: Record<LoyaltyTier, TierConfig> = {
  platinum: {
    label: 'Platinum',
    color: 'text-violet-700 dark:text-violet-300',
    bgColor: 'bg-violet-100 dark:bg-violet-900/30 border-violet-200 dark:border-violet-800',
    minOrders: 10,
    minSpend: 100000,
  },
  gold: {
    label: 'Gold',
    color: 'text-amber-700 dark:text-amber-300',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800',
    minOrders: 5,
    minSpend: 50000,
  },
  silver: {
    label: 'Silver',
    color: 'text-slate-600 dark:text-slate-300',
    bgColor: 'bg-slate-100 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700',
    minOrders: 3,
    minSpend: 25000,
  },
  bronze: {
    label: 'Bronze',
    color: 'text-orange-700 dark:text-orange-300',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800',
    minOrders: 1,
    minSpend: 0,
  },
  new: {
    label: 'New',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/50 border-muted',
    minOrders: 0,
    minSpend: 0,
  },
};
function calculateTier(orderCount: number, totalSpent: number): LoyaltyTier {
  if (orderCount >= 10 || totalSpent >= 100000) return 'platinum';
  if (orderCount >= 5 || totalSpent >= 50000) return 'gold';
  if (orderCount >= 3 || totalSpent >= 25000) return 'silver';
  if (orderCount >= 1) return 'bronze';
  return 'new';
}
interface CustomerLoyaltyBadgeProps {
  customerId: string | null;
  className?: string;
  showTooltip?: boolean;
}
export const CustomerLoyaltyBadge = ({ customerId, className, showTooltip = true }: CustomerLoyaltyBadgeProps) => {
  const [tier, setTier] = useState<LoyaltyTier | null>(null);
  const [stats, setStats] = useState({ orders: 0, spent: 0 });
  useEffect(() => {
    if (!customerId) {
      setTier('new');
      return;
    }
    const fetchLoyalty = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, total_amount')
        .eq('user_id', customerId);
      if (!error && data) {
        const orderCount = data.length;
        const totalSpent = data.reduce((sum, o) => sum + Number(o.total_amount), 0);
        setStats({ orders: orderCount, spent: totalSpent });
        setTier(calculateTier(orderCount, totalSpent));
      } else {
        setTier('new');
      }
    };
    fetchLoyalty();
  }, [customerId]);
  if (!tier) return null;
  const config = tierConfig[tier];
  const badge = (
    <Badge
      variant="outline"
      className={cn(
        "text-xs flex items-center gap-1 border",
        config.color,
        config.bgColor,
        className
      )}
    >
      <Award className="h-3 w-3" />
      {config.label}
    </Badge>
  );
  if (!showTooltip || tier === 'new') return badge;
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">
            {stats.orders} order{stats.orders !== 1 ? 's' : ''} · ₹{stats.spent.toLocaleString()} spent
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
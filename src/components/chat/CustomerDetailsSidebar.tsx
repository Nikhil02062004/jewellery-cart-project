import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { CustomerLoyaltyBadge } from "./CustomerLoyaltyBadge";
import { 
  User, ShoppingBag, MessageCircle, Clock, 
  Package, ChevronRight, Award, TrendingUp 
} from "lucide-react";
import { cn } from "@/lib/utils";
interface Order {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  items: { name: string; qty: number; price: number }[];
}
interface PastConversation {
  id: string;
  status: string;
  created_at: string;
  closed_at: string | null;
}
const tierThresholds = [
  { tier: "Platinum", orders: 10, spend: 100000, color: "text-violet-600" },
  { tier: "Gold", orders: 5, spend: 50000, color: "text-amber-600" },
  { tier: "Silver", orders: 3, spend: 25000, color: "text-slate-500" },
  { tier: "Bronze", orders: 1, spend: 0, color: "text-orange-600" },
];
function getNextTier(orderCount: number, totalSpent: number) {
  if (orderCount >= 10 || totalSpent >= 100000) return null; // Already Platinum
  if (orderCount >= 5 || totalSpent >= 50000) return { tier: "Platinum", ordersNeeded: 10 - orderCount, spendNeeded: 100000 - totalSpent };
  if (orderCount >= 3 || totalSpent >= 25000) return { tier: "Gold", ordersNeeded: 5 - orderCount, spendNeeded: 50000 - totalSpent };
  if (orderCount >= 1) return { tier: "Silver", ordersNeeded: 3 - orderCount, spendNeeded: 25000 - totalSpent };
  return { tier: "Bronze", ordersNeeded: 1, spendNeeded: 0 };
}
function getSpendProgress(totalSpent: number): number {
  if (totalSpent >= 100000) return 100;
  if (totalSpent >= 50000) return 50 + ((totalSpent - 50000) / 50000) * 50;
  if (totalSpent >= 25000) return 25 + ((totalSpent - 25000) / 25000) * 25;
  return Math.min((totalSpent / 25000) * 25, 25);
}
interface CustomerDetailsSidebarProps {
  customerId: string | null;
  customerName: string | null;
  customerEmail: string | null;
}
export const CustomerDetailsSidebar = ({ customerId, customerName, customerEmail }: CustomerDetailsSidebarProps) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [conversations, setConversations] = useState<PastConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const totalSpent = orders.reduce((sum, o) => sum + Number(o.total_amount), 0);
  const orderCount = orders.length;
  const nextTier = getNextTier(orderCount, totalSpent);
  useEffect(() => {
    if (!customerId) {
      setLoading(false);
      return;
    }
    const fetchData = async () => {
      setLoading(true);
      const [ordersRes, convsRes] = await Promise.all([
        supabase
          .from("orders")
          .select("id, total_amount, status, created_at, items")
          .eq("user_id", customerId)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("chat_conversations")
          .select("id, status, created_at, closed_at")
          .eq("customer_id", customerId)
          .order("created_at", { ascending: false })
          .limit(10),
      ]);
      if (ordersRes.data) {
        setOrders(ordersRes.data.map(o => ({
          ...o,
          items: Array.isArray(o.items) ? o.items as Order['items'] : []
        })));
      }
      if (convsRes.data) setConversations(convsRes.data);
      setLoading(false);
    };
    fetchData();
  }, [customerId]);
  const statusColor = (status: string) => {
    const colors: Record<string, string> = {
      delivered: "bg-green-100 text-green-800",
      shipped: "bg-blue-100 text-blue-800",
      processing: "bg-yellow-100 text-yellow-800",
      pending: "bg-muted text-muted-foreground",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-muted text-muted-foreground";
  };
  if (loading) {
    return (
      <div className="w-72 border-l bg-background p-4 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }
  return (
    <div className="w-72 border-l bg-background flex flex-col">
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-5">
          {/* Customer Info */}
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-2">
              <User className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-sm">{customerName || "Anonymous"}</h3>
            <p className="text-xs text-muted-foreground">{customerEmail || "No email"}</p>
            <div className="mt-2 flex justify-center">
              <CustomerLoyaltyBadge customerId={customerId} />
            </div>
          </div>
          <Separator />
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <ShoppingBag className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-lg font-bold">{orderCount}</p>
              <p className="text-xs text-muted-foreground">Orders</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <TrendingUp className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-lg font-bold">₹{totalSpent >= 1000 ? `${(totalSpent / 1000).toFixed(0)}k` : totalSpent}</p>
              <p className="text-xs text-muted-foreground">Total Spent</p>
            </div>
          </div>
          {/* Tier Progress */}
          {nextTier && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium">Next: {nextTier.tier}</span>
              </div>
              <Progress value={getSpendProgress(totalSpent)} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {nextTier.ordersNeeded > 0 && `${nextTier.ordersNeeded} more order${nextTier.ordersNeeded > 1 ? 's' : ''}`}
                {nextTier.ordersNeeded > 0 && nextTier.spendNeeded > 0 && ' or '}
                {nextTier.spendNeeded > 0 && `₹${nextTier.spendNeeded.toLocaleString()} more spend`}
              </p>
            </div>
          )}
          {!nextTier && orderCount > 0 && (
            <div className="bg-violet-50 dark:bg-violet-900/20 rounded-lg p-3 text-center">
              <Award className="h-5 w-5 mx-auto mb-1 text-violet-600" />
              <p className="text-xs font-medium text-violet-700 dark:text-violet-300">Platinum Member ✨</p>
            </div>
          )}
          <Separator />
          {/* Order History */}
          <div>
            <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-3 flex items-center gap-1">
              <Package className="h-3 w-3" /> Order History
            </h4>
            {orders.length === 0 ? (
              <p className="text-xs text-muted-foreground">No orders found</p>
            ) : (
              <div className="space-y-2">
                {orders.slice(0, 5).map((order) => (
                  <div key={order.id} className="bg-muted/30 rounded-lg p-2.5 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">₹{Number(order.total_amount).toLocaleString()}</span>
                      <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0", statusColor(order.status))}>
                        {order.status}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {order.items.map(i => i.name).join(", ") || "Items"}
                    </p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
                {orders.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center">+{orders.length - 5} more orders</p>
                )}
              </div>
            )}
          </div>
          <Separator />
          {/* Previous Conversations */}
          <div>
            <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-3 flex items-center gap-1">
              <MessageCircle className="h-3 w-3" /> Past Conversations
            </h4>
            {conversations.length <= 1 ? (
              <p className="text-xs text-muted-foreground">No previous conversations</p>
            ) : (
              <div className="space-y-2">
                {conversations.slice(1, 6).map((conv) => (
                  <div key={conv.id} className="bg-muted/30 rounded-lg p-2.5 flex items-center justify-between">
                    <div>
                      <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0",
                        conv.status === 'resolved' ? 'bg-green-100 text-green-800' : 'bg-muted text-muted-foreground'
                      )}>
                        {conv.status}
                      </Badge>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {new Date(conv.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};
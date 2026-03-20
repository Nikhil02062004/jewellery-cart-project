import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, AlertTriangle, Star, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
interface SatisfactionAlert {
  id: string;
  conversation_id: string;
  agent_id: string | null;
  rating: number;
  threshold: number;
  is_read: boolean;
  created_at: string;
}
interface SatisfactionAlertsProps {
  userId: string | null;
}
export const SatisfactionAlerts = ({ userId }: SatisfactionAlertsProps) => {
  const [alerts, setAlerts] = useState<SatisfactionAlert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!userId) return;
    
    fetchAlerts();
    // Subscribe to new alerts in real-time
    const channel = supabase
      .channel('satisfaction-alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'satisfaction_alerts'
        },
        (payload) => {
          const newAlert = payload.new as SatisfactionAlert;
          setAlerts(prev => [newAlert, ...prev]);
          setUnreadCount(prev => prev + 1);
          toast.warning(`Low satisfaction alert: ${newAlert.rating} star rating received`, {
            icon: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
          });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);
  const fetchAlerts = async () => {
    const { data, error } = await supabase
      .from('satisfaction_alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (!error && data) {
      setAlerts(data);
      setUnreadCount(data.filter(a => !a.is_read).length);
    }
  };
  const markAsRead = async (alertId: string) => {
    const { error } = await supabase
      .from('satisfaction_alerts')
      .update({ is_read: true })
      .eq('id', alertId);
    if (!error) {
      setAlerts(prev => 
        prev.map(a => a.id === alertId ? { ...a, is_read: true } : a)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };
  const markAllAsRead = async () => {
    const unreadIds = alerts.filter(a => !a.is_read).map(a => a.id);
    if (unreadIds.length === 0) return;
    const { error } = await supabase
      .from('satisfaction_alerts')
      .update({ is_read: true })
      .in('id', unreadIds);
    if (!error) {
      setAlerts(prev => prev.map(a => ({ ...a, is_read: true })));
      setUnreadCount(0);
      toast.success('All alerts marked as read');
    }
  };
  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "h-3 w-3",
            star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'
          )}
        />
      ))}
    </div>
  );
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 bg-background border">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            Satisfaction Alerts
          </h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              <Check className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No alerts yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => !alert.is_read && markAsRead(alert.id)}
                  className={cn(
                    "p-3 rounded-lg border cursor-pointer transition-colors",
                    alert.is_read 
                      ? "bg-background" 
                      : "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {renderStars(alert.rating)}
                        {!alert.is_read && (
                          <Badge variant="secondary" className="text-xs">New</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Rating below threshold ({alert.threshold} stars)
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(alert.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
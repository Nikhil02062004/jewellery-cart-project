 import { useState, useEffect } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
 import { ScrollArea } from "@/components/ui/scroll-area";
 import { toast } from "sonner";
 import { Users, Clock, Crown, UserCheck, AlertCircle } from "lucide-react";
 import { ChatPriorityBadge } from "@/components/chat/ChatPriorityBadge";
 import { CustomerLoyaltyBadge } from "@/components/chat/CustomerLoyaltyBadge";
 
 type Priority = 'low' | 'normal' | 'high' | 'urgent' | 'vip';
 
interface WaitingConversation {
  id: string;
  customer_id: string | null;
  customer_name: string | null;
  customer_email: string | null;
  priority: Priority;
  is_vip: boolean;
  created_at: string;
  wait_time_seconds: number;
}
 
 interface ChatQueueManagerProps {
   agentId: string | null;
   onAssign?: () => void;
 }
 
 export const ChatQueueManager = ({ agentId, onAssign }: ChatQueueManagerProps) => {
   const [waitingConversations, setWaitingConversations] = useState<WaitingConversation[]>([]);
   const [loading, setLoading] = useState(true);
 
   useEffect(() => {
     fetchWaitingConversations();
     
     // Update wait times every 30 seconds
     const interval = setInterval(fetchWaitingConversations, 30000);
     
     // Subscribe to realtime updates
     const channel = supabase
       .channel('queue-updates')
       .on(
         'postgres_changes',
         {
           event: '*',
           schema: 'public',
           table: 'chat_conversations',
           filter: 'status=eq.waiting'
         },
         () => {
           fetchWaitingConversations();
         }
       )
       .subscribe();
 
     return () => {
       clearInterval(interval);
       supabase.removeChannel(channel);
     };
   }, []);
 
   const fetchWaitingConversations = async () => {
      const { data, error } = await supabase
        .from('chat_conversations')
        .select('id, customer_id, customer_name, customer_email, priority, is_vip, created_at')
       .eq('status', 'waiting')
       .order('is_vip', { ascending: false })
       .order('created_at', { ascending: true });
 
     if (!error && data) {
       const now = Date.now();
       const withWaitTime = data.map(conv => ({
         ...conv,
         priority: (conv.priority || 'normal') as Priority,
         is_vip: conv.is_vip || false,
         wait_time_seconds: Math.floor((now - new Date(conv.created_at).getTime()) / 1000)
       }));
       
       // Sort by priority weight then wait time
       const priorityWeight: Record<string, number> = { vip: 5, urgent: 4, high: 3, normal: 2, low: 1 };
       const sorted = withWaitTime.sort((a, b) => {
         const aWeight = a.is_vip ? 5 : priorityWeight[a.priority] || 2;
         const bWeight = b.is_vip ? 5 : priorityWeight[b.priority] || 2;
         if (bWeight !== aWeight) return bWeight - aWeight;
         return a.wait_time_seconds - b.wait_time_seconds; // Longer wait first
       });
       
       setWaitingConversations(sorted);
     }
     setLoading(false);
   };
 
   const assignToMe = async (conversationId: string) => {
     if (!agentId) {
       toast.error('Please log in first');
       return;
     }
 
     const { error } = await supabase
       .from('chat_conversations')
       .update({ 
         assigned_agent_id: agentId,
         status: 'active'
       })
       .eq('id', conversationId);
 
     if (error) {
       toast.error('Failed to assign conversation');
       return;
     }
 
     await supabase
       .from('chat_messages')
       .insert({
         conversation_id: conversationId,
         sender_id: agentId,
         sender_type: 'system',
         message: 'An agent has joined the conversation.'
       });
 
     toast.success('Conversation assigned to you');
     fetchWaitingConversations();
     onAssign?.();
   };
 
   const formatWaitTime = (seconds: number) => {
     if (seconds < 60) return `${seconds}s`;
     if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
     return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
   };
 
   const getWaitTimeColor = (seconds: number) => {
     if (seconds > 300) return 'text-red-500'; // Over 5 min
     if (seconds > 120) return 'text-yellow-500'; // Over 2 min
     return 'text-green-500';
   };
 
   if (loading) {
     return (
       <Card>
         <CardContent className="pt-6">
           <div className="flex items-center justify-center h-32">
             <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
           </div>
         </CardContent>
       </Card>
     );
   }
 
   return (
     <Card>
       <CardHeader className="pb-3">
         <CardTitle className="text-base flex items-center gap-2">
           <Users className="h-4 w-4" />
           Waiting Queue
           {waitingConversations.length > 0 && (
             <Badge variant="destructive">{waitingConversations.length}</Badge>
           )}
         </CardTitle>
       </CardHeader>
       <CardContent>
         {waitingConversations.length === 0 ? (
           <div className="text-center py-8 text-muted-foreground">
             <UserCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
             <p className="text-sm">No customers waiting</p>
           </div>
         ) : (
           <ScrollArea className="h-[300px]">
             <div className="space-y-3">
               {waitingConversations.map((conv) => (
                 <div
                   key={conv.id}
                   className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                 >
                   <div className="flex items-start justify-between mb-2">
                     <div className="flex items-center gap-2">
                       <span className="font-medium text-sm">
                         {conv.customer_name || 'Anonymous'}
                       </span>
                       {conv.is_vip && <Crown className="h-3 w-3 text-purple-500" />}
                        <ChatPriorityBadge priority={conv.priority} isVip={conv.is_vip} />
                        <CustomerLoyaltyBadge customerId={conv.customer_id} showTooltip={false} />
                      </div>
                      <div className={`flex items-center gap-1 text-xs ${getWaitTimeColor(conv.wait_time_seconds)}`}>
                       <Clock className="h-3 w-3" />
                       {formatWaitTime(conv.wait_time_seconds)}
                     </div>
                   </div>
                   <p className="text-xs text-muted-foreground mb-2 truncate">
                     {conv.customer_email || 'No email'}
                   </p>
                   {conv.wait_time_seconds > 180 && (
                     <div className="flex items-center gap-1 text-xs text-orange-500 mb-2">
                       <AlertCircle className="h-3 w-3" />
                       Long wait time
                     </div>
                   )}
                   <Button
                     size="sm"
                     className="w-full"
                     onClick={() => assignToMe(conv.id)}
                   >
                     <UserCheck className="h-3 w-3 mr-1" />
                     Pick Up
                   </Button>
                 </div>
               ))}
             </div>
           </ScrollArea>
         )}
       </CardContent>
     </Card>
   );
 };
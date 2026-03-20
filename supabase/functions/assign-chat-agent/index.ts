import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
interface AssignAgentRequest {
  conversationId: string;
  customerName?: string;
  customerEmail?: string;
  initialMessage?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent' | 'vip';
  isVip?: boolean;
}
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    console.log("[ASSIGN-CHAT-AGENT] Function started");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { conversationId, customerName, customerEmail, initialMessage, priority, isVip, customerId }: AssignAgentRequest & { customerId?: string } = await req.json();
    console.log("[ASSIGN-CHAT-AGENT] Processing conversation:", conversationId, "Priority:", priority, "VIP:", isVip);

        // Auto-detect VIP based on order history
    let detectedVip = isVip || false;
    let detectedPriority = priority || 'normal';
    if (customerId) {
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, total_amount')
        .eq('user_id', customerId);
      if (!ordersError && orders) {
        const orderCount = orders.length;
        const totalSpent = orders.reduce((sum: number, o: { total_amount: number }) => sum + Number(o.total_amount), 0);
        // VIP: 5+ orders OR spent ₹50,000+
        if (orderCount >= 5 || totalSpent >= 50000) {
          detectedVip = true;
          detectedPriority = 'vip';
          console.log("[ASSIGN-CHAT-AGENT] VIP detected:", { orderCount, totalSpent });
        } else if (orderCount >= 3 || totalSpent >= 25000) {
          // High priority for returning customers
          if (detectedPriority === 'normal') {
            detectedPriority = 'high';
          }
          console.log("[ASSIGN-CHAT-AGENT] High-value customer:", { orderCount, totalSpent });
        }
      }
    }

    // Find an available agent with capacity
    const { data: availableAgents, error: agentsError } = await supabase
      .from('support_agents')
      .select('*')
      .eq('is_available', true)
      .lt('current_conversations', 5)
      .order('current_conversations', { ascending: true })
      .limit(1);
    if (agentsError) {
      console.error("[ASSIGN-CHAT-AGENT] Error finding agents:", agentsError);
      throw agentsError;
    }
    let assignedAgentId = null;
    let agentName = 'Support Team';
    if (availableAgents && availableAgents.length > 0) {
      const agent = availableAgents[0];
      assignedAgentId = agent.user_id;
      agentName = agent.display_name;
      // Update agent's current conversation count
      await supabase
        .from('support_agents')
        .update({ current_conversations: agent.current_conversations + 1 })
        .eq('id', agent.id);
      // Update conversation with assigned agent
      await supabase
        .from('chat_conversations')
        .update({ 
          assigned_agent_id: assignedAgentId,
          status: 'active',
          customer_name: customerName,
          customer_email: customerEmail,
          priority: detectedPriority,
          is_vip: detectedVip
        })
        .eq('id', conversationId);
      // Add system message about agent assignment
      await supabase
        .from('chat_messages')
        .insert({
          conversation_id: conversationId,
          sender_type: 'system',
          message: `${agentName} has joined the conversation and will assist you shortly.`
        });
      console.log("[ASSIGN-CHAT-AGENT] Agent assigned:", agentName);
    } else {
      // No agents available, keep in waiting status
      await supabase
        .from('chat_conversations')
        .update({ 
          customer_name: customerName,
          customer_email: customerEmail,
          priority: detectedPriority,
          is_vip: detectedVip
        })
        .eq('id', conversationId);
      // Add system message about queue position
      await supabase
        .from('chat_messages')
        .insert({
          conversation_id: conversationId,
          sender_type: 'system',
          message: 'All our agents are currently busy. You are in the queue and will be connected shortly. Thank you for your patience!'
        });
      console.log("[ASSIGN-CHAT-AGENT] No agents available, conversation queued");
    }
    return new Response(
      JSON.stringify({ 
        success: true, 
        assignedAgentId,
        agentName,
        status: assignedAgentId ? 'active' : 'waiting'
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("[ASSIGN-CHAT-AGENT] Error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
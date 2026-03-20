import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
interface TransferChatRequest {
  conversationId: string;
  fromAgentId: string;
  toAgentId: string;
  transferNote?: string;
}
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    console.log("[TRANSFER-CHAT] Function started");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { conversationId, fromAgentId, toAgentId, transferNote }: TransferChatRequest = await req.json();
    console.log("[TRANSFER-CHAT] Transferring conversation:", conversationId, "from:", fromAgentId, "to:", toAgentId);
    // Get the new agent's details
    const { data: toAgent, error: agentError } = await supabase
      .from("support_agents")
      .select("*")
      .eq("user_id", toAgentId)
      .single();
    if (agentError || !toAgent) {
      console.error("[TRANSFER-CHAT] Agent not found:", agentError);
      throw new Error("Target agent not found");
    }
    // Check if agent is available and has capacity
    if (!toAgent.is_available || toAgent.current_conversations >= toAgent.max_conversations) {
      throw new Error("Target agent is not available or at capacity");
    }
    // Get the from agent's details
    const { data: fromAgent } = await supabase
      .from("support_agents")
      .select("display_name")
      .eq("user_id", fromAgentId)
      .single();
    // Update conversation to new agent
    const { error: updateError } = await supabase
      .from("chat_conversations")
      .update({
        assigned_agent_id: toAgentId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", conversationId);
    if (updateError) {
      console.error("[TRANSFER-CHAT] Update error:", updateError);
      throw updateError;
    }
    // Update agent conversation counts
    // Decrease count for previous agent
    await supabase
      .from("support_agents")
      .update({ current_conversations: Math.max(0, (fromAgent ? 1 : 0) - 1 + (await supabase.from("support_agents").select("current_conversations").eq("user_id", fromAgentId).single()).data?.current_conversations || 0) })
      .eq("user_id", fromAgentId);
    // Actually, let's do this properly
    const { data: fromAgentData } = await supabase
      .from("support_agents")
      .select("current_conversations")
      .eq("user_id", fromAgentId)
      .single();
    if (fromAgentData) {
      await supabase
        .from("support_agents")
        .update({ current_conversations: Math.max(0, fromAgentData.current_conversations - 1) })
        .eq("user_id", fromAgentId);
    }
    // Increase count for new agent
    await supabase
      .from("support_agents")
      .update({ current_conversations: toAgent.current_conversations + 1 })
      .eq("user_id", toAgentId);
    // Add system message about transfer
    let transferMessage = `This conversation has been transferred from ${fromAgent?.display_name || "another agent"} to ${toAgent.display_name}.`;
    if (transferNote) {
      transferMessage += `\n\nTransfer note: ${transferNote}`;
    }
    await supabase.from("chat_messages").insert({
      conversation_id: conversationId,
      sender_type: "system",
      message: transferMessage,
    });
    console.log("[TRANSFER-CHAT] Transfer completed successfully");
    return new Response(
      JSON.stringify({
        success: true,
        newAgentName: toAgent.display_name,
        newAgentId: toAgentId,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[TRANSFER-CHAT] Error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
interface ChatAIRequest {
  conversationId: string;
  message: string;
  conversationHistory?: Array<{ role: string; content: string }>;
}
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    console.log("[CHAT-AI-RESPONSE] Function started");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { conversationId, message, conversationHistory = [] }: ChatAIRequest = await req.json();
    console.log("[CHAT-AI-RESPONSE] Processing message for conversation:", conversationId);
    // Build conversation context
    const messages = [
      {
        role: "system",
        content: `You are a helpful customer support AI assistant for Lumière, a fine jewelry store. 
        
Your role:
- Answer questions about products, orders, shipping, returns, and general inquiries
- Be polite, professional, and helpful
- Keep responses concise but informative
- If you can't help with something, let the customer know an agent will assist them
- For specific order issues or complex problems, suggest waiting for a human agent
Store policies:
- Free shipping on orders over ₹5000
- 14-day return policy for unused items in original packaging
- Standard shipping takes 3-5 business days
- Express shipping available for 1-2 day delivery
- Custom jewelry orders take 2-3 weeks
Be warm and personable while maintaining professionalism. Always refer to the store as "Lumière".`
      },
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: "user", content: message }
    ];
    // Call Lovable AI Gateway
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
        max_tokens: 500,
      }),
    });
    if (!response.ok) {
      if (response.status === 429) {
        console.error("[CHAT-AI-RESPONSE] Rate limit exceeded");
        return new Response(
          JSON.stringify({ 
            error: "AI service is temporarily busy. Please try again in a moment.",
            fallback: true 
          }),
          { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      if (response.status === 402) {
        console.error("[CHAT-AI-RESPONSE] Payment required");
        return new Response(
          JSON.stringify({ 
            error: "AI service unavailable. An agent will assist you shortly.",
            fallback: true 
          }),
          { status: 402, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      const errorText = await response.text();
      console.error("[CHAT-AI-RESPONSE] AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }
    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || 
      "I apologize, but I couldn't process your request. An agent will assist you shortly.";
    console.log("[CHAT-AI-RESPONSE] AI response generated");
    // Save AI response to database
    await supabase.from("chat_messages").insert({
      conversation_id: conversationId,
      sender_type: "system",
      message: aiResponse,
    });
    return new Response(
      JSON.stringify({ 
        success: true, 
        response: aiResponse 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[CHAT-AI-RESPONSE] Error:", errorMessage);
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        fallback: true,
        response: "I apologize, but I'm having trouble right now. An agent will assist you shortly."
      }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
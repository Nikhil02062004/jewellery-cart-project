import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
interface SatisfactionAlertRequest {
  conversationId: string;
  rating: number;
  feedbackText?: string;
  agentId?: string;
}
function escapeHtml(text: string): string {
  if (!text || typeof text !== "string") return "";
  const htmlEntities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return text.replace(/[&<>"']/g, (char) => htmlEntities[char] || char);
}
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    console.log("[SEND-SATISFACTION-ALERT] Function started");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { conversationId, rating, feedbackText, agentId }: SatisfactionAlertRequest = await req.json();
    console.log("[SEND-SATISFACTION-ALERT] Processing rating:", rating, "for conversation:", conversationId);
    // Only alert for low ratings (1-2 stars)
    const LOW_RATING_THRESHOLD = 2;
    if (rating > LOW_RATING_THRESHOLD) {
      console.log("[SEND-SATISFACTION-ALERT] Rating above threshold, no alert needed");
      return new Response(
        JSON.stringify({ success: true, alerted: false }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    // Get agent details if available
    let agentName = "Unknown Agent";
    let agentEmail = null;
    
    if (agentId) {
      const { data: agent } = await supabase
        .from("support_agents")
        .select("display_name, email")
        .eq("user_id", agentId)
        .single();
      
      if (agent) {
        agentName = agent.display_name;
        agentEmail = agent.email;
      }
    }
    // Get conversation details
    const { data: conversation } = await supabase
      .from("chat_conversations")
      .select("customer_name, customer_email, created_at")
      .eq("id", conversationId)
      .single();
    // Save alert to database
    await supabase.from("satisfaction_alerts").insert({
      conversation_id: conversationId,
      agent_id: agentId,
      rating,
      threshold: LOW_RATING_THRESHOLD,
    });
    // Get admin emails (users with admin role)
    const { data: adminRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");
    // For now, we'll send to a generic support email
    // In production, you'd fetch admin emails from auth.users
    const adminEmails = ["onboarding@resend.dev"]; // Placeholder
    const safeFeedbackText = feedbackText ? escapeHtml(feedbackText) : "No additional feedback provided";
    const safeAgentName = escapeHtml(agentName);
    const safeConversationId = escapeHtml(conversationId.slice(0, 8).toUpperCase());
    const ratingStars = "★".repeat(rating) + "☆".repeat(5 - rating);
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Low Satisfaction Alert</title>
      </head>
      <body style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: #1a1a1a; padding: 30px; text-align: center;">
          <h1 style="color: #D4AF37; margin: 0; font-size: 28px;">LUMIÈRE</h1>
          <p style="color: #888; margin: 10px 0 0; font-size: 12px; letter-spacing: 2px;">CUSTOMER SATISFACTION ALERT</p>
        </div>
        
        <div style="background-color: #fff; padding: 30px;">
          <div style="background-color: #fee2e2; border: 1px solid #ef4444; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h2 style="color: #dc2626; margin: 0 0 10px;">⚠️ Low Satisfaction Rating Received</h2>
            <p style="color: #7f1d1d; margin: 0; font-size: 24px;">${ratingStars}</p>
            <p style="color: #7f1d1d; margin: 10px 0 0; font-size: 14px;">${rating} out of 5 stars</p>
          </div>
          
          <h3 style="color: #1a1a1a; border-bottom: 2px solid #D4AF37; padding-bottom: 10px;">Details</h3>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;"><strong>Conversation ID:</strong></td>
              <td style="padding: 10px 0; color: #1a1a1a; border-bottom: 1px solid #eee;">${safeConversationId}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;"><strong>Agent:</strong></td>
              <td style="padding: 10px 0; color: #1a1a1a; border-bottom: 1px solid #eee;">${safeAgentName}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;"><strong>Customer:</strong></td>
              <td style="padding: 10px 0; color: #1a1a1a; border-bottom: 1px solid #eee;">${conversation?.customer_name || "Anonymous"}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;"><strong>Date:</strong></td>
              <td style="padding: 10px 0; color: #1a1a1a; border-bottom: 1px solid #eee;">${new Date().toLocaleString()}</td>
            </tr>
          </table>
          
          <h3 style="color: #1a1a1a; border-bottom: 2px solid #D4AF37; padding-bottom: 10px; margin-top: 30px;">Customer Feedback</h3>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 4px; border-left: 4px solid #ef4444;">
            <p style="color: #666; margin: 0; font-style: italic;">"${safeFeedbackText}"</p>
          </div>
          
          <div style="margin-top: 30px; padding: 20px; background-color: #fef3c7; border-radius: 4px; text-align: center;">
            <p style="color: #92400e; margin: 0; font-size: 14px;">
              <strong>Action Required:</strong> Please review this conversation and follow up with the customer if needed.
            </p>
          </div>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #888; font-size: 12px;">
          <p>© 2024 Lumière Fine Jewelry. Customer Experience Team.</p>
        </div>
      </body>
      </html>
    `;
    const emailResponse = await resend.emails.send({
      from: "Lumière Support <onboarding@resend.dev>",
      to: adminEmails,
      subject: `⚠️ Low Satisfaction Alert - ${rating} Star Rating`,
      html: emailHtml,
    });
    console.log("[SEND-SATISFACTION-ALERT] Alert email sent:", emailResponse);
    // Also notify the agent directly if they have an email
    if (agentEmail) {
      await resend.emails.send({
        from: "Lumière Support <onboarding@resend.dev>",
        to: [agentEmail],
        subject: `Feedback Received - ${rating} Star Rating`,
        html: emailHtml.replace("Action Required:", "FYI:"),
      });
    }
    return new Response(
      JSON.stringify({ success: true, alerted: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[SEND-SATISFACTION-ALERT] Error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
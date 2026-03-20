import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotifyRequest {
  conversationId: string;
  customerName: string;
  customerEmail: string;
  messagePreview: string;
}

function escapeHtml(text: string): string {
  if (!text || typeof text !== 'string') return '';
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return text.replace(/[&<>"']/g, (char) => htmlEntities[char] || char);
}

const getAgentNotificationTemplate = (
  customerName: string,
  messagePreview: string,
  conversationId: string
) => {
  const safeCustomerName = escapeHtml(customerName);
  const safeMessagePreview = escapeHtml(messagePreview);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Support Message</title>
    </head>
    <body style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: #1a1a1a; padding: 30px; text-align: center;">
        <h1 style="color: #D4AF37; margin: 0; font-size: 28px;">LUMIÈRE</h1>
        <p style="color: #888; margin: 10px 0 0; font-size: 12px; letter-spacing: 2px;">SUPPORT CENTER</p>
      </div>
      
      <div style="background-color: #fff; padding: 30px;">
        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 20px;">
          <p style="margin: 0; color: #92400e; font-weight: bold;">🔔 New Support Message</p>
        </div>
        
        <h2 style="color: #1a1a1a; margin-top: 0;">New Message from Customer</h2>
        
        <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <p style="color: #666; margin: 0 0 10px; font-size: 14px;">
            <strong>Customer:</strong> ${safeCustomerName}
          </p>
          <p style="color: #666; margin: 0 0 10px; font-size: 14px;">
            <strong>Message Preview:</strong>
          </p>
          <div style="background-color: #fff; border: 1px solid #e5e7eb; border-radius: 4px; padding: 15px; margin-top: 10px;">
            <p style="color: #374151; margin: 0; font-style: italic;">"${safeMessagePreview}"</p>
          </div>
        </div>
        
        <p style="color: #666; line-height: 1.6;">
          A customer is waiting for your response. Please log in to the admin panel to respond.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://lumiere.com/admin/chat" style="background-color: #D4AF37; color: #1a1a1a; padding: 15px 40px; text-decoration: none; font-weight: bold; border-radius: 4px; display: inline-block;">Open Support Chat</a>
        </div>
        
        <p style="color: #888; text-align: center; font-size: 12px; margin-top: 30px;">
          Conversation ID: ${conversationId}
        </p>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #888; font-size: 12px;">
        <p>© 2024 Lumière Fine Jewelry - Support Team</p>
      </div>
    </body>
    </html>
  `;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversationId, customerName, customerEmail, messagePreview }: NotifyRequest = await req.json();

    console.log("[NOTIFY-NEW-MESSAGE] Processing notification for conversation:", conversationId);

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all available agents with emails
    const { data: agents, error: agentsError } = await supabase
      .from('support_agents')
      .select('email, display_name, is_available')
      .eq('is_available', true)
      .not('email', 'is', null);

    if (agentsError) {
      console.error("[NOTIFY-NEW-MESSAGE] Error fetching agents:", agentsError);
      throw agentsError;
    }

    if (!agents || agents.length === 0) {
      console.log("[NOTIFY-NEW-MESSAGE] No available agents with emails found");
      return new Response(JSON.stringify({ 
        success: true, 
        message: "No available agents to notify" 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`[NOTIFY-NEW-MESSAGE] Found ${agents.length} available agents to notify`);

    // Send email to all available agents
    const emailPromises = agents.map(async (agent) => {
      if (!agent.email) return null;

      try {
        const result = await resend.emails.send({
          from: "Lumière Support <onboarding@resend.dev>",
          to: [agent.email],
          subject: `🔔 New message from ${customerName || 'Customer'}`,
          html: getAgentNotificationTemplate(
            customerName || 'Anonymous Customer',
            messagePreview.substring(0, 200),
            conversationId
          ),
        });
        console.log(`[NOTIFY-NEW-MESSAGE] Email sent to ${agent.email}:`, result);
        return { email: agent.email, success: true };
      } catch (emailError) {
        console.error(`[NOTIFY-NEW-MESSAGE] Failed to send to ${agent.email}:`, emailError);
        return { email: agent.email, success: false, error: emailError };
      }
    });

    const results = await Promise.all(emailPromises);
    const successCount = results.filter(r => r?.success).length;

    console.log(`[NOTIFY-NEW-MESSAGE] Sent ${successCount}/${agents.length} notifications`);

    return new Response(JSON.stringify({ 
      success: true, 
      notifiedAgents: successCount 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("[NOTIFY-NEW-MESSAGE] Error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
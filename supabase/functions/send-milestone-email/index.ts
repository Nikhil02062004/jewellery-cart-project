import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface MilestoneEmailRequest {
  user_id: string;
  reel_id: string;
  milestone_type: string;
  milestone_value: number;
  reel_caption?: string;
}

const formatMilestoneValue = (value: number): string => {
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return value.toString();
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, reel_id, milestone_type, milestone_value, reel_caption }: MilestoneEmailRequest = await req.json();

    console.log(`Sending milestone email for user ${user_id}: ${milestone_type} = ${milestone_value}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user has email notifications enabled
    const { data: preferences } = await supabase
      .from("notification_preferences")
      .select("email_notifications")
      .eq("user_id", user_id)
      .single();

    if (preferences && preferences.email_notifications === false) {
      console.log("User has email notifications disabled");
      return new Response(
        JSON.stringify({ message: "Email notifications disabled" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get user email
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(user_id);
    
    if (userError || !userData?.user?.email) {
      console.error("Could not find user email:", userError);
      return new Response(
        JSON.stringify({ error: "User email not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const userEmail = userData.user.email;
    const userName = userData.user.user_metadata?.name || "Creator";
    const formattedValue = formatMilestoneValue(milestone_value);
    const icon = milestone_type === "views" ? "👁️" : "❤️";
    const reelName = reel_caption || "Your Jewelry Reel";

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.15);">
              
              <!-- Header -->
              <div style="text-align: center; padding: 40px 20px 20px;">
                <div style="font-size: 48px; margin-bottom: 10px;">${icon}</div>
                <h1 style="color: #D4AF37; font-size: 28px; margin: 0; font-weight: 600;">
                  Milestone Achieved!
                </h1>
              </div>
              
              <!-- Content -->
              <div style="padding: 20px 40px 40px;">
                <p style="color: #ffffff; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                  Hi ${userName},
                </p>
                <p style="color: #e0e0e0; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                  Congratulations! Your reel <strong style="color: #D4AF37;">"${reelName}"</strong> has reached an incredible milestone!
                </p>
                
                <!-- Milestone Badge -->
                <div style="background: linear-gradient(135deg, #D4AF37 0%, #F5E6A3 50%, #D4AF37 100%); border-radius: 12px; padding: 30px; text-align: center; margin: 0 0 30px;">
                  <p style="color: #1a1a2e; font-size: 42px; font-weight: bold; margin: 0;">
                    ${formattedValue}
                  </p>
                  <p style="color: #1a1a2e; font-size: 18px; margin: 10px 0 0; text-transform: uppercase; letter-spacing: 2px;">
                    ${milestone_type}
                  </p>
                </div>
                
                <p style="color: #e0e0e0; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                  Your jewelry content is resonating with our community! Keep creating amazing content to reach even more people.
                </p>
                
                <!-- CTA Button -->
                <div style="text-align: center;">
                  <a href="${Deno.env.get("SITE_URL") || "https://yoursite.lovable.app"}/my-reels" 
                     style="display: inline-block; background: linear-gradient(135deg, #D4AF37 0%, #F5E6A3 100%); color: #1a1a2e; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3);">
                    View Your Analytics
                  </a>
                </div>
              </div>
              
              <!-- Footer -->
              <div style="background: rgba(0,0,0,0.2); padding: 20px 40px; text-align: center;">
                <p style="color: #888; font-size: 14px; margin: 0;">
                  Keep shining! ✨
                </p>
                <p style="color: #666; font-size: 12px; margin: 10px 0 0;">
                  The Jewelry Store Team
                </p>
              </div>
            </div>
            
            <!-- Unsubscribe -->
            <p style="text-align: center; color: #888; font-size: 12px; margin: 20px 0 0;">
              You can manage your notification preferences in your account settings.
            </p>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "Jewelry Store <onboarding@resend.dev>",
      to: [userEmail],
      subject: `${icon} Your Reel Hit ${formattedValue} ${milestone_type}!`,
      html: htmlContent,
    });

    console.log("Milestone email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, data: emailResponse }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-milestone-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
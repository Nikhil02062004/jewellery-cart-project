import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ReelNotificationRequest {
  reel_id: string;
  status: "approved" | "rejected";
  user_id: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reel_id, status, user_id }: ReelNotificationRequest = await req.json();

    console.log(`Sending ${status} notification for reel ${reel_id} to user ${user_id}`);

    // Get user email from Supabase Auth
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(user_id);
    
    if (userError || !userData?.user?.email) {
      console.error("Could not find user email:", userError);
      return new Response(
        JSON.stringify({ error: "User email not found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const userEmail = userData.user.email;
    const userName = userData.user.user_metadata?.name || "Valued Customer";

    // Get reel details
    const { data: reelData } = await supabase
      .from("reels")
      .select("caption")
      .eq("id", reel_id)
      .single();

    const reelCaption = reelData?.caption || "your jewelry reel";

    const isApproved = status === "approved";
    const subject = isApproved
      ? "🎉 Your Reel Has Been Approved!"
      : "Update on Your Reel Submission";

    const htmlContent = isApproved
      ? `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #D4AF37; text-align: center;">Great News! 🎉</h1>
          <p>Hi ${userName},</p>
          <p>We're excited to let you know that your jewelry reel <strong>"${reelCaption}"</strong> has been <span style="color: #22c55e; font-weight: bold;">approved</span> and is now live on our platform!</p>
          <p>Your beautiful jewelry is now visible to all our visitors. Thank you for sharing your stunning pieces with our community!</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", ".lovable.app")}/reels" style="background-color: #D4AF37; color: #1a1a1a; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">View Your Reel</a>
          </div>
          <p>Keep sharing more amazing jewelry content!</p>
          <p>Best regards,<br>The Jewelry Store Team</p>
        </div>
      `
      : `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #666; text-align: center;">Reel Submission Update</h1>
          <p>Hi ${userName},</p>
          <p>Thank you for submitting your jewelry reel <strong>"${reelCaption}"</strong>.</p>
          <p>After review, we regret to inform you that your reel could not be approved at this time. This may be due to:</p>
          <ul style="color: #666;">
            <li>Content quality guidelines</li>
            <li>The video doesn't feature jewelry items</li>
            <li>Technical issues with the video</li>
          </ul>
          <p>We encourage you to submit another reel that showcases your beautiful jewelry pieces. Make sure the jewelry is clearly visible and the video quality is good!</p>
          <p>If you have any questions, feel free to contact us.</p>
          <p>Best regards,<br>The Jewelry Store Team</p>
        </div>
      `;

    const emailResponse = await resend.emails.send({
      from: "Jewelry Store <onboarding@resend.dev>",
      to: [userEmail],
      subject: subject,
      html: htmlContent,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-reel-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);

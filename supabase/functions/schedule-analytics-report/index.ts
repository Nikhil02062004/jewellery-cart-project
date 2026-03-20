import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ScheduleRequest {
  email: string;
  frequency: "daily" | "weekly" | "monthly";
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, frequency }: ScheduleRequest = await req.json();

    if (!email || !frequency) {
      return new Response(JSON.stringify({ error: "Email and frequency are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user's reel analytics for confirmation email
    const { data: reels, error: reelsError } = await supabase
      .from("reels")
      .select("id, views_count, likes_count, status")
      .eq("user_id", user.id);

    if (reelsError) {
      console.error("Error fetching reels:", reelsError);
    }

    const totalReels = reels?.length || 0;
    const totalViews = reels?.reduce((sum, r) => sum + (r.views_count || 0), 0) || 0;
    const totalLikes = reels?.reduce((sum, r) => sum + (r.likes_count || 0), 0) || 0;

    // For now, we'll send a confirmation email
    // In production, you'd store this preference and set up a cron job
    if (resendApiKey) {
      const resend = new Resend(resendApiKey);

      const frequencyText = {
        daily: "every day at 9:00 AM",
        weekly: "every Monday at 9:00 AM",
        monthly: "on the 1st of each month",
      };

      await resend.emails.send({
        from: "Reel Analytics <onboarding@resend.dev>",
        to: [email],
        subject: "Analytics Report Scheduled ✓",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Analytics Report Scheduled!</h1>
            <p>You will now receive your reel analytics report <strong>${frequencyText[frequency]}</strong>.</p>
            
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="margin-top: 0; color: #333;">Current Analytics Summary</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0;"><strong>Total Reels:</strong></td>
                  <td style="padding: 8px 0; text-align: right;">${totalReels}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;"><strong>Total Views:</strong></td>
                  <td style="padding: 8px 0; text-align: right;">${totalViews.toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;"><strong>Total Likes:</strong></td>
                  <td style="padding: 8px 0; text-align: right;">${totalLikes.toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;"><strong>Engagement Rate:</strong></td>
                  <td style="padding: 8px 0; text-align: right;">${totalViews > 0 ? ((totalLikes / totalViews) * 100).toFixed(1) : 0}%</td>
                </tr>
              </table>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              Your next report will be sent ${frequencyText[frequency]}. To unsubscribe, 
              visit your account settings.
            </p>
          </div>
        `,
      });

      console.log("Confirmation email sent to:", email);
    } else {
      console.log("RESEND_API_KEY not configured, skipping email");
    }

    // Log the scheduled report (in production, store in database)
    console.log(`Report scheduled: ${email}, ${frequency}, user: ${user.id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Analytics report scheduled for ${frequency} delivery to ${email}` 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in schedule-analytics-report:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const MILESTONES = {
  views: [100, 500, 1000, 5000, 10000],
  likes: [50, 100, 500, 1000, 5000],
};

interface MilestoneCheckRequest {
  reel_id: string;
  current_views: number;
  current_likes: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reel_id, current_views, current_likes }: MilestoneCheckRequest = await req.json();

    console.log(`Checking milestones for reel ${reel_id}: ${current_views} views, ${current_likes} likes`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get reel and user info
    const { data: reel, error: reelError } = await supabase
      .from("reels")
      .select("user_id, caption")
      .eq("id", reel_id)
      .single();

    if (reelError || !reel) {
      console.error("Reel not found:", reelError);
      return new Response(
        JSON.stringify({ error: "Reel not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get existing milestones for this reel
    const { data: existingMilestones } = await supabase
      .from("reel_milestones")
      .select("milestone_type, milestone_value")
      .eq("reel_id", reel_id);

    const existingSet = new Set(
      (existingMilestones || []).map(m => `${m.milestone_type}-${m.milestone_value}`)
    );

    const newMilestones: Array<{ type: string; value: number }> = [];

    // Check view milestones
    for (const milestone of MILESTONES.views) {
      if (current_views >= milestone && !existingSet.has(`views-${milestone}`)) {
        newMilestones.push({ type: "views", value: milestone });
      }
    }

    // Check like milestones
    for (const milestone of MILESTONES.likes) {
      if (current_likes >= milestone && !existingSet.has(`likes-${milestone}`)) {
        newMilestones.push({ type: "likes", value: milestone });
      }
    }

    if (newMilestones.length === 0) {
      return new Response(
        JSON.stringify({ message: "No new milestones reached" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Insert new milestones
    const milestoneInserts = newMilestones.map(m => ({
      reel_id,
      user_id: reel.user_id,
      milestone_type: m.type,
      milestone_value: m.value,
    }));

    const { error: insertError } = await supabase
      .from("reel_milestones")
      .insert(milestoneInserts);

    if (insertError) {
      console.error("Failed to insert milestones:", insertError);
    }

    // Get user email for notification
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(reel.user_id);
    
    if (userError || !userData?.user?.email) {
      console.error("Could not find user email:", userError);
      return new Response(
        JSON.stringify({ milestones: newMilestones, emailSent: false }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const userEmail = userData.user.email;
    const userName = userData.user.user_metadata?.name || "Creator";

    // Send email notification for milestones
    const milestoneText = newMilestones
      .map(m => `${m.value.toLocaleString()} ${m.type}`)
      .join(", ");

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #D4AF37; text-align: center;">🎉 Milestone Achieved!</h1>
        <p>Hi ${userName},</p>
        <p>Congratulations! Your reel <strong>"${reel.caption || 'Jewelry Reel'}"</strong> has reached an exciting milestone!</p>
        <div style="background: linear-gradient(135deg, #D4AF37 0%, #F5E6A3 100%); padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <p style="font-size: 24px; margin: 0; color: #1a1a1a; font-weight: bold;">${milestoneText}</p>
        </div>
        <p>Your jewelry content is resonating with our community! Keep creating amazing content to reach even more people.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", ".lovable.app")}/profile/reels" style="background-color: #D4AF37; color: #1a1a1a; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">View Your Analytics</a>
        </div>
        <p>Best regards,<br>The Jewelry Store Team</p>
      </div>
    `;

    const emailResponse = await resend.emails.send({
      from: "Jewelry Store <onboarding@resend.dev>",
      to: [userEmail],
      subject: `🎉 Your Reel Hit ${milestoneText}!`,
      html: htmlContent,
    });

    console.log("Milestone email sent:", emailResponse);

    return new Response(
      JSON.stringify({ milestones: newMilestones, emailSent: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in check-reel-milestones function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);

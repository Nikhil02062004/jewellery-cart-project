import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[PUBLISH-SCHEDULED-REELS] Starting scheduled reel check...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find all reels that are scheduled and past their scheduled time
    const now = new Date().toISOString();
    
    const { data: scheduledReels, error: fetchError } = await supabase
      .from("reels")
      .select("id, caption, user_id, scheduled_at")
      .eq("status", "scheduled")
      .lte("scheduled_at", now);

    if (fetchError) {
      console.error("[PUBLISH-SCHEDULED-REELS] Error fetching reels:", fetchError);
      throw fetchError;
    }

    if (!scheduledReels || scheduledReels.length === 0) {
      console.log("[PUBLISH-SCHEDULED-REELS] No scheduled reels to publish");
      return new Response(
        JSON.stringify({ message: "No reels to publish", count: 0 }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`[PUBLISH-SCHEDULED-REELS] Found ${scheduledReels.length} reels to publish`);

    // Update all scheduled reels to approved
    const reelIds = scheduledReels.map((r) => r.id);
    
    const { error: updateError } = await supabase
      .from("reels")
      .update({ status: "approved" })
      .in("id", reelIds);

    if (updateError) {
      console.error("[PUBLISH-SCHEDULED-REELS] Error updating reels:", updateError);
      throw updateError;
    }

    console.log(`[PUBLISH-SCHEDULED-REELS] Successfully published ${reelIds.length} reels`);

    // Optionally send notifications to users
    for (const reel of scheduledReels) {
      try {
        // Try to send email notification
        const response = await fetch(`${supabaseUrl}/functions/v1/send-reel-notification`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            reel_id: reel.id,
            status: "approved",
            user_id: reel.user_id,
          }),
        });
        
        if (!response.ok) {
          console.warn(`[PUBLISH-SCHEDULED-REELS] Failed to send notification for reel ${reel.id}`);
        }
      } catch (notifError) {
        console.warn(`[PUBLISH-SCHEDULED-REELS] Notification error for reel ${reel.id}:`, notifError);
      }
    }

    return new Response(
      JSON.stringify({
        message: "Scheduled reels published successfully",
        count: reelIds.length,
        reelIds,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("[PUBLISH-SCHEDULED-REELS] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});

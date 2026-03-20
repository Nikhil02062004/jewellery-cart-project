import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AutoArchiveRequest {
  days_old?: number;
  min_views_threshold?: number;
  min_likes_threshold?: number;
  dry_run?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      days_old = 90, 
      min_views_threshold = 10, 
      min_likes_threshold = 5,
      dry_run = false 
    }: AutoArchiveRequest = await req.json();

    console.log(`Auto-archiving reels: older than ${days_old} days OR (views < ${min_views_threshold} AND likes < ${min_likes_threshold}). Dry run: ${dry_run}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days_old);

    // Find reels that should be archived:
    // 1. Older than X days with low engagement
    // 2. Or very old reels regardless of engagement
    const { data: reelsToArchive, error: fetchError } = await supabase
      .from("reels")
      .select("id, caption, views_count, likes_count, created_at, user_id")
      .eq("is_archived", false)
      .eq("status", "approved")
      .or(`created_at.lt.${cutoffDate.toISOString()},and(views_count.lt.${min_views_threshold},likes_count.lt.${min_likes_threshold})`);

    if (fetchError) {
      console.error("Error fetching reels:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch reels" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Filter further: only archive if both conditions met for low engagement
    const filtered = (reelsToArchive || []).filter(reel => {
      const isOld = new Date(reel.created_at) < cutoffDate;
      const hasLowEngagement = (reel.views_count || 0) < min_views_threshold && (reel.likes_count || 0) < min_likes_threshold;
      
      // Archive if: very old (>180 days) OR (old AND low engagement)
      const veryOldDate = new Date();
      veryOldDate.setDate(veryOldDate.getDate() - 180);
      const isVeryOld = new Date(reel.created_at) < veryOldDate;
      
      return isVeryOld || (isOld && hasLowEngagement);
    });

    console.log(`Found ${filtered.length} reels to archive`);

    if (dry_run) {
      return new Response(
        JSON.stringify({ 
          dry_run: true,
          reels_to_archive: filtered.length,
          reels: filtered.map(r => ({
            id: r.id,
            caption: r.caption,
            views: r.views_count,
            likes: r.likes_count,
            created_at: r.created_at
          }))
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (filtered.length === 0) {
      return new Response(
        JSON.stringify({ message: "No reels to archive", archived_count: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Archive the reels
    const reelIds = filtered.map(r => r.id);
    const { error: updateError } = await supabase
      .from("reels")
      .update({ is_archived: true, updated_at: new Date().toISOString() })
      .in("id", reelIds);

    if (updateError) {
      console.error("Error archiving reels:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to archive reels" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Successfully archived ${filtered.length} reels`);

    return new Response(
      JSON.stringify({ 
        message: "Reels archived successfully",
        archived_count: filtered.length,
        archived_reel_ids: reelIds
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in auto-archive-reels function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TROY_OZ_TO_GRAMS = 31.1035;

// Fallback USD to INR rate if API fails
const FALLBACK_USD_INR = 83.5;

async function fetchUsdInrRate(): Promise<number> {
  try {
    // Use a free currency API
    const res = await fetch("https://open.er-api.com/v6/latest/USD");
    if (res.ok) {
      const data = await res.json();
      return data.rates?.INR || FALLBACK_USD_INR;
    }
  } catch (e) {
    console.error("[METAL-PRICES] USD/INR fetch failed:", e);
  }
  return FALLBACK_USD_INR;
}

async function fetchGoldPriceUsd(): Promise<number | null> {
  try {
    const res = await fetch("https://freegoldapi.com/data/latest.json");
    if (res.ok) {
      const data = await res.json();
      // Latest entry is the last item
      if (Array.isArray(data) && data.length > 0) {
        const latest = data[data.length - 1];
        return latest.price || null;
      }
    }
  } catch (e) {
    console.error("[METAL-PRICES] Gold price fetch failed:", e);
  }
  return null;
}

async function fetchSilverPriceUsd(): Promise<number | null> {
  try {
    // Use gold/silver ratio from freegoldapi to derive silver price
    const ratioRes = await fetch("https://freegoldapi.com/data/gold_silver_ratio_enriched.json");
    if (ratioRes.ok) {
      const ratioData = await ratioRes.json();
      if (Array.isArray(ratioData) && ratioData.length > 0) {
        const latestRatio = ratioData[ratioData.length - 1];
        const goldPrice = await fetchGoldPriceUsd();
        if (goldPrice && latestRatio.silver_oz_per_gold_oz) {
          return goldPrice / latestRatio.silver_oz_per_gold_oz;
        }
      }
    }
  } catch (e) {
    console.error("[METAL-PRICES] Silver price fetch failed:", e);
  }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if we have recent rates (within last 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data: cachedGold } = await supabase
      .from("metal_rates")
      .select("*")
      .eq("metal", "gold")
      .gte("fetched_at", oneHourAgo)
      .order("fetched_at", { ascending: false })
      .limit(1)
      .single();

    const { data: cachedSilver } = await supabase
      .from("metal_rates")
      .select("*")
      .eq("metal", "silver")
      .gte("fetched_at", oneHourAgo)
      .order("fetched_at", { ascending: false })
      .limit(1)
      .single();

    if (cachedGold && cachedSilver) {
      console.log("[METAL-PRICES] Returning cached rates");
      return new Response(
        JSON.stringify({
          gold: { rate_per_gram_inr: Number(cachedGold.rate_per_gram_inr), fetched_at: cachedGold.fetched_at },
          silver: { rate_per_gram_inr: Number(cachedSilver.rate_per_gram_inr), fetched_at: cachedSilver.fetched_at },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch fresh rates
    console.log("[METAL-PRICES] Fetching fresh rates...");
    const [goldPriceUsd, usdInr] = await Promise.all([
      fetchGoldPriceUsd(),
      fetchUsdInrRate(),
    ]);

    if (!goldPriceUsd) {
      throw new Error("Could not fetch gold price");
    }

    // Calculate silver from ratio
    let silverPriceUsd: number | null = null;
    try {
      const ratioRes = await fetch("https://freegoldapi.com/data/gold_silver_ratio_enriched.json");
      if (ratioRes.ok) {
        const ratioData = await ratioRes.json();
        if (Array.isArray(ratioData) && ratioData.length > 0) {
          const latestRatio = ratioData[ratioData.length - 1];
          if (latestRatio.silver_oz_per_gold_oz) {
            silverPriceUsd = goldPriceUsd / latestRatio.silver_oz_per_gold_oz;
          }
        }
      }
    } catch (e) {
      console.error("[METAL-PRICES] Ratio fetch failed:", e);
    }

    // Fallback silver estimate if ratio fails (~80:1 ratio)
    if (!silverPriceUsd) {
      silverPriceUsd = goldPriceUsd / 80;
    }

    const goldPerGramInr = (goldPriceUsd / TROY_OZ_TO_GRAMS) * usdInr;
    const silverPerGramInr = (silverPriceUsd / TROY_OZ_TO_GRAMS) * usdInr;

    // Cache the rates
    const now = new Date().toISOString();
    await supabase.from("metal_rates").insert([
      {
        metal: "gold",
        rate_per_gram_inr: Math.round(goldPerGramInr * 100) / 100,
        rate_per_oz_usd: goldPriceUsd,
        usd_inr_rate: usdInr,
        fetched_at: now,
      },
      {
        metal: "silver",
        rate_per_gram_inr: Math.round(silverPerGramInr * 100) / 100,
        rate_per_oz_usd: silverPriceUsd,
        usd_inr_rate: usdInr,
        fetched_at: now,
      },
    ]);

    console.log("[METAL-PRICES] Gold:", goldPerGramInr, "INR/g, Silver:", silverPerGramInr, "INR/g");

    return new Response(
      JSON.stringify({
        gold: { rate_per_gram_inr: Math.round(goldPerGramInr * 100) / 100, fetched_at: now },
        silver: { rate_per_gram_inr: Math.round(silverPerGramInr * 100) / 100, fetched_at: now },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[METAL-PRICES] Error:", msg);

    // Return fallback rates on error
    return new Response(
      JSON.stringify({
        error: msg,
        gold: { rate_per_gram_inr: null, fetched_at: null },
        silver: { rate_per_gram_inr: null, fetched_at: null },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

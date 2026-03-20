import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
interface LowStockProduct {
  id: string;
  name: string;
  stock_quantity: number;
  low_stock_threshold: number;
  category: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get admin email from request body or use default
    const { adminEmail } = await req.json().catch(() => ({ adminEmail: null }));

    // Find products where stock_quantity <= low_stock_threshold
    const { data: lowStockProducts, error } = await supabase
      .from("products")
      .select("id, name, stock_quantity, low_stock_threshold, category")
      .lte("stock_quantity", supabase.rpc("get_threshold_value"));

    // Alternative approach - get all products and filter
    const { data: allProducts, error: allError } = await supabase
      .from("products")
      .select("id, name, stock_quantity, low_stock_threshold, category");

    if (allError) {
      throw allError;
    }

    const lowStock = allProducts?.filter(
      (p: LowStockProduct) => p.stock_quantity <= p.low_stock_threshold
    ) || [];

    if (lowStock.length === 0) {
      console.log("No low stock products found");
      return new Response(
        JSON.stringify({ message: "No low stock products", count: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Found ${lowStock.length} low stock products`);

    // Build email content
    const productList = lowStock
      .map((p: LowStockProduct) => 
        `• ${p.name} (${p.category}): ${p.stock_quantity} remaining (threshold: ${p.low_stock_threshold})`
      )
      .join("\n");

    const targetEmail = adminEmail || "admin@jewels.com";

    const emailResponse = await resend.emails.send({
      from: "Jewels Store <onboarding@resend.dev>",
      to: [targetEmail],
      subject: `⚠️ Low Stock Alert: ${lowStock.length} products need restocking`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #B8860B; border-bottom: 2px solid #B8860B; padding-bottom: 10px;">
            Low Stock Alert
          </h1>
          <p>The following products are running low on stock:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background-color: #f8f8f8;">
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Product</th>
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Category</th>
                <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Stock</th>
                <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Threshold</th>
              </tr>
            </thead>
            <tbody>
              ${lowStock.map((p: LowStockProduct) => `
                <tr>
                  <td style="padding: 10px; border: 1px solid #ddd;">${p.name}</td>
                  <td style="padding: 10px; border: 1px solid #ddd; text-transform: capitalize;">${p.category}</td>
                  <td style="padding: 10px; text-align: center; border: 1px solid #ddd; color: ${p.stock_quantity === 0 ? 'red' : 'orange'}; font-weight: bold;">
                    ${p.stock_quantity}
                  </td>
                  <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">${p.low_stock_threshold}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <p style="color: #666;">
            Please restock these items as soon as possible to avoid stockouts.
          </p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            This is an automated message from Jewels Store inventory system.
          </p>
        </div>
      `,
    });

    console.log("Low stock alert email sent:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Alert sent for ${lowStock.length} products`,
        products: lowStock
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in low-stock-alert:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);

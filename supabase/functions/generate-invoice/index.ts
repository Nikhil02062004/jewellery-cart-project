import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  items: OrderItem[];
  total_amount: number;
  status: string;
  created_at: string;
  user_id: string | null;
}

// HTML escape function to prevent XSS in invoice templates
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

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId } = await req.json();
    
    if (!orderId) {
      throw new Error("Order ID is required");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Get the authorization header from the request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - No authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create Supabase client with user's auth context
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized - Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Fetch order - RLS will automatically enforce access control
    // Users can only see their own orders, admins can see all
    const { data: order, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .maybeSingle();

    if (error) {
      console.error("Database error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to fetch order" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!order) {
      return new Response(
        JSON.stringify({ error: "Order not found or access denied" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const orderData = order as Order;
    const invoiceNumber = `INV-${orderData.id.slice(0, 8).toUpperCase()}`;
    const orderDate = new Date(orderData.created_at).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Generate HTML invoice
    const invoiceHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice ${invoiceNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; padding: 20px; }
    .invoice { max-width: 800px; margin: 0 auto; background: white; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 3px solid #B8860B; padding-bottom: 20px; }
    .logo { font-size: 32px; font-weight: bold; color: #B8860B; }
    .invoice-title { text-align: right; }
    .invoice-title h1 { font-size: 28px; color: #333; }
    .invoice-title p { color: #666; margin-top: 5px; }
    .details { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .details-section { flex: 1; }
    .details-section h3 { color: #B8860B; margin-bottom: 10px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }
    .details-section p { color: #333; line-height: 1.6; }
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    .items-table th { background: #333; color: white; padding: 12px; text-align: left; font-weight: 500; }
    .items-table td { padding: 12px; border-bottom: 1px solid #eee; }
    .items-table tr:hover { background: #f9f9f9; }
    .text-right { text-align: right; }
    .totals { margin-left: auto; width: 300px; }
    .totals-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
    .totals-row.grand-total { border-bottom: none; border-top: 2px solid #B8860B; margin-top: 10px; padding-top: 15px; font-size: 18px; font-weight: bold; color: #B8860B; }
    .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; text-transform: capitalize; }
    .status-paid { background: #d4edda; color: #155724; }
    .status-pending { background: #fff3cd; color: #856404; }
    .status-processing { background: #cce5ff; color: #004085; }
    .status-shipped { background: #e2d4f0; color: #563d7c; }
    .status-delivered { background: #d4edda; color: #155724; }
    @media print {
      body { background: white; padding: 0; }
      .invoice { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      <div class="logo">💎 JEWELS</div>
      <div class="invoice-title">
        <h1>INVOICE</h1>
        <p>${escapeHtml(invoiceNumber)}</p>
        <p style="margin-top: 10px;"><span class="status-badge status-${escapeHtml(orderData.status)}">${escapeHtml(orderData.status)}</span></p>
      </div>
    </div>
    
    <div class="details">
      <div class="details-section">
        <h3>Bill To</h3>
        <p><strong>${escapeHtml(orderData.customer_name)}</strong></p>
        <p>${escapeHtml(orderData.customer_email)}</p>
        ${orderData.customer_phone ? `<p>${escapeHtml(orderData.customer_phone)}</p>` : ''}
        ${orderData.customer_address ? `<p>${escapeHtml(orderData.customer_address)}</p>` : ''}
      </div>
      <div class="details-section" style="text-align: right;">
        <h3>Invoice Details</h3>
        <p><strong>Invoice Date:</strong> ${escapeHtml(orderDate)}</p>
        <p><strong>Order ID:</strong> ${escapeHtml(orderData.id.slice(0, 8))}</p>
      </div>
    </div>
    
    <table class="items-table">
      <thead>
        <tr>
          <th>Item</th>
          <th class="text-right">Price</th>
          <th class="text-right">Qty</th>
          <th class="text-right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${(orderData.items as OrderItem[]).map(item => `
          <tr>
            <td>${escapeHtml(item.name)}</td>
            <td class="text-right">₹${Number(item.price).toLocaleString()}</td>
            <td class="text-right">${Number(item.quantity)}</td>
            <td class="text-right">₹${(Number(item.price) * Number(item.quantity)).toLocaleString()}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    
    <div class="totals">
      <div class="totals-row">
        <span>Subtotal</span>
        <span>₹${orderData.total_amount.toLocaleString()}</span>
      </div>
      <div class="totals-row">
        <span>Shipping</span>
        <span>Free</span>
      </div>
      <div class="totals-row grand-total">
        <span>Total</span>
        <span>₹${orderData.total_amount.toLocaleString()}</span>
      </div>
    </div>
    
    <div class="footer">
      <p>Thank you for shopping with Jewels!</p>
      <p style="margin-top: 10px;">For any queries, please contact us at support@jewels.com</p>
    </div>
  </div>
</body>
</html>
    `;

    return new Response(invoiceHtml, {
      status: 200,
      headers: { 
        "Content-Type": "text/html",
        ...corsHeaders 
      },
    });
  } catch (error: any) {
    console.error("Error generating invoice:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);

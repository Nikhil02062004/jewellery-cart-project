import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderEmailRequest {
  orderId: string;
  customerName: string;
  customerEmail: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  shippingAddress: string;
}

// HTML escape function to prevent XSS in email templates
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[SEND-ORDER-EMAIL] Function started");

    const { orderId, customerName, customerEmail, items, totalAmount, shippingAddress }: OrderEmailRequest = await req.json();

    console.log("[SEND-ORDER-EMAIL] Sending email for order:", orderId);

    // Escape all user-provided content to prevent XSS
    const safeCustomerName = escapeHtml(customerName);
    const safeOrderId = escapeHtml(orderId);
    const safeShippingAddress = escapeHtml(shippingAddress);

    const itemsHtml = items.map(item => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">${escapeHtml(item.name)}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${Number(item.quantity)}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">₹${Number(item.price * item.quantity).toLocaleString()}</td>
      </tr>
    `).join('');

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Order Confirmation</title>
      </head>
      <body style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: #1a1a1a; padding: 30px; text-align: center;">
          <h1 style="color: #D4AF37; margin: 0; font-size: 28px;">LUMIÈRE</h1>
          <p style="color: #888; margin: 10px 0 0; font-size: 12px; letter-spacing: 2px;">FINE JEWELRY</p>
        </div>
        
        <div style="background-color: #fff; padding: 30px;">
          <h2 style="color: #1a1a1a; margin-top: 0;">Thank You for Your Order!</h2>
          <p style="color: #666; line-height: 1.6;">
            Dear ${safeCustomerName},<br><br>
            We're thrilled to confirm your order. Your exquisite jewelry pieces are being carefully prepared for shipment.
          </p>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <p style="margin: 0; color: #666;"><strong>Order ID:</strong> ${safeOrderId.slice(0, 8).toUpperCase()}</p>
          </div>
          
          <h3 style="color: #1a1a1a; border-bottom: 2px solid #D4AF37; padding-bottom: 10px;">Order Details</h3>
          
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f5f5f5;">
                <th style="padding: 12px; text-align: left; color: #666;">Item</th>
                <th style="padding: 12px; text-align: center; color: #666;">Qty</th>
                <th style="padding: 12px; text-align: right; color: #666;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2" style="padding: 15px 12px; text-align: right; font-weight: bold; color: #1a1a1a;">Total:</td>
                <td style="padding: 15px 12px; text-align: right; font-weight: bold; color: #D4AF37; font-size: 18px;">₹${Number(totalAmount).toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
          
          <h3 style="color: #1a1a1a; border-bottom: 2px solid #D4AF37; padding-bottom: 10px; margin-top: 30px;">Shipping Address</h3>
          <p style="color: #666; line-height: 1.6;">${safeShippingAddress}</p>
          
          <div style="margin-top: 30px; padding: 20px; background-color: #f5f5f5; border-radius: 4px; text-align: center;">
            <p style="color: #666; margin: 0; font-size: 14px;">
              Questions about your order? Contact us at<br>
              <a href="mailto:support@lumiere.com" style="color: #D4AF37;">support@lumiere.com</a>
            </p>
          </div>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #888; font-size: 12px;">
          <p>© 2024 Lumière Fine Jewelry. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "Lumière Jewelry <onboarding@resend.dev>",
      to: [customerEmail],
      subject: `Order Confirmed - ${safeOrderId.slice(0, 8).toUpperCase()}`,
      html: emailHtml,
    });

    console.log("[SEND-ORDER-EMAIL] Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailId: emailResponse.data?.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("[SEND-ORDER-EMAIL] Error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});

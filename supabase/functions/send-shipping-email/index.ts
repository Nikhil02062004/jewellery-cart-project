import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
interface ShippingEmailRequest {
  orderId: string;
  customerName: string;
  customerEmail: string;
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: string;
  status: 'shipped' | 'out_for_delivery' | 'delivered';
  shippingAddress: string;
}
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
const statusMessages = {
  shipped: {
    title: "Your Order Has Shipped! 📦",
    message: "Great news! Your order is on its way to you.",
    icon: "📦"
  },
  out_for_delivery: {
    title: "Out for Delivery Today! 🚚",
    message: "Your package is out for delivery and will arrive today!",
    icon: "🚚"
  },
  delivered: {
    title: "Your Order Has Been Delivered! ✨",
    message: "Your beautiful jewelry has arrived! We hope you love it.",
    icon: "✨"
  }
};
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    console.log("[SEND-SHIPPING-EMAIL] Function started");
    const { 
      orderId, 
      customerName, 
      customerEmail, 
      trackingNumber, 
      carrier,
      estimatedDelivery,
      status,
      shippingAddress 
    }: ShippingEmailRequest = await req.json();
    console.log("[SEND-SHIPPING-EMAIL] Sending email for order:", orderId, "status:", status);
    const safeCustomerName = escapeHtml(customerName);
    const safeOrderId = escapeHtml(orderId);
    const safeTrackingNumber = escapeHtml(trackingNumber || '');
    const safeCarrier = escapeHtml(carrier || 'Standard Shipping');
    const safeEstimatedDelivery = escapeHtml(estimatedDelivery || 'Within 5-7 business days');
    const safeShippingAddress = escapeHtml(shippingAddress);
    const statusInfo = statusMessages[status] || statusMessages.shipped;
    const trackingSection = trackingNumber ? `
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #1a1a1a; margin: 0 0 15px;">Tracking Information</h3>
        <table style="width: 100%;">
          <tr>
            <td style="color: #666; padding: 5px 0;">Tracking Number:</td>
            <td style="color: #1a1a1a; font-weight: bold;">${safeTrackingNumber}</td>
          </tr>
          <tr>
            <td style="color: #666; padding: 5px 0;">Carrier:</td>
            <td style="color: #1a1a1a;">${safeCarrier}</td>
          </tr>
          <tr>
            <td style="color: #666; padding: 5px 0;">Estimated Delivery:</td>
            <td style="color: #D4AF37; font-weight: bold;">${safeEstimatedDelivery}</td>
          </tr>
        </table>
      </div>
    ` : '';
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Shipping Update</title>
      </head>
      <body style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: #1a1a1a; padding: 30px; text-align: center;">
          <h1 style="color: #D4AF37; margin: 0; font-size: 28px;">LUMIÈRE</h1>
          <p style="color: #888; margin: 10px 0 0; font-size: 12px; letter-spacing: 2px;">FINE JEWELRY</p>
        </div>
        
        <div style="background-color: #fff; padding: 30px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <span style="font-size: 48px;">${statusInfo.icon}</span>
            <h2 style="color: #1a1a1a; margin: 15px 0 5px;">${statusInfo.title}</h2>
            <p style="color: #666; margin: 0;">${statusInfo.message}</p>
          </div>
          
          <p style="color: #666; line-height: 1.6;">
            Dear ${safeCustomerName},<br><br>
            We're writing to update you about your order <strong>${safeOrderId.slice(0, 8).toUpperCase()}</strong>.
          </p>
          
          ${trackingSection}
          
          <h3 style="color: #1a1a1a; border-bottom: 2px solid #D4AF37; padding-bottom: 10px; margin-top: 30px;">Delivery Address</h3>
          <p style="color: #666; line-height: 1.6;">${safeShippingAddress}</p>
          
          ${status !== 'delivered' ? `
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://yourstore.com/track-order" style="display: inline-block; background-color: #D4AF37; color: #1a1a1a; padding: 15px 30px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Track Your Order
            </a>
          </div>
          ` : `
          <div style="background-color: #f0f9f0; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <p style="color: #2d862d; margin: 0; font-size: 16px;">
              We'd love to hear about your experience!<br>
              <a href="https://yourstore.com/review" style="color: #D4AF37;">Leave a Review</a>
            </p>
          </div>
          `}
          
          <div style="margin-top: 30px; padding: 20px; background-color: #f5f5f5; border-radius: 4px; text-align: center;">
            <p style="color: #666; margin: 0; font-size: 14px;">
              Questions about your delivery?<br>
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
    const subjectMap = {
      shipped: `Your Order Has Shipped - ${safeOrderId.slice(0, 8).toUpperCase()}`,
      out_for_delivery: `Out for Delivery Today - ${safeOrderId.slice(0, 8).toUpperCase()}`,
      delivered: `Order Delivered - ${safeOrderId.slice(0, 8).toUpperCase()}`
    };
    const emailResponse = await resend.emails.send({
      from: "Lumière Jewelry <onboarding@resend.dev>",
      to: [customerEmail],
      subject: subjectMap[status] || subjectMap.shipped,
      html: emailHtml,
    });
    console.log("[SEND-SHIPPING-EMAIL] Email sent successfully:", emailResponse);
    return new Response(JSON.stringify({ success: true, emailId: emailResponse.data?.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("[SEND-SHIPPING-EMAIL] Error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }

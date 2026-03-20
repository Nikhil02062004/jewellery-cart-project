import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CartEmailRequest {
  type: 'abandoned_cart' | 'promotional';
  customerEmail: string;
  customerName: string;
  cartItems?: Array<{
    name: string;
    price: number;
    image?: string;
  }>;
  cartTotal?: number;
  promoCode?: string;
  promoDiscount?: number;
  subject?: string;
  promoMessage?: string;
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

const getAbandonedCartTemplate = (
  customerName: string,
  cartItems: Array<{ name: string; price: number; image?: string }>,
  cartTotal: number,
  promoCode?: string,
  promoDiscount?: number
) => {
  const safeCustomerName = escapeHtml(customerName);
  const safePromoCode = promoCode ? escapeHtml(promoCode) : '';

  const itemsHtml = cartItems.map(item => `
    <tr>
      <td style="padding: 15px; border-bottom: 1px solid #eee;">
        <div style="display: flex; align-items: center;">
          ${item.image ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px; margin-right: 15px;">` : ''}
          <span style="color: #1a1a1a; font-weight: 500;">${escapeHtml(item.name)}</span>
        </div>
      </td>
      <td style="padding: 15px; border-bottom: 1px solid #eee; text-align: right; color: #D4AF37; font-weight: 600;">₹${Number(item.price).toLocaleString()}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Complete Your Purchase</title>
    </head>
    <body style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: #1a1a1a; padding: 30px; text-align: center;">
        <h1 style="color: #D4AF37; margin: 0; font-size: 28px;">LUMIÈRE</h1>
        <p style="color: #888; margin: 10px 0 0; font-size: 12px; letter-spacing: 2px;">FINE JEWELRY</p>
      </div>
      
      <div style="background-color: #fff; padding: 30px;">
        <h2 style="color: #1a1a1a; margin-top: 0; text-align: center;">You Left Something Beautiful Behind</h2>
        <p style="color: #666; line-height: 1.6; text-align: center;">
          Dear ${safeCustomerName},<br><br>
          We noticed you left some exquisite pieces in your cart. These treasures are waiting for you!
        </p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 25px 0;">
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td style="padding: 15px; text-align: right; font-weight: bold; color: #1a1a1a;">Subtotal:</td>
              <td style="padding: 15px; text-align: right; font-weight: bold; color: #D4AF37; font-size: 20px;">₹${Number(cartTotal).toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>
        
        ${promoCode ? `
          <div style="background: linear-gradient(135deg, #1a1a1a 0%, #333 100%); padding: 25px; border-radius: 8px; text-align: center; margin: 25px 0;">
            <p style="color: #D4AF37; font-size: 14px; margin: 0 0 10px; letter-spacing: 2px;">EXCLUSIVE OFFER</p>
            <p style="color: #fff; font-size: 24px; font-weight: bold; margin: 0;">Get ${promoDiscount || 10}% OFF</p>
            <p style="color: #fff; margin: 15px 0 0;">
              Use code: <span style="background: #D4AF37; color: #1a1a1a; padding: 5px 15px; border-radius: 4px; font-weight: bold;">${safePromoCode}</span>
            </p>
          </div>
        ` : ''}
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://lumiere.com/cart" style="background-color: #D4AF37; color: #1a1a1a; padding: 15px 40px; text-decoration: none; font-weight: bold; border-radius: 4px; display: inline-block;">Complete Your Purchase</a>
        </div>
        
        <p style="color: #888; text-align: center; font-size: 13px;">
          Need assistance? Our jewelry experts are here to help.
        </p>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #888; font-size: 12px;">
        <p>© 2024 Lumière Fine Jewelry. All rights reserved.</p>
        <p><a href="#" style="color: #888;">Unsubscribe</a> from these emails</p>
      </div>
    </body>
    </html>
  `;
};

const getPromotionalTemplate = (
  customerName: string,
  promoCode: string,
  promoDiscount: number,
  promoMessage?: string
) => {
  const safeCustomerName = escapeHtml(customerName);
  const safePromoCode = escapeHtml(promoCode);
  const safePromoMessage = promoMessage ? escapeHtml(promoMessage) : 'Exclusive offer just for you';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Special Offer</title>
    </head>
    <body style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: #1a1a1a; padding: 30px; text-align: center;">
        <h1 style="color: #D4AF37; margin: 0; font-size: 28px;">LUMIÈRE</h1>
        <p style="color: #888; margin: 10px 0 0; font-size: 12px; letter-spacing: 2px;">FINE JEWELRY</p>
      </div>
      
      <div style="background-color: #fff; padding: 30px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <span style="font-size: 50px;">✨</span>
        </div>
        
        <h2 style="color: #1a1a1a; margin-top: 0; text-align: center;">${safePromoMessage}</h2>
        
        <p style="color: #666; line-height: 1.6; text-align: center;">
          Dear ${safeCustomerName},<br><br>
          As a valued member of our community, we're delighted to offer you an exclusive discount on our exquisite jewelry collection.
        </p>
        
        <div style="background: linear-gradient(135deg, #1a1a1a 0%, #333 100%); padding: 35px; border-radius: 8px; text-align: center; margin: 30px 0;">
          <p style="color: #D4AF37; font-size: 16px; margin: 0 0 15px; letter-spacing: 3px;">YOUR EXCLUSIVE OFFER</p>
          <p style="color: #fff; font-size: 48px; font-weight: bold; margin: 0;">${promoDiscount}% OFF</p>
          <p style="color: #888; margin: 20px 0 0; font-size: 14px;">on your entire purchase</p>
          <div style="margin-top: 25px;">
            <span style="background: #D4AF37; color: #1a1a1a; padding: 10px 30px; border-radius: 4px; font-weight: bold; font-size: 18px; letter-spacing: 2px;">${safePromoCode}</span>
          </div>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://lumiere.com/shop" style="background-color: #D4AF37; color: #1a1a1a; padding: 15px 40px; text-decoration: none; font-weight: bold; border-radius: 4px; display: inline-block;">Shop Now</a>
        </div>
        
        <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
          <p style="color: #888; text-align: center; font-size: 13px;">
            This offer expires in 7 days. Terms and conditions apply.
          </p>
        </div>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #888; font-size: 12px;">
        <p>© 2024 Lumière Fine Jewelry. All rights reserved.</p>
        <p><a href="#" style="color: #888;">Unsubscribe</a> from promotional emails</p>
      </div>
    </body>
    </html>
  `;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, customerEmail, customerName, cartItems, cartTotal, promoCode, promoDiscount, subject, promoMessage }: CartEmailRequest = await req.json();

    console.log(`[SEND-CART-EMAIL] Sending ${type} email to:`, customerEmail);

    let emailHtml: string;
    let emailSubject: string;

    if (type === 'abandoned_cart') {
      emailHtml = getAbandonedCartTemplate(
        customerName,
        cartItems || [],
        cartTotal || 0,
        promoCode,
        promoDiscount
      );
      emailSubject = subject || "You left something beautiful behind! 💎";
    } else {
      emailHtml = getPromotionalTemplate(
        customerName,
        promoCode || 'LUMIERE10',
        promoDiscount || 10,
        promoMessage
      );
      emailSubject = subject || "✨ A Special Offer Just for You";
    }

    const emailResponse = await resend.emails.send({
      from: "Lumière Jewelry <onboarding@resend.dev>",
      to: [customerEmail],
      subject: emailSubject,
      html: emailHtml,
    });

    console.log("[SEND-CART-EMAIL] Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailId: emailResponse.data?.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("[SEND-CART-EMAIL] Error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});

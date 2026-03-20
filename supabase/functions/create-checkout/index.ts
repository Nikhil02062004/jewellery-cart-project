import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CheckoutRequest {
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
  }>;
  customerInfo?: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
  };
}

// HTML escape function to prevent XSS
function escapeHtml(text: string): string {
  const htmlEntities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return text.replace(/[&<>"']/g, (char) => htmlEntities[char] || char);
}

// Email validation regex
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[CREATE-CHECKOUT] Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ✅ SAFER JSON PARSING (FIXES TYPE ERRORS)
    const body = await req.json();
    const { items, customerInfo }: CheckoutRequest = body;

    console.log("[CREATE-CHECKOUT] Received items:", items?.length);

    // ---------- VALIDATION ----------
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error("No items provided");
    }

    if (items.length > 50) {
      throw new Error("Too many items in cart (max 50)");
    }

    if (!customerInfo) {
      throw new Error("Customer info is missing");
    }

    if (!customerInfo.email || !customerInfo.name) {
      throw new Error("Customer name and email are required");
    }

    if (!isValidEmail(customerInfo.email)) {
      throw new Error("Invalid email format");
    }

    // Validate item structure
    for (const item of items) {
      if (!item.id || typeof item.id !== "string") {
        throw new Error("Invalid item ID");
      }
      if (!item.quantity || item.quantity < 1 || item.quantity > 100) {
        throw new Error("Invalid item quantity (must be 1-100)");
      }
      if (typeof item.price !== "number" || item.price < 0) {
        throw new Error("Invalid item price");
      }
    }

    // ---------- SERVER-SIDE PRICE VALIDATION ----------
    const productIds = items.map((item) => item.id);

    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, price, name")
      .in("id", productIds);

    if (productsError) {
      console.error("[CREATE-CHECKOUT] Error fetching products:", productsError);
      throw new Error("Failed to validate product prices");
    }

    if (!products || products.length !== items.length) {
      throw new Error("One or more products not found");
    }

    const productMap = new Map(
      products.map((p) => [
        p.id,
        { price: Number(p.price), name: p.name },
      ])
    );

    const validatedItems = items.map((item) => {
      const serverProduct = productMap.get(item.id);
      if (!serverProduct) {
        throw new Error(`Product ${item.id} not found`);
      }

      if (Math.abs(serverProduct.price - item.price) > 0.01) {
        console.error(
          `[CREATE-CHECKOUT] Price mismatch for ${item.id}: client=${item.price}, server=${serverProduct.price}`
        );
        throw new Error("Price validation failed - prices have changed");
      }

      return {
        ...item,
        name: serverProduct.name,
        price: serverProduct.price,
      };
    });

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-08-27.basil",
    });

    // ---------- FIND OR CREATE CUSTOMER ----------
    let customerId: string | undefined;

    const existingCustomers = await stripe.customers.list({
      email: customerInfo.email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
      console.log("[CREATE-CHECKOUT] Found existing customer:", customerId);
    }

    // ---------- CREATE STRIPE LINE ITEMS ----------
    const lineItems = validatedItems.map((item) => ({
      price_data: {
        currency: "inr",
        product_data: {
          name: escapeHtml(item.name),
          images: item.image ? [item.image] : [],
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    const origin = req.headers.get("origin") || "http://localhost:8080";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : customerInfo.email,
      line_items: lineItems,
      mode: "payment",
      success_url: `${origin}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout`,
      shipping_address_collection: {
        allowed_countries: ["IN"],
      },
      phone_number_collection: {
        enabled: true,
      },
      metadata: {
        customer_name: escapeHtml(customerInfo.name),
        customer_phone: escapeHtml(customerInfo.phone || ""),
        customer_address: escapeHtml(customerInfo.address || ""),
      },
    });

    console.log("[CREATE-CHECKOUT] Session created:", session.id);

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[CREATE-CHECKOUT] Error:", errorMessage);

    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

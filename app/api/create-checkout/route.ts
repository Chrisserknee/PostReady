import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { productId, userId, userEmail, planType } = await req.json();

    // Check if Stripe key is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("STRIPE_SECRET_KEY is not configured");
      return NextResponse.json({ error: "Stripe is not configured. Please contact support." }, { status: 500 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-10-29.clover",
    });

    // SUBSCRIPTION CHECKOUT (for Pro subscription)
    if (planType && !productId) {
      console.log('🔄 Creating subscription checkout for plan:', planType);

      if (!userId) {
        return NextResponse.json({ error: "User ID is required for subscriptions" }, { status: 400 });
      }

      // Create subscription checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "PostReady Pro",
                description: "Unlimited AI-powered content creation tools",
              },
              unit_amount: 499, // $4.99
              recurring: {
                interval: "month",
              },
            },
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${req.headers.get("origin")}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.get("origin")}/?cancelled=true`,
        customer_email: userEmail,
        metadata: {
          userId: userId,
          planType: planType,
        },
      });

      console.log('✅ Subscription checkout session created:', session.id);
      return NextResponse.json({ sessionId: session.id, url: session.url });
    }

    // PRODUCT CHECKOUT (for one-time digital product purchases)
    if (productId) {
      console.log('🛍️ Creating product checkout for product:', productId);

      // Get product details from Supabase
      const { data: product, error: productError } = await supabase
        .from('digital_products')
        .select('*')
        .eq('id', productId)
        .eq('is_active', true)
        .single();

      if (productError || !product) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }

      console.log('Product price:', product.price, 'Type:', typeof product.price);
      const priceInCents = Math.round(parseFloat(product.price) * 100);
      console.log('Price in cents:', priceInCents);

      if (priceInCents < 50) {
        return NextResponse.json({ error: "Product price must be at least $0.50" }, { status: 400 });
      }

      // Create product checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: product.title,
                description: product.subtitle || product.description,
                images: [product.image_url],
              },
              unit_amount: priceInCents,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${req.headers.get("origin")}/?payment=success&session_id={CHECKOUT_SESSION_ID}&product_id=${productId}`,
        cancel_url: `${req.headers.get("origin")}/?payment=cancelled`,
        metadata: {
          productId: productId,
          userId: userId || "guest",
        },
      });

      console.log('✅ Product checkout session created:', session.id);
      return NextResponse.json({ sessionId: session.id, url: session.url });
    }

    // Neither productId nor planType provided
    return NextResponse.json({ 
      error: "Either productId (for products) or planType (for subscriptions) is required" 
    }, { status: 400 });

  } catch (error: any) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session", details: error.message },
      { status: 500 }
    );
  }
}

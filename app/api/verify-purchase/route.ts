import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabase } from "@/lib/supabase";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-10-29.clover",
});

export async function POST(req: NextRequest) {
  try {
    const { sessionId, productId } = await req.json();

    if (!sessionId || !productId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify the Stripe session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 400 });
    }

    // Get product details
    const { data: product, error: productError } = await supabase
      .from('digital_products')
      .select('*')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Record the purchase
    const { error: purchaseError } = await supabase
      .from('product_purchases')
      .insert({
        user_id: session.metadata?.userId !== 'guest' ? session.metadata?.userId : null,
        product_id: productId,
        stripe_session_id: sessionId,
        stripe_payment_intent: session.payment_intent as string,
        amount_paid: (session.amount_total || 0) / 100,
      });

    if (purchaseError) {
      console.error("Error recording purchase:", purchaseError);
    }

    // Return download URL
    return NextResponse.json({
      success: true,
      downloadUrl: product.file_url,
      productTitle: product.title,
    });
  } catch (error: any) {
    console.error("Verify purchase error:", error);
    return NextResponse.json(
      { error: "Failed to verify purchase", details: error.message },
      { status: 500 }
    );
  }
}


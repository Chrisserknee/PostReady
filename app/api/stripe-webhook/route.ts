import { NextRequest, NextResponse } from "next/server";

// STRIPE DISABLED - Waiting for verification
// This webhook will be activated once Stripe account is verified

export async function POST(request: NextRequest) {
  // Return placeholder response - Stripe not yet configured
  return NextResponse.json(
    { 
      message: "Webhook endpoint disabled - Stripe not yet configured",
      received: false 
    },
    { status: 503 } // Service Unavailable
  );

  /* STRIPE WEBHOOK CODE - Uncomment when verified
  
  import Stripe from "stripe";
  import { supabase } from "@/lib/supabase";

  try {
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: "Stripe is not configured" },
        { status: 500 }
      );
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "No signature" },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;

        if (userId) {
          const { error } = await supabase
            .from("user_profiles")
            .update({ 
              is_pro: true, 
              updated_at: new Date().toISOString(),
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: session.subscription as string,
            })
            .eq("id", userId);

          if (error) {
            console.error("Error upgrading user:", error);
          } else {
            console.log(`User ${userId} upgraded to Pro`);
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const { data: profiles } = await supabase
          .from("user_profiles")
          .select("id")
          .eq("stripe_customer_id", customerId);

        if (profiles && profiles.length > 0) {
          const { error } = await supabase
            .from("user_profiles")
            .update({ 
              is_pro: false, 
              updated_at: new Date().toISOString() 
            })
            .eq("id", profiles[0].id);

          if (error) {
            console.error("Error downgrading user:", error);
          } else {
            console.log(`User ${profiles[0].id} downgraded from Pro`);
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`Payment failed for customer: ${invoice.customer}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: error.message || "Webhook handler failed" },
      { status: 500 }
    );
  }
  */
}


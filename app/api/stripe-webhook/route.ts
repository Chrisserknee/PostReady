import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabase } from "@/lib/supabase";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
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

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;

        if (userId) {
          // Upgrade user to Pro in Supabase
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

        // Find user by customer ID and downgrade them
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
        // You could send an email notification here
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
}


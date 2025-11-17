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
      console.error("❌ No Stripe signature found");
      return NextResponse.json(
        { error: "No signature" },
        { status: 400 }
      );
    }

    if (!webhookSecret) {
      console.error("❌ STRIPE_WEBHOOK_SECRET not configured");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    // Verify the webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error("❌ Webhook signature verification failed:", err.message);
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }

    console.log("✅ Webhook received:", event.type);

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("💳 Checkout session completed:", session.id);

        // Get user ID from metadata
        const userId = session.metadata?.userId;
        const planType = session.metadata?.planType || "pro";

        if (!userId) {
          console.error("❌ No userId in session metadata");
          return NextResponse.json(
            { error: "Missing userId" },
            { status: 400 }
          );
        }

        console.log("👤 Upgrading user to Pro:", userId);

        // Get subscription details if available
        const subscriptionId = session.subscription as string;
        const customerId = session.customer as string;

        // Update user to Pro in Supabase
        const { data, error } = await supabase
          .from("user_profiles")
          .update({
            is_pro: true,
            plan_type: planType,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            upgraded_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId)
          .select();

        if (error) {
          console.error("❌ Failed to update user profile:", error);
          return NextResponse.json(
            { error: "Failed to update user" },
            { status: 500 }
          );
        }

        console.log("✅ User upgraded to Pro successfully:", data);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log("🔄 Subscription updated:", subscription.id);

        // Find user by subscription ID
        const { data: userProfile, error: findError } = await supabase
          .from("user_profiles")
          .select("id")
          .eq("stripe_subscription_id", subscription.id)
          .single();

        if (findError || !userProfile) {
          console.error("❌ User not found for subscription:", subscription.id);
          break;
        }

        // Update subscription status based on Stripe status
        const isActive = ["active", "trialing"].includes(subscription.status);
        
        const { error: updateError } = await supabase
          .from("user_profiles")
          .update({
            is_pro: isActive,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userProfile.id);

        if (updateError) {
          console.error("❌ Failed to update subscription status:", updateError);
        } else {
          console.log("✅ Subscription status updated for user:", userProfile.id);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log("❌ Subscription cancelled:", subscription.id);

        // Find user by subscription ID
        const { data: userProfile, error: findError } = await supabase
          .from("user_profiles")
          .select("id")
          .eq("stripe_subscription_id", subscription.id)
          .single();

        if (findError || !userProfile) {
          console.error("❌ User not found for subscription:", subscription.id);
          break;
        }

        // Downgrade user to free
        const { error: updateError } = await supabase
          .from("user_profiles")
          .update({
            is_pro: false,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userProfile.id);

        if (updateError) {
          console.error("❌ Failed to downgrade user:", updateError);
        } else {
          console.log("✅ User downgraded to free:", userProfile.id);
        }
        break;
      }

      default:
        console.log("ℹ️ Unhandled event type:", event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("❌ Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}


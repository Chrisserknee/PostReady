import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from '@supabase/supabase-js';

// Use service role key to bypass RLS for webhook operations
const getSupabaseAdmin = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase credentials');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

export async function POST(request: NextRequest) {
  try {
    // Verify environment variables
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
      console.error("❌ Missing Stripe configuration");
      return NextResponse.json(
        { error: "Stripe not configured" },
        { status: 500 }
      );
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      console.error("❌ No Stripe signature found");
      return NextResponse.json(
        { error: "No signature" },
        { status: 400 }
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
    
    // Get Supabase admin client
    const supabase = getSupabaseAdmin();

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
          .select("id, plan_type")
          .eq("stripe_subscription_id", subscription.id)
          .single();

        if (findError || !userProfile) {
          console.error("❌ User not found for subscription:", subscription.id);
          break;
        }

        // Determine if subscription is active
        // IMPORTANT: When a user cancels through billing portal, Stripe sets cancel_at_period_end=true
        // The subscription status remains "active" until current_period_end
        // This ensures users keep access for the FULL MONTH they paid for
        const isCanceledAtPeriodEnd = subscription.cancel_at_period_end === true;
        const now = Math.floor(Date.now() / 1000);
        const periodEnd = (subscription as any).current_period_end as number | undefined;
        const isPastPeriodEnd = periodEnd && periodEnd < now;
        
        // User keeps Pro access if:
        // 1. Subscription is active/trialing (includes canceled subscriptions that haven't reached period_end yet)
        // 2. When cancel_at_period_end=true, status stays "active" until period_end
        const isActive = 
          subscription.status === "active" || 
          subscription.status === "trialing" ||
          (subscription.status === "canceled" && !isPastPeriodEnd); // Edge case: manually canceled but still in period
        
        // Only truly inactive if unpaid, past due, or canceled AND past period end
        const isTrulyInactive = 
          subscription.status === "unpaid" || 
          subscription.status === "past_due" ||
          (subscription.status === "canceled" && isPastPeriodEnd);
        
        const updateData: any = {
          is_pro: isActive,
          plan_type: isActive ? (userProfile.plan_type || 'pro') : 'free',
          updated_at: new Date().toISOString(),
        };
        
        // If subscription is truly inactive (past period end or unpaid), clear subscription ID
        // Otherwise, keep it (even if canceled, they still have access until period_end)
        if (isTrulyInactive) {
          updateData.stripe_subscription_id = null;
          console.log(`📋 Subscription ${subscription.status} - access ended, clearing subscription ID`);
        } else {
          updateData.stripe_subscription_id = subscription.id;
          if (isCanceledAtPeriodEnd && periodEnd) {
            const periodEndDate = new Date(periodEnd * 1000);
            const daysRemaining = Math.ceil((periodEnd - now) / (60 * 60 * 24));
            console.log(`📋 Subscription canceled but user keeps Pro access until: ${periodEndDate.toLocaleString()}`);
            console.log(`   - Days remaining: ${daysRemaining}`);
            console.log(`   - User paid for full month, access continues until period end`);
          }
        }
        
        const { error: updateError } = await supabase
          .from("user_profiles")
          .update(updateData)
          .eq("id", userProfile.id);

        if (updateError) {
          console.error("❌ Failed to update subscription status:", updateError);
        } else {
          console.log(`✅ Subscription status updated for user ${userProfile.id}: ${subscription.status}`);
          console.log(`   - is_pro: ${isActive}`);
          console.log(`   - plan_type: ${isActive ? (userProfile.plan_type || 'pro') : 'free'}`);
          console.log(`   - cancel_at_period_end: ${isCanceledAtPeriodEnd}`);
          if (isCanceledAtPeriodEnd && periodEnd) {
            const periodEndDate = new Date(periodEnd * 1000);
            const daysRemaining = Math.ceil((periodEnd - now) / (60 * 60 * 24));
            console.log(`   - Access ends on: ${periodEndDate.toLocaleString()} (${daysRemaining} days remaining)`);
          }
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
          // Try to find by customer ID as fallback
          const customerId = subscription.customer as string;
          const { data: fallbackProfile, error: fallbackError } = await supabase
            .from("user_profiles")
            .select("id")
            .eq("stripe_customer_id", customerId)
            .single();
          
          if (fallbackError || !fallbackProfile) {
            console.error("❌ User not found by customer ID either:", customerId);
            break;
          }
          
          // Use fallback profile
          const { error: updateError } = await supabase
            .from("user_profiles")
            .update({
              is_pro: false,
              plan_type: 'free',
              stripe_subscription_id: null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", fallbackProfile.id);

          if (updateError) {
            console.error("❌ Failed to downgrade user:", updateError);
          } else {
            console.log("✅ User downgraded to free (found by customer ID):", fallbackProfile.id);
          }
          break;
        }

        // Downgrade user to free - clear subscription ID and set plan to free
        const { error: updateError } = await supabase
          .from("user_profiles")
          .update({
            is_pro: false,
            plan_type: 'free',
            stripe_subscription_id: null, // Clear subscription ID since it's cancelled
            updated_at: new Date().toISOString(),
          })
          .eq("id", userProfile.id);

        if (updateError) {
          console.error("❌ Failed to downgrade user:", updateError);
        } else {
          console.log("✅ User downgraded to free:", userProfile.id);
          console.log("   - is_pro: false");
          console.log("   - plan_type: free");
          console.log("   - stripe_subscription_id: cleared");
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


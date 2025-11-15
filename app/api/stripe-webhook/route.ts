import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  // Create Supabase client with service role key to bypass RLS
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  try {
    // Check for required environment variables
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: "Stripe is not configured" },
        { status: 500 }
      );
    }

    // Initialize Stripe client lazily (only when route is called)
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

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const planType = session.metadata?.planType || 'pro'; // Default to pro if not specified

        if (userId) {
          console.log(`Upgrading user ${userId} to ${planType}`);
          
          // Update user_profiles table
          const { error } = await supabase
            .from("user_profiles")
            .update({ 
              is_pro: true, 
              plan_type: planType,
              updated_at: new Date().toISOString(),
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: session.subscription as string,
            })
            .eq("id", userId);

          if (error) {
            console.error("Error upgrading user:", error);
          } else {
            console.log(`User upgraded to ${planType.toUpperCase()}`);
            
            // For Creator plan, also update auth user metadata
            if (planType === 'creator') {
              // Note: This requires Supabase service role key to update user metadata
              // For now, we'll rely on the plan_type in user_profiles
              console.log("Creator plan activated - user_profiles updated");
            }
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
              plan_type: 'free',
              updated_at: new Date().toISOString() 
            })
            .eq("id", profiles[0].id);

          if (error) {
            console.error("Error downgrading user:", error);
          } else {
            console.log("User downgraded to Free plan");
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        console.log("Payment failed for customer");
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


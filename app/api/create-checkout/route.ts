import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { verifyUserOwnership } from "@/lib/auth-utils";

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Checkout API called');
    
    const body = await request.json();
    const { userId, userEmail, planType = 'pro' } = body;

    console.log('📥 Checkout request data:', { userId: userId ? 'present' : 'missing', userEmail: userEmail ? 'present' : 'missing', planType });

    // Input validation
    if (!userId || !userEmail) {
      console.error('❌ Missing user information:', { userId: !!userId, userEmail: !!userEmail });
      return NextResponse.json(
        { error: "Missing user information" },
        { status: 400 }
      );
    }

    // Validate planType
    if (planType && !['pro', 'creator'].includes(planType)) {
      console.error('❌ Invalid plan type:', planType);
      return NextResponse.json(
        { error: "Invalid plan type" },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const sanitizedUserId = String(userId).trim().substring(0, 100);
    const sanitizedEmail = String(userEmail).trim().substring(0, 255);
    const sanitizedPlanType = planType || 'pro';

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizedEmail)) {
      console.error('❌ Invalid email format:', sanitizedEmail);
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    console.log('🔐 Verifying user ownership...');
    // SECURITY: Verify user is authenticated and owns this userId
    const isAuthorized = await verifyUserOwnership(request, sanitizedUserId);
    console.log('🔐 Authorization result:', isAuthorized);
    
    if (!isAuthorized) {
      console.error('❌ Unauthorized access attempt');
      return NextResponse.json(
        { error: "Unauthorized - Please sign in again" },
        { status: 401 }
      );
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('❌ STRIPE_SECRET_KEY not configured');
      return NextResponse.json(
        { error: "Stripe is not configured" },
        { status: 500 }
      );
    }

    console.log('💳 Creating Stripe checkout session...');
    // Initialize Stripe client lazily (only when route is called)
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // Determine plan details
    const planName = sanitizedPlanType === 'creator' ? 'PostReady Creator' : 'PostReady Pro';
    const planDescription = sanitizedPlanType === 'creator' 
      ? "Unlimited video ideas, advanced insights, priority support, and creator-focused features"
      : "Unlimited video ideas, advanced insights, and priority support";
    
    // Create a Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${planName} - Monthly Subscription`,
              description: planDescription,
            },
            unit_amount: 1000, // $10.00 in cents (same price for both plans)
            recurring: {
              interval: "month",
            },
          },
          quantity: 1,
        },
      ],
      subscription_data: {
        metadata: {
          userId: sanitizedUserId,
          planType: sanitizedPlanType,
        },
        description: `${planName} Monthly Subscription`,
      },
      customer_email: sanitizedEmail,
      metadata: {
        userId: sanitizedUserId,
        planType: sanitizedPlanType,
      },
      consent_collection: {
        terms_of_service: 'required',
      },
      custom_text: {
        terms_of_service_acceptance: {
          message: 'By subscribing, you authorize PostReady to charge you according to the terms until you cancel.',
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}?upgrade=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}?upgrade=cancelled`,
    });

    console.log('✅ Checkout session created successfully');
    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    // Log detailed error server-side for debugging
    console.error("❌ Stripe checkout error:", {
      message: error.message,
      type: error.type,
      code: error.code,
      stack: error.stack
    });
    
    // Return generic error to client (don't leak sensitive details)
    return NextResponse.json(
      { error: "Failed to create checkout session. Please try again." },
      { status: 500 }
    );
  }
}


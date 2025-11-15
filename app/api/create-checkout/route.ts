import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { verifyUserOwnership } from "@/lib/auth-utils";

export async function POST(request: NextRequest) {
  try {
    const { userId, userEmail } = await request.json();

    // Input validation
    if (!userId || !userEmail) {
      return NextResponse.json(
        { error: "Missing user information" },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const sanitizedUserId = String(userId).trim().substring(0, 100);
    const sanitizedEmail = String(userEmail).trim().substring(0, 255);

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizedEmail)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // SECURITY: Verify user is authenticated and owns this userId
    const isAuthorized = await verifyUserOwnership(request, sanitizedUserId);
    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Stripe is not configured" },
        { status: 500 }
      );
    }

    // Initialize Stripe client lazily (only when route is called)
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // Create a Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "PostReady Pro - Monthly Subscription",
              description: "Unlimited video ideas, advanced insights, and priority support",
            },
            unit_amount: 1000, // $10.00 in cents
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
        },
        description: "PostReady Pro Monthly Subscription",
      },
      customer_email: sanitizedEmail,
      metadata: {
        userId: sanitizedUserId,
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

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    // Log detailed error server-side for debugging
    console.error("Stripe checkout error:", {
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


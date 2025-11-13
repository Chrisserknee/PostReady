import { NextRequest, NextResponse } from "next/server";

// STRIPE DISABLED - Waiting for verification
// This endpoint will be activated once Stripe account is verified

export async function POST(request: NextRequest) {
  try {
    const { userId, userEmail } = await request.json();

    if (!userId || !userEmail) {
      return NextResponse.json(
        { error: "Missing user information" },
        { status: 400 }
      );
    }

    // Return placeholder response - Stripe not yet configured
    return NextResponse.json(
      { 
        error: "Pro subscriptions coming soon! We're currently setting up payment processing.",
        comingSoon: true 
      },
      { status: 503 } // Service Unavailable
    );

    /* STRIPE CODE - Uncomment when verified
    
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Stripe is not configured" },
        { status: 500 }
      );
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "PostReady Pro",
              description: "Unlimited video ideas, advanced insights, and priority support",
            },
            unit_amount: 1000,
            recurring: {
              interval: "month",
            },
          },
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 2,
        metadata: {
          userId: userId,
        },
      },
      customer_email: userEmail,
      metadata: {
        userId: userId,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}?upgrade=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}?upgrade=cancelled`,
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
    */
  } catch (error: any) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}


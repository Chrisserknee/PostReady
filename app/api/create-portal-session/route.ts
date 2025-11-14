import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabase } from "@/lib/supabase";
import { verifyUserOwnership } from "@/lib/auth-utils";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    // Input validation
    if (!userId) {
      return NextResponse.json(
        { error: "Missing user ID" },
        { status: 400 }
      );
    }

    // Sanitize input
    const sanitizedUserId = String(userId).trim().substring(0, 100);

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

    // Initialize Stripe client lazily
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // Get user's Stripe customer ID from Supabase
    const { data: profile, error } = await supabase
      .from("user_profiles")
      .select("stripe_customer_id")
      .eq("id", sanitizedUserId)
      .single();

    if (error || !profile?.stripe_customer_id) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 404 }
      );
    }

    // Create a Stripe Customer Portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/portal`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    // Don't leak error details to client
    console.error("Portal session error");
    return NextResponse.json(
      { error: "Failed to create portal session. Please try again." },
      { status: 500 }
    );
  }
}



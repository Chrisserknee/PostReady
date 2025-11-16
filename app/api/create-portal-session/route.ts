import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from '@supabase/supabase-js';
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
    // Log error details for debugging but don't leak to client
    console.error("Portal session error:", error.message);
    console.error("Error details:", error);
    return NextResponse.json(
      { error: "Failed to create portal session. Please try again." },
      { status: 500 }
    );
  }
}



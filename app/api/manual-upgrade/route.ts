import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyUserOwnership } from "@/lib/auth-utils";

/**
 * TEMPORARY ENDPOINT: Manual Pro Upgrade
 * This endpoint allows manually upgrading a user to Pro
 * Use this ONLY for users who paid but weren't upgraded due to missing webhook
 * 
 * TODO: Remove this endpoint once all affected users are upgraded
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId" },
        { status: 400 }
      );
    }

    // SECURITY: Verify user is authenticated and owns this userId
    const isAuthorized = await verifyUserOwnership(request, userId);
    
    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Unauthorized - You can only upgrade your own account" },
        { status: 401 }
      );
    }

    console.log("🔧 Manual upgrade requested for user:", userId);

    // Update user to Pro in Supabase
    const { data, error } = await supabase
      .from("user_profiles")
      .update({
        is_pro: true,
        plan_type: "pro",
        upgraded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select();

    if (error) {
      console.error("❌ Failed to upgrade user:", error);
      return NextResponse.json(
        { error: "Failed to upgrade user", details: error.message },
        { status: 500 }
      );
    }

    console.log("✅ User manually upgraded to Pro:", data);

    return NextResponse.json({ 
      success: true, 
      message: "Successfully upgraded to Pro! Please refresh the page.",
      user: data?.[0]
    });
  } catch (error: any) {
    console.error("❌ Manual upgrade error:", error);
    return NextResponse.json(
      { error: "Upgrade failed", details: error.message },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { subject, message, userEmail, userId } = await request.json();

    if (!subject || !message) {
      return NextResponse.json(
        { error: "Subject and message are required" },
        { status: 400 }
      );
    }

    // Get Supabase client (server-side)
    const supabase = getSupabaseClient();

    // Save message to Supabase
    const { data, error } = await supabase
      .from('contact_messages')
      .insert({
        user_id: userId || null,
        user_email: userEmail || 'Anonymous',
        subject: subject.trim(),
        message: message.trim(),
        status: 'new',
      })
      .select()
      .single();

    if (error) {
      console.error("❌ Supabase insert error:", error);
      throw new Error(`Failed to save message: ${error.message}`);
    }

    console.log("✅ Contact message saved to Supabase:", {
      id: data.id,
      userEmail: userEmail || 'Anonymous',
      subject: subject,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({ 
      success: true,
      message: "Your message has been sent successfully. We'll get back to you soon!" 
    });
  } catch (error: any) {
    console.error("❌ Contact form error:", error);
    return NextResponse.json(
      { 
        error: "Failed to send message. Please try again later.",
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}


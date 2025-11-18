import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { subject, message, userEmail, userId } = await request.json();

    // Input validation
    if (!subject || !message) {
      return NextResponse.json(
        { error: "Subject and message are required" },
        { status: 400 }
      );
    }

    // Sanitize and validate input lengths to prevent DoS
    const sanitizedSubject = String(subject).trim().substring(0, 200);
    const sanitizedMessage = String(message).trim().substring(0, 5000);
    const sanitizedEmail = userEmail ? String(userEmail).trim().substring(0, 255) : 'Anonymous';
    const sanitizedUserId = userId ? String(userId).trim().substring(0, 100) : null;

    if (!sanitizedSubject || !sanitizedMessage) {
      return NextResponse.json(
        { error: "Subject and message cannot be empty" },
        { status: 400 }
      );
    }

    // Validate email format if provided
    if (sanitizedEmail !== 'Anonymous' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizedEmail)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Log the support message (you can check your server logs)
    console.log("📧 ===== NEW SUPPORT MESSAGE =====");
    console.log(`From: ${sanitizedEmail}`);
    console.log(`User ID: ${sanitizedUserId || 'N/A'}`);
    console.log(`Subject: ${sanitizedSubject}`);
    console.log(`Message: ${sanitizedMessage}`);
    console.log("=====================================");

    // TODO: In the future, you can integrate with an email service like:
    // - Resend (resend.com)
    // - SendGrid
    // - AWS SES
    // - Or save to a Supabase table

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


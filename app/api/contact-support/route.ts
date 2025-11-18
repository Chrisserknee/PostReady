import { NextRequest, NextResponse } from "next/server";
import { Resend } from 'resend';

// Support messages will be sent to postready.app@gmail.com via Resend
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

    // Log the support message (backup)
    console.log("📧 ===== NEW SUPPORT MESSAGE =====");
    console.log(`From: ${sanitizedEmail}`);
    console.log(`User ID: ${sanitizedUserId || 'N/A'}`);
    console.log(`Subject: ${sanitizedSubject}`);
    console.log(`Message: ${sanitizedMessage}`);
    console.log("=====================================");

    // Send email via Resend
    const resendApiKey = process.env.RESEND_API_KEY;
    const supportEmail = process.env.SUPPORT_EMAIL || 'support@postready.app';

    if (resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);
        
        await resend.emails.send({
          from: 'PostReady Support <support@postready.app>',
          to: supportEmail,
          replyTo: sanitizedEmail !== 'Anonymous' ? sanitizedEmail : undefined,
          subject: `[PostReady Support] ${sanitizedSubject}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(to right, #2979FF, #6FFFD2); padding: 20px; text-align: center;">
                <h1 style="color: white; margin: 0;">PostReady Support</h1>
              </div>
              
              <div style="padding: 30px; background: #f9f9f9;">
                <h2 style="color: #333; margin-top: 0;">New Support Message</h2>
                
                <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                  <p style="margin: 5px 0;"><strong>From:</strong> ${sanitizedEmail}</p>
                  <p style="margin: 5px 0;"><strong>User ID:</strong> ${sanitizedUserId || 'N/A'}</p>
                  <p style="margin: 5px 0;"><strong>Subject:</strong> ${sanitizedSubject}</p>
                </div>
                
                <div style="background: white; padding: 20px; border-radius: 8px;">
                  <h3 style="color: #333; margin-top: 0;">Message:</h3>
                  <p style="color: #555; line-height: 1.6; white-space: pre-wrap;">${sanitizedMessage}</p>
                </div>
              </div>
              
              <div style="padding: 20px; text-align: center; color: #999; font-size: 12px;">
                <p>This message was sent from PostReady Support Form</p>
              </div>
            </div>
          `,
        });

        console.log("✅ Email sent successfully via Resend");
      } catch (emailError: any) {
        console.error("⚠️ Failed to send email via Resend:", emailError);
        // Don't fail the request if email fails - message is logged
      }
    } else {
      console.warn("⚠️ RESEND_API_KEY not configured - email not sent");
    }

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


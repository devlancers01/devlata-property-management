import { NextRequest, NextResponse } from "next/server";
import { createOTP, getUserByEmail } from "@/lib/firebase/firestore";
import { sendOTPEmail } from "@/lib/email/mailer";

export async function POST(req: NextRequest) {
  try {
    const { email, purpose } = await req.json();

    if (!email || !purpose) {
      return NextResponse.json(
        { error: "Email and purpose required" },
        { status: 400 }
      );
    }

    // Validate purpose
    const validPurposes = ["email_verification", "password_reset", "login_2fa"];
    if (!validPurposes.includes(purpose)) {
      return NextResponse.json({ error: "Invalid purpose" }, { status: 400 });
    }

    // Check if user exists (for login and password reset)
    if (purpose === "login_2fa" || purpose === "password_reset") {
      const user = await getUserByEmail(email);
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
    }

    // Generate and send OTP
    const otp = await createOTP(email, purpose);
    await sendOTPEmail(email, otp, purpose);

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error("Send OTP error:", error);
    return NextResponse.json(
      { error: "Failed to send OTP" },
      { status: 500 }
    );
  }
}
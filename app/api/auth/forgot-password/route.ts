import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail } from "@/lib/firebase/firestore";
import { createOTP } from "@/lib/firebase/firestore";
import { sendPasswordResetEmail } from "@/lib/email/mailer";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const user = await getUserByEmail(email);

    if (!user) {
      // Don't reveal if user exists or not (security best practice)
      return NextResponse.json({
        success: true,
        message: "If an account exists, a reset email has been sent.",
      });
    }

    // Generate OTP for password reset
    const otp = await createOTP(email, "password_reset");

    // Create reset URL with OTP
    const resetUrl = `${process.env.APP_URL}/reset-password?email=${encodeURIComponent(
      email
    )}&otp=${otp}`;

    await sendPasswordResetEmail(email, resetUrl);

    return NextResponse.json({
      success: true,
      message: "Password reset email sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from "next/server";
import { verifyOTP, deleteVerifiedOTPs } from "@/lib/firebase/firestore";

export async function POST(req: NextRequest) {
  try {
    const { email, otp, purpose } = await req.json();

    if (!email || !otp || !purpose) {
      return NextResponse.json(
        { error: "Email, OTP, and purpose required" },
        { status: 400 }
      );
    }

    const isValid = await verifyOTP(email, otp, purpose);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid or expired OTP" },
        { status: 400 }
      );
    }

    // Clean up verified OTPs
    await deleteVerifiedOTPs(email);

    return NextResponse.json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { error: "Failed to verify OTP" },
      { status: 500 }
    );
  }
}
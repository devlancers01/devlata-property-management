import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { checkBookingConflict } from "@/lib/firebase/customers";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { checkIn, checkOut, excludeCustomerId } = await req.json();

    if (!checkIn || !checkOut) {
      return NextResponse.json(
        { error: "Check-in and check-out dates required" },
        { status: 400 }
      );
    }

    const result = await checkBookingConflict(
      new Date(checkIn),
      new Date(checkOut),
      excludeCustomerId
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Check conflict error:", error);
    return NextResponse.json(
      { error: "Failed to check conflicts" },
      { status: 500 }
    );
  }
}
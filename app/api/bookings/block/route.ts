import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { blockDates, checkBookingAvailability } from "@/lib/firebase/bookings";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { checkIn, checkOut, reason } = body;

    if (!checkIn || !checkOut) {
      return NextResponse.json(
        { error: "Check-in and check-out dates are required" },
        { status: 400 }
      );
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkOutDate <= checkInDate) {
      return NextResponse.json(
        { error: "Check-out date must be after check-in date" },
        { status: 400 }
      );
    }

    // Check if dates are already booked
    const { available } = await checkBookingAvailability(checkInDate, checkOutDate);

    if (!available) {
      return NextResponse.json(
        { error: "Selected dates are already booked" },
        { status: 409 }
      );
    }

    await blockDates(checkInDate, checkOutDate);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error blocking dates:", error);
    return NextResponse.json(
      { error: error.message || "Failed to block dates" },
      { status: 500 }
    );
  }
}
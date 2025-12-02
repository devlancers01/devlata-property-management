import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { checkBookingConflict } from "@/lib/firebase/customers";

// Helper to convert ISO string to Date
function parseDate(value: any): Date {
  if (value instanceof Date) return value;
  if (typeof value === "string") return new Date(value);
  return new Date();
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { checkIn, checkOut, excludeCustomerId } = body;

    if (!checkIn || !checkOut) {
      return NextResponse.json(
        { error: "checkIn and checkOut dates are required" },
        { status: 400 }
      );
    }

    // Convert ISO strings to Date objects
    const checkInDate = parseDate(checkIn);
    const checkOutDate = parseDate(checkOut);

    const result = await checkBookingConflict(
      checkInDate,
      checkOutDate,
      excludeCustomerId
    );

    return NextResponse.json({
      hasConflict: result.hasConflict,
      conflictingBookings: result.conflictingBookings,
    });
  } catch (error: any) {
    console.error("Error checking booking conflicts:", error);
    return NextResponse.json(
      { error: error.message || "Failed to check conflicts" },
      { status: 500 }
    );
  }
}
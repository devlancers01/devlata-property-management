import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { deleteBookings } from "@/lib/firebase/bookings";

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission
    if (!session.user.permissions?.includes("bookings.delete")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { checkIn, checkOut } = body;

    if (!checkIn || !checkOut) {
      return NextResponse.json(
        { error: "Check-in and check-out dates are required" },
        { status: 400 }
      );
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    await deleteBookings(checkInDate, checkOutDate);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error unblocking dates:", error);
    return NextResponse.json(
      { error: error.message || "Failed to unblock dates" },
      { status: 500 }
    );
  }
}
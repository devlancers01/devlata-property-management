import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { getRefunds, addRefund } from "@/lib/firebase/customers";
import { sendCancellationEmail } from "@/lib/email/user-emails";
import { getCustomerById } from "@/lib/firebase/customers";
import { deleteBookings } from "@/lib/firebase/bookings";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const refunds = await getRefunds(id);

    return NextResponse.json({ refunds });
  } catch (error: any) {
    console.error("Error fetching refunds:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch refunds" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission
    if (!session.user.permissions?.includes("bookings.delete") && 
        !session.user.permissions?.includes("bookings.edit")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { amount, method, reason, receiptUrl } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Valid refund amount is required" },
        { status: 400 }
      );
    }

    // Get customer to validate refund amount
    const customer = await getCustomerById(id);
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    if (customer.status === "cancelled") {
      return NextResponse.json(
        { error: "Booking is already cancelled" },
        { status: 400 }
      );
    }

    if (amount > customer.receivedAmount) {
      return NextResponse.json(
        { error: "Refund amount cannot exceed received amount" },
        { status: 400 }
      );
    }

    const refundData = {
      amount,
      method: method || "cash",
      ...(reason && { reason }),
      ...(receiptUrl && { receiptUrl }),
      ...(session.user.name && { processedBy: session.user.name }),
    };

    const refundUid = await addRefund(id, refundData);
    await deleteBookings(customer.checkIn, customer.checkOut);

    // Send cancellation email
    try {
      await sendCancellationEmail(
        customer.email,
        customer.name,
        id,
        customer.checkIn,
        customer.checkOut,
        customer.receivedAmount,
        amount,
        customer.totalAmount - (customer.receivedAmount - amount)
      );
    } catch (emailError) {
      console.error("Error sending cancellation email:", emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      refundUid,
    });
  } catch (error: any) {
    console.error("Error processing refund:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process refund" },
      { status: 500 }
    );
  }
}
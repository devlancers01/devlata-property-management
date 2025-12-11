import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { getPayments, addPayment } from "@/lib/firebase/customers";
import { syncCustomerPaymentToSale } from "@/lib/firebase/sales";

// GET /api/customers/[id]/payments - Get payment history
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission
    if (!session.user.permissions?.includes("customers.view") && !session.user.permissions?.includes("customers.payments.view")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const payments = await getPayments(id);

    return NextResponse.json({ payments });
  } catch (error: any) {
    console.error("Error fetching payments:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch payments" },
      { status: 500 }
    );
  }
}

// POST /api/customers/[id]/payments - Add a payment
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
    if (!session.user.permissions?.includes("customers.create") && !session.user.permissions?.includes("customers.payments.create")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const body = await req.json();
    const { amount, mode, type, notes, receiptUrl } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Valid payment amount is required" },
        { status: 400 }
      );
    }

    const paymentUid = await addPayment(id, {
      amount,
      mode: mode || "cash",
      type: type || "advance",
      notes,
      receiptUrl,
    });

    // Sync to sales collection
    try {
      await syncCustomerPaymentToSale(
        id,
        paymentUid,
        {
          amount,
          mode: mode || "cash",
          type: type || "advance",
          date: new Date(),
          notes,
        },
        "create"
      );
    } catch (syncError) {
      console.error("Error syncing payment to sales:", syncError);
      // Don't fail the request if sync fails
    }

    return NextResponse.json({
      success: true,
      paymentUid,
    });
  } catch (error: any) {
    console.error("Error adding payment:", error);
    return NextResponse.json(
      { error: error.message || "Failed to add payment" },
      { status: 500 }
    );
  }
}
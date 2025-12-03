import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { getPayments, addPayment } from "@/lib/firebase/customers";

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

    const { id } = await params; // ✅ Await params

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

    const { id } = await params; // ✅ Await params

    const body = await req.json();
    const { amount, mode, notes, receiptUrl } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Valid payment amount is required" },
        { status: 400 }
      );
    }

    const paymentUid = await addPayment(id, {
      amount,
      mode: mode || "cash",
      notes,
      receiptUrl,
    });

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


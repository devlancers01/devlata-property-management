//app/api/staff/[id]/payments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { getStaffPayments, addStaffPayment } from "@/lib/firebase/staff";
import { syncStaffPaymentToExpense } from "@/lib/firebase/expenses";

// GET /api/staff/[id]/payments
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!session.user.permissions?.includes("staff.payments.view")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const payments = await getStaffPayments(id);

    return NextResponse.json({ payments }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching payments:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch payments" },
      { status: 500 }
    );
  }
}

// POST /api/staff/[id]/payments
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!session.user.permissions?.includes("staff.payments.create")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { amount, mode, type, month, receiptUrl, notes, date } = body;

    if (!amount || !mode || !type || !date) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const paymentData: any = {
      amount: parseFloat(amount),
      mode,
      type,
      date: new Date(date),
    };

    // Only add optional fields if they have values
    if (month) {
      paymentData.month = month;
    }
    if (receiptUrl) {
      paymentData.receiptUrl = receiptUrl;
    }
    if (notes) {
      paymentData.notes = notes;
    }

    const paymentId = await addStaffPayment(id, paymentData);

    // Sync to expenses
    await syncStaffPaymentToExpense(id, paymentId, paymentData, "create");

    return NextResponse.json({ paymentId }, { status: 201 });
  } catch (error: any) {
    console.error("Error adding payment:", error);
    return NextResponse.json(
      { error: error.message || "Failed to add payment" },
      { status: 500 }
    );
  }
}
//app/api/staff/[id]/payments/[paymentId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { updateStaffPayment, deleteStaffPayment } from "@/lib/firebase/staff";
import { syncStaffPaymentToExpense } from "@/lib/firebase/expenses";
import { adminDb } from "@/lib/firebase/admin";

// Helper to convert Timestamp to Date
function toDate(value: any): Date {
  if (value instanceof Date) return value;
  if (value && typeof value === "object" && "toDate" in value) {
    return value.toDate();
  }
  if (typeof value === "string") return new Date(value);
  return new Date();
}

// PATCH /api/staff/[id]/payments/[paymentId]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; paymentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!session.user.permissions?.includes("staff.payments.edit")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id, paymentId } = await params;
    const body = await req.json();

    // Get old payment data
    const oldPaymentDoc = await adminDb
      .collection("staff")
      .doc(id)
      .collection("payments")
      .doc(paymentId)
      .get();

    const oldPayment = oldPaymentDoc.data();

    const updateData: any = {};
    if (body.amount !== undefined) updateData.amount = parseFloat(body.amount);
    if (body.mode) updateData.mode = body.mode;
    if (body.type) updateData.type = body.type;
    if (body.month) updateData.month = body.month;
    if (body.receiptUrl) updateData.receiptUrl = body.receiptUrl;
    if (body.notes) updateData.notes = body.notes;
    if (body.date) updateData.date = new Date(body.date);

    await updateStaffPayment(id, paymentId, updateData);

    // Prepare data for expense sync
    const paymentData = {
      amount: updateData.amount || oldPayment?.amount,
      mode: updateData.mode || oldPayment?.mode,
      type: updateData.type || oldPayment?.type,
      date: updateData.date || (oldPayment?.date ? toDate(oldPayment.date) : new Date()),
      month: updateData.month || oldPayment?.month,
      receiptUrl: updateData.receiptUrl || oldPayment?.receiptUrl,
      notes: updateData.notes || oldPayment?.notes,
    };

    // Sync to expenses
    await syncStaffPaymentToExpense(id, paymentId, paymentData, "update");

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("Error updating payment:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update payment" },
      { status: 500 }
    );
  }
}

// DELETE /api/staff/[id]/payments/[paymentId]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; paymentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!session.user.permissions?.includes("staff.payments.delete")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id, paymentId } = await params;

    // Get payment data before deleting
    const paymentDoc = await adminDb
      .collection("staff")
      .doc(id)
      .collection("payments")
      .doc(paymentId)
      .get();

    const payment = paymentDoc.data();

    // Delete from expenses first
    if (payment) {
      const paymentData = {
        amount: payment.amount,
        mode: payment.mode,
        type: payment.type,
        date: payment.date ? toDate(payment.date) : new Date(),
      };
      await syncStaffPaymentToExpense(id, paymentId, paymentData, "delete");
    }

    // Then delete payment
    await deleteStaffPayment(id, paymentId);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("Error deleting payment:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete payment" },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { updateStaffPayment, deleteStaffPayment } from "@/lib/firebase/staff";

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

    const updateData: any = {};
    if (body.amount !== undefined) updateData.amount = parseFloat(body.amount);
    if (body.mode) updateData.mode = body.mode;
    if (body.type) updateData.type = body.type;
    // Only add month if it has a value
    if (body.month) updateData.month = body.month;
    // Only add receiptUrl if it has a value
    if (body.receiptUrl) updateData.receiptUrl = body.receiptUrl;
    // Only add notes if it has a value
    if (body.notes) updateData.notes = body.notes;
    if (body.date) updateData.date = new Date(body.date);

    await updateStaffPayment(id, paymentId, updateData);

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
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { updateStaffExpense, deleteStaffExpense } from "@/lib/firebase/staff";

// PATCH /api/staff/[id]/expenses/[expenseId]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; expenseId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!session.user.permissions?.includes("staff.expenses.edit")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id, expenseId } = await params;
    const body = await req.json();

    const updateData: any = {};
    if (body.amount !== undefined) updateData.amount = parseFloat(body.amount);
    if (body.mode) updateData.mode = body.mode;
    if (body.category) {
      updateData.category = body.category;
      // Only add customCategory if it has a value
      if (body.category === "other" && body.customCategory) {
        updateData.customCategory = body.customCategory;
      }
    }
    // Only add receiptUrl if it has a value
    if (body.receiptUrl) updateData.receiptUrl = body.receiptUrl;
    // Only add notes if it has a value
    if (body.notes) updateData.notes = body.notes;
    if (body.date) updateData.date = new Date(body.date);

    await updateStaffExpense(id, expenseId, updateData);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("Error updating expense:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update expense" },
      { status: 500 }
    );
  }
}

// DELETE /api/staff/[id]/expenses/[expenseId]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; expenseId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!session.user.permissions?.includes("staff.expenses.delete")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id, expenseId } = await params;

    await deleteStaffExpense(id, expenseId);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("Error deleting expense:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete expense" },
      { status: 500 }
    );
  }
}
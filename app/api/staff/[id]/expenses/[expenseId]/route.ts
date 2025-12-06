//app/api/staff/[id]/expenses/[expenseId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { updateStaffExpense, deleteStaffExpense } from "@/lib/firebase/staff";
import { syncStaffExpenseToExpense } from "@/lib/firebase/expenses";
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

    // Get old expense data
    const oldExpenseDoc = await adminDb
      .collection("staff")
      .doc(id)
      .collection("expenses")
      .doc(expenseId)
      .get();

    const oldExpense = oldExpenseDoc.data();

    const updateData: any = {};
    if (body.amount !== undefined) updateData.amount = parseFloat(body.amount);
    if (body.mode) updateData.mode = body.mode;
    if (body.category) {
      updateData.category = body.category;
      if (body.category === "other" && body.customCategory) {
        updateData.customCategory = body.customCategory;
      }
    }
    if (body.receiptUrl) updateData.receiptUrl = body.receiptUrl;
    if (body.notes) updateData.notes = body.notes;
    if (body.date) updateData.date = new Date(body.date);

    await updateStaffExpense(id, expenseId, updateData);

    // Prepare data for expense sync
    const expenseData = {
      amount: updateData.amount || oldExpense?.amount,
      mode: updateData.mode || oldExpense?.mode,
      category: updateData.category || oldExpense?.category,
      date: updateData.date || (oldExpense?.date ? toDate(oldExpense.date) : new Date()),
      customCategory: updateData.customCategory || oldExpense?.customCategory,
      receiptUrl: updateData.receiptUrl || oldExpense?.receiptUrl,
      notes: updateData.notes || oldExpense?.notes,
    };

    // Sync to expenses
    await syncStaffExpenseToExpense(id, expenseId, expenseData, "update");

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

    // Get expense data before deleting
    const expenseDoc = await adminDb
      .collection("staff")
      .doc(id)
      .collection("expenses")
      .doc(expenseId)
      .get();

    const expense = expenseDoc.data();

    // Delete from expenses first
    if (expense) {
      const expenseData = {
        amount: expense.amount,
        mode: expense.mode,
        category: expense.category,
        date: expense.date ? toDate(expense.date) : new Date(),
      };
      await syncStaffExpenseToExpense(id, expenseId, expenseData, "delete");
    }

    // Then delete staff expense
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
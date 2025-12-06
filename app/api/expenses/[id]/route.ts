import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { getExpenseById, updateExpense, deleteExpense } from "@/lib/firebase/expenses";
import { syncCustomerChargeToExpense } from "@/lib/firebase/expenses";
import { adminDb } from "@/lib/firebase/admin";

// GET /api/expenses/[id] - Get single expense
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const expense = await getExpenseById(id);

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    return NextResponse.json({ expense });
  } catch (error: any) {
    console.error("Error fetching expense:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch expense" },
      { status: 500 }
    );
  }
}

// PATCH /api/expenses/[id] - Update expense
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const expense = await getExpenseById(id);
    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    const updateData: any = {};

    if (body.date) updateData.date = new Date(body.date);
    if (body.amount !== undefined) updateData.amount = parseFloat(body.amount);
    if (body.category) updateData.category = body.category;
    if (body.description) updateData.description = body.description;
    if (body.receiptUrls) updateData.receiptUrls = body.receiptUrls;
    if (body.yearlySubCategory) updateData.yearlySubCategory = body.yearlySubCategory;
    if (body.financialYear) updateData.financialYear = body.financialYear;

    await updateExpense(id, updateData);

    // Sync back to source if it's from customer
    if (expense.sourceType === "customer" && expense.sourceId && expense.customerId) {
      try {
        await adminDb
          .collection("customers")
          .doc(expense.customerId)
          .collection("extras")
          .doc(expense.sourceId)
          .update({
            description: updateData.description || expense.description,
            amount: updateData.amount || expense.amount,
          });
      } catch (error) {
        console.error("Error syncing back to customer charge:", error);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating expense:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update expense" },
      { status: 500 }
    );
  }
}

// DELETE /api/expenses/[id] - Delete expense
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const expense = await getExpenseById(id);
    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    // Delete from source if it's from customer
    if (expense.sourceType === "customer" && expense.sourceId && expense.customerId) {
      try {
        await adminDb
          .collection("customers")
          .doc(expense.customerId)
          .collection("extras")
          .doc(expense.sourceId)
          .delete();
      } catch (error) {
        console.error("Error deleting customer charge:", error);
      }
    }

    await deleteExpense(id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting expense:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete expense" },
      { status: 500 }
    );
  }
}
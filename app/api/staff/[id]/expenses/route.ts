//app/api/staff/[id]/expenses/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { getStaffExpenses, addStaffExpense } from "@/lib/firebase/staff";
import { syncStaffExpenseToExpense } from "@/lib/firebase/expenses";

// GET /api/staff/[id]/expenses
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!session.user.permissions?.includes("staff.expenses.view")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const expenses = await getStaffExpenses(id);

    return NextResponse.json({ expenses }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching expenses:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch expenses" },
      { status: 500 }
    );
  }
}

// POST /api/staff/[id]/expenses
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!session.user.permissions?.includes("staff.expenses.create")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { amount, mode, category, customCategory, receiptUrl, notes, date } = body;

    if (!amount || !mode || !category || !date) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const expenseData: any = {
      amount: parseFloat(amount),
      mode,
      category,
      date: new Date(date),
    };

    // Only add optional fields if they have values
    if (category === "other" && customCategory) {
      expenseData.customCategory = customCategory;
    }
    if (receiptUrl) {
      expenseData.receiptUrl = receiptUrl;
    }
    if (notes) {
      expenseData.notes = notes;
    }

    const expenseId = await addStaffExpense(id, expenseData);

    // Sync to expenses
    await syncStaffExpenseToExpense(id, expenseId, expenseData, "create");

    return NextResponse.json({ expenseId }, { status: 201 });
  } catch (error: any) {
    console.error("Error adding expense:", error);
    return NextResponse.json(
      { error: error.message || "Failed to add expense" },
      { status: 500 }
    );
  }
}
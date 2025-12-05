import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { getStaffExpenses, addStaffExpense } from "@/lib/firebase/staff";

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

    const expenseData = {
      amount: parseFloat(amount),
      mode,
      category,
      customCategory: category === "other" ? customCategory : undefined,
      receiptUrl: receiptUrl || undefined,
      notes: notes || undefined,
      date: new Date(date),
    };

    const expenseId = await addStaffExpense(id, expenseData);

    return NextResponse.json({ expenseId }, { status: 201 });
  } catch (error: any) {
    console.error("Error adding expense:", error);
    return NextResponse.json(
      { error: error.message || "Failed to add expense" },
      { status: 500 }
    );
  }
}
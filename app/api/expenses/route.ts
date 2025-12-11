import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { getAllExpenses, createExpense } from "@/lib/firebase/expenses";

// GET /api/expenses - List all expenses with filters
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission
    if (!session.user.permissions?.includes("expenses.view")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const customerId = searchParams.get("customerId") || undefined;
    const staffId = searchParams.get("staffId") || undefined;

    const expenses = await getAllExpenses({
      category,
      startDate,
      endDate,
      customerId,
      staffId,
    });

    return NextResponse.json({ expenses });
  } catch (error: any) {
    console.error("Error fetching expenses:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch expenses" },
      { status: 500 }
    );
  }
}

// POST /api/expenses - Create new expense
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission
    if (!session.user.permissions?.includes("expenses.create")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const {
      date,
      amount,
      category,
      mode,
      description,
      receiptUrls,
      yearlySubCategory,
      financialYear,
    } = body;

    if (!date || !amount || !category || !description) {
      return NextResponse.json(
        { error: "Date, amount, category, and description are required" },
        { status: 400 }
      );
    }

    const expenseData: any = {
      date: new Date(date),
      amount: parseFloat(amount),
      category,
      mode: body.mode || "",
      description,
      receiptUrls: receiptUrls || [],
      sourceType: "manual",
      createdBy: session.user.email,
    };

    if (category === "yearly") {
      if (!yearlySubCategory || !financialYear) {
        return NextResponse.json(
          { error: "Yearly expenses require sub-category and financial year" },
          { status: 400 }
        );
      }
      expenseData.yearlySubCategory = yearlySubCategory;
      expenseData.financialYear = financialYear;
    }

    const expenseUid = await createExpense(expenseData);

    return NextResponse.json({
      success: true,
      expense: { uid: expenseUid },
    });
  } catch (error: any) {
    console.error("Create expense error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create expense" },
      { status: 500 }
    );
  }
}
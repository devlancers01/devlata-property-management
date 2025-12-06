//app/api/customers/[id]/charges/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { getExtraCharges, addExtraCharge } from "@/lib/firebase/customers";
import { syncCustomerChargeToExpense } from "@/lib/firebase/expenses";

// GET /api/customers/[id]/charges - Get extra charges
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const charges = await getExtraCharges(id);

    return NextResponse.json({ charges });
  } catch (error: any) {
    console.error("Error fetching extra charges:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch extra charges" },
      { status: 500 }
    );
  }
}

// POST /api/customers/[id]/charges - Add an extra charge
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const body = await req.json();
    const { description, amount, recordInExpenses = true } = body;

    if (!description || !amount || amount <= 0) {
      return NextResponse.json(
        { error: "Description and valid amount are required" },
        { status: 400 }
      );
    }

    const chargeData = {
      description,
      amount,
      date: body?.date || new Date().toISOString().split("T")[0],
      recordInExpenses,
    };

    const chargeUid = await addExtraCharge(id, chargeData);

    // Sync to expenses if toggle is on
    if (recordInExpenses) {
      await syncCustomerChargeToExpense(id, chargeUid, chargeData, "create");
    }

    return NextResponse.json({
      success: true,
      chargeUid,
    });
  } catch (error: any) {
    console.error("Error adding extra charge:", error);
    return NextResponse.json(
      { error: error.message || "Failed to add extra charge" },
      { status: 500 }
    );
  }
}
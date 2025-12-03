import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { getExtraCharges, addExtraCharge } from "@/lib/firebase/customers";


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

    const { id } = await params; // ✅ Await params

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

    const { id } = await params; // ✅ Await params

    const body = await req.json();
    const { description, amount } = body;

    if (!description || !amount || amount <= 0) {
      return NextResponse.json(
        { error: "Description and valid amount are required" },
        { status: 400 }
      );
    }

    // ✅ Build clean charge object (no optional fields for charges)
    const chargeData = {
      description,
      amount,
    };

    const chargeUid = await addExtraCharge(id, chargeData);

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
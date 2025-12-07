import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { getAllSales, createSale } from "@/lib/firebase/sales";

// GET /api/sales - List sales with filters
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission - only admins can view sales
    if (!session.user.permissions?.includes("sales.view")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const customerId = searchParams.get("customerId") || undefined;
    const sourceType = searchParams.get("sourceType") || undefined;
    const financialYear = searchParams.get("financialYear") || undefined;

    const sales = await getAllSales({
      category,
      startDate,
      endDate,
      customerId,
      sourceType,
      financialYear,
    });

    return NextResponse.json({ sales });
  } catch (error: any) {
    console.error("Error fetching sales:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch sales" },
      { status: 500 }
    );
  }
}

// POST /api/sales - Create new manual sale
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission - only admins can create sales
    if (!session.user.permissions?.includes("sales.create")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    // Validate required fields
    const requiredFields = ["date", "amount", "category", "description", "paymentMode"];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Validate amount
    if (body.amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be greater than 0" },
        { status: 400 }
      );
    }

    const saleData = {
      date: new Date(body.date),
      amount: body.amount,
      category: body.category,
      description: body.description,
      paymentMode: body.paymentMode,
      receiptUrls: body.receiptUrls || [],
      sourceType: "manual" as const,
      createdBy: session.user.name || session.user.email,
    };

    const saleUid = await createSale(saleData);

    return NextResponse.json({
      success: true,
      sale: { uid: saleUid },
    });
  } catch (error: any) {
    console.error("Create sale error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create sale" },
      { status: 500 }
    );
  }
}
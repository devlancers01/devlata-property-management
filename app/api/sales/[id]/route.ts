import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { getSaleById, updateSale, deleteSale } from "@/lib/firebase/sales";

// GET /api/sales/[id] - Get single sale
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!session.user.permissions?.includes("sales.view")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const sale = await getSaleById(id);

    if (!sale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    return NextResponse.json({ sale });
  } catch (error: any) {
    console.error("Error fetching sale:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch sale" },
      { status: 500 }
    );
  }
}

// PATCH /api/sales/[id] - Update sale (only manual sales)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!session.user.permissions?.includes("sales.edit")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    // Get existing sale
    const existingSale = await getSaleById(id);
    if (!existingSale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    // Only allow editing manual sales
    if (existingSale.sourceType !== "manual") {
      return NextResponse.json(
        { error: "Cannot edit auto-synced sales. Only manual sales can be edited." },
        { status: 400 }
      );
    }

    // Validate amount if provided
    if (body.amount !== undefined && body.amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be greater than 0" },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (body.date) updateData.date = new Date(body.date);
    if (body.amount !== undefined) updateData.amount = body.amount;
    if (body.category) updateData.category = body.category;
    if (body.description) updateData.description = body.description;
    if (body.paymentMode) updateData.paymentMode = body.paymentMode;
    if (body.receiptUrls !== undefined) updateData.receiptUrls = body.receiptUrls;

    await updateSale(id, updateData);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating sale:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update sale" },
      { status: 500 }
    );
  }
}

// DELETE /api/sales/[id] - Delete sale (only manual sales)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!session.user.permissions?.includes("sales.delete")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    // Get existing sale
    const existingSale = await getSaleById(id);
    if (!existingSale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    // Only allow deleting manual sales
    if (existingSale.sourceType !== "manual") {
      return NextResponse.json(
        { error: "Cannot delete auto-synced sales. Only manual sales can be deleted." },
        { status: 400 }
      );
    }

    await deleteSale(id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting sale:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete sale" },
      { status: 500 }
    );
  }
}
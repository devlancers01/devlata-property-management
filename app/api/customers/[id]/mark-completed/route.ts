import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { adminDb } from "@/lib/firebase/admin";
import { getCustomerById } from "@/lib/firebase/customers";
import { Timestamp } from "firebase-admin/firestore";

// POST /api/customers/[id]/mark-completed - Toggle completed status
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission
    if (!session.user.permissions?.includes("customers.edit")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const customer = await getCustomerById(id);

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Validate business rules
    if (customer.status === "cancelled") {
      return NextResponse.json(
        { error: "Cannot mark cancelled booking as completed" },
        { status: 400 }
      );
    }

    // Check if trying to mark as completed
    const body = await req.json();
    const { action } = body; // "complete" or "undo"

    if (action === "complete") {
      // Validate zero balance
      if (customer.balanceAmount > 0) {
        return NextResponse.json(
          {
            error: `Cannot mark as completed. Pending dues: ₹${customer.balanceAmount.toLocaleString()}`,
          },
          { status: 400 }
        );
      }

      // Mark as completed
      await adminDb.collection("customers").doc(id).update({
        status: "completed",
        completedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      return NextResponse.json({
        success: true,
        message: "Booking marked as completed",
      });
    } else if (action === "undo") {
      // Undo completion (mark as active)
      await adminDb.collection("customers").doc(id).update({
        status: "active",
        completedAt: null,
        updatedAt: Timestamp.now(),
      });

      return NextResponse.json({
        success: true,
        message: "Booking status reverted to active",
      });
    } else {
      return NextResponse.json(
        { error: "Invalid action. Must be 'complete' or 'undo'" },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Error toggling completion status:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update status" },
      { status: 500 }
    );
  }
}
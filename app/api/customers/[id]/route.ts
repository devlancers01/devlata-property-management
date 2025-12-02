import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { getCustomerById, updateCustomer, deleteCustomer } from "@/lib/firebase/customers";

// GET /api/customers/[id] - Get single customer
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

    const customer = await getCustomerById(id);

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ customer });
  } catch (error: any) {
    console.error("Error fetching customer:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch customer" },
      { status: 500 }
    );
  }
}

// PATCH /api/customers/[id] - Update customer
export async function PATCH(
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

    await updateCustomer(id, body);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating customer:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update customer" },
      { status: 500 }
    );
  }
}

// DELETE /api/customers/[id] - Delete customer
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params; // ✅ Await params

    await deleteCustomer(id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting customer:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete customer" },
      { status: 500 }
    );
  }
}
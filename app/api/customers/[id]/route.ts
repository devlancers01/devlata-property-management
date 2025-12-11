import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { getCustomerById, updateCustomer, deleteCustomer, getGroupMembers } from "@/lib/firebase/customers";
import { createBookings, updateBookings, deleteBookings, checkBookingAvailability } from "@/lib/firebase/bookings";

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

    // Check permission
    if (!session.user.permissions?.includes("customers.view")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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


// PATCH - Add this logic
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission
    if (!session.user.permissions?.includes("customers.edit") || !session.user.permissions?.includes("bookings.edit")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    // If dates are being updated, check availability and update bookings
    if (body.checkIn || body.checkOut) {
      const customer = await getCustomerById(id);
      if (!customer) {
        return NextResponse.json({ error: "Customer not found" }, { status: 404 });
      }

      const newCheckIn = body.checkIn ? new Date(body.checkIn) : customer.checkIn;
      const newCheckOut = body.checkOut ? new Date(body.checkOut) : customer.checkOut;

      // Check availability for new dates
      const { available } = await checkBookingAvailability(
        newCheckIn,
        newCheckOut,
        id
      );

      if (!available) {
        return NextResponse.json(
          { error: "Selected dates are not available" },
          { status: 409 }
        );
      }

      // Update bookings
      const members = await getGroupMembers(id);
      const membersCount = members.length + 1;

      await updateBookings(
        id,
        customer.checkIn,
        customer.checkOut,
        newCheckIn,
        newCheckOut,
        membersCount
      );
    }

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

// DELETE - Add booking deletion
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission
    if (!session.user.permissions?.includes("customers.delete") || !session.user.permissions?.includes("bookings.delete")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const customer = await getCustomerById(id);
    if (customer) {
      await deleteBookings(customer.checkIn, customer.checkOut);
    }

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
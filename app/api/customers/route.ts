import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { createCustomer, getAllCustomers } from "@/lib/firebase/customers";

// GET: List all customers with filters
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const startDate = searchParams.get("startDate")
      ? new Date(searchParams.get("startDate")!)
      : undefined;
    const endDate = searchParams.get("endDate")
      ? new Date(searchParams.get("endDate")!)
      : undefined;
    const searchQuery = searchParams.get("search") || undefined;

    const customers = await getAllCustomers({
      status,
      startDate,
      endDate,
      searchQuery,
    });

    return NextResponse.json({ customers });
  } catch (error) {
    console.error("Fetch customers error:", error);
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 }
    );
  }
}

// POST: Create new customer
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permissions
    if (!session.user.permissions.includes("customers.create")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await req.json();

    // Validate required fields
    const requiredFields = [
      "name",
      "phone",
      "email",
      "age",
      "idType",
      "idValue",
      "address",
      "vehicleNumber",
      "checkIn",
      "checkOut",
      "stayCharges",
    ];

    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Set defaults
    const customerData = {
      ...data,
      status: "active",
      checkInTime: data.checkInTime || "12:00",
      checkOutTime: data.checkOutTime || "10:00",
      instructions: data.instructions || "",
      cuisineCharges: data.cuisineCharges || 0,
      extraChargesTotal: 0,
      receivedAmount: data.receivedAmount || 0,
      cancellationCharges: 0,
      createdBy: session.user.id,
    };

    // Calculate totals
    customerData.totalAmount =
      customerData.stayCharges +
      customerData.cuisineCharges +
      customerData.extraChargesTotal;
    customerData.balanceAmount =
      customerData.totalAmount - customerData.receivedAmount;

    const customer = await createCustomer(customerData);

    return NextResponse.json({
      success: true,
      customer,
    });
  } catch (error) {
    console.error("Create customer error:", error);
    return NextResponse.json(
      { error: "Failed to create customer" },
      { status: 500 }
    );
  }
}
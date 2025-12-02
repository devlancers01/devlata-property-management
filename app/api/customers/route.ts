import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { createCustomer, getAllCustomers } from "@/lib/firebase/customers";
// import { checkPermission } from "@/lib/firebase/permissions";

// Helper to convert ISO string to Date
function parseDate(value: any): Date {
  if (value instanceof Date) return value;
  if (typeof value === "string") return new Date(value);
  return new Date();
}

// Helper to remove undefined values
function removeUndefined(obj: any): any {
  const cleaned: any = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      cleaned[key] = obj[key];
    }
  }
  return cleaned;
}

// GET /api/customers - List customers with filters
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const searchQuery = searchParams.get("search") || undefined;

    const customers = await getAllCustomers({
      status,
      startDate,
      endDate,
      searchQuery,
    });

    return NextResponse.json({ customers });
  } catch (error: any) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch customers" },
      { status: 500 }
    );
  }
}

// POST /api/customers - Create new customer
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission
    // const hasPermission = await checkPermission(
    //   session.user.email,
    //   "customers.create"
    // );
    // if (!hasPermission) {
    //   return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    // }

    const body = await req.json();

    // Validate required fields
    const requiredFields = [
      "name",
      "phone",
      "email",
      "age",
      "idType",
      "address",
      "vehicleNumber",
      "checkIn",
      "checkOut",
      "stayCharges",
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Validate ID proof (either idValue OR idProofUrl required)
    if (!body.idValue && !body.idProofUrl) {
      return NextResponse.json(
        { error: "Either ID number or ID proof image is required" },
        { status: 400 }
      );
    }

    // Convert ISO string dates to Date objects
    const customerData = removeUndefined({
      name: body.name,
      phone: body.phone,
      email: body.email,
      age: body.age,
      idType: body.idType,
      idValue: body.idValue || "",
      idProofUrl: body.idProofUrl || "",
      address: body.address,
      vehicleNumber: body.vehicleNumber,
      checkIn: parseDate(body.checkIn),
      checkOut: parseDate(body.checkOut),
      checkInTime: body.checkInTime || "12:00",
      checkOutTime: body.checkOutTime || "10:00",
      instructions: body.instructions || "",
      stayCharges: body.stayCharges,
      cuisineCharges: body.cuisineCharges || 0,
      receivedAmount: body.receivedAmount || 0,
      extraChargesTotal: 0,
      advancePaymentMode: body.advancePaymentMode || "",
      advanceReceiptUrl: body.advanceReceiptUrl || "",
      status: "active",
    });

    // Calculate totals
    customerData.totalAmount =
      customerData.stayCharges +
      customerData.cuisineCharges +
      customerData.extraChargesTotal;
    customerData.balanceAmount =
      customerData.totalAmount - customerData.receivedAmount;

    const customerUid = await createCustomer(customerData);

    return NextResponse.json({
      success: true,
      customer: { uid: customerUid }, // ✅ Return customer ID properly
    });
  } catch (error: any) {
    console.error("Create customer error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create customer" },
      { status: 500 }
    );
  }
}
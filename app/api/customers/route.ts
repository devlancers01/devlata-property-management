import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { addPayment, createCustomer, getAllCustomers } from "@/lib/firebase/customers";
import { checkBookingAvailability, createBookings } from "@/lib/firebase/bookings";
import { syncCustomerPaymentToSale } from "@/lib/firebase/sales"; // ← Add this import

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

    // Check permission
    if (!session.user.permissions?.includes("customers.view")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const searchQuery = searchParams.get("search") || undefined;
    const includeOngoing = searchParams.get("includeOngoing") === "true";

    const customers = await getAllCustomers({
      status,
      startDate,
      endDate,
      searchQuery,
      includeOngoing,
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
    if (!session.user.permissions?.includes("customers.create") || !session.user.permissions?.includes("bookings.create")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    // Validate required fields
    const requiredFields = [
      "name",
      "phone",
      "email",
      "age",
      "gender",
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

    // Validate ID proof
    if (!body.idValue && !body.idProofUrl) {
      return NextResponse.json(
        { error: "Either ID number or ID proof image is required" },
        { status: 400 }
      );
    }

    // Check booking availability
    const checkInDate = parseDate(body.checkIn);
    const checkOutDate = parseDate(body.checkOut);

    const { available } = await checkBookingAvailability(checkInDate, checkOutDate);

    if (!available) {
      return NextResponse.json(
        { error: "Selected dates are not available. Please choose different dates." },
        { status: 409 }
      );
    }

    // Convert ISO string dates to Date objects
    const customerData = removeUndefined({
      name: body.name,
      phone: body.phone,
      email: body.email,
      age: body.age,
      gender: body.gender,
      idType: body.idType,
      idValue: body.idValue || "",
      idProofUrl: body.idProofUrl || "",
      address: body.address,
      vehicleNumber: body.vehicleNumber,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      checkInTime: body.checkInTime || "12:00",
      checkOutTime: body.checkOutTime || "10:00",
      instructions: body.instructions || "",
      stayCharges: body.stayCharges,
      cuisineCharges: body.cuisineCharges || 0,
      receivedAmount: 0,
      extraChargesTotal: 0,
      status: "active",
    });

    // Calculate totals
    customerData.totalAmount =
      customerData.stayCharges +
      customerData.cuisineCharges +
      customerData.extraChargesTotal;
    customerData.balanceAmount = customerData.totalAmount;

    const customerUid = await createCustomer(customerData);

    // Create bookings
    const membersCount = (body.members?.length || 0) + 1;
    await createBookings(customerUid, checkInDate, checkOutDate, membersCount);

    // Add advance payment if present
    if (body.receivedAmount && body.receivedAmount > 0) {
      const paymentId = await addPayment(customerUid, {
        amount: body.receivedAmount,
        mode: body.advancePaymentMode || "cash",
        type: "advance",
        notes: "Advance payment",
        receiptUrl: body.advanceReceiptUrl || "",
      });

      // ✅ Sync advance payment to sales
      try {
        await syncCustomerPaymentToSale(
          customerUid,
          paymentId,
          {
            amount: body.receivedAmount,
            mode: body.advancePaymentMode || "cash",
            type: "advance",
            date: new Date(), // Current date
            notes: "Advance payment",
          },
          "create"
        );
      } catch (saleError) {
        console.error("Error syncing advance payment to sales:", saleError);
        // Don't fail customer creation if sale sync fails
      }
    }

    return NextResponse.json({
      success: true,
      customer: { uid: customerUid },
    });
  } catch (error: any) {
    console.error("Create customer error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create customer" },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { getAllStaff, createStaff } from "@/lib/firebase/staff";

// GET /api/staff - List all staff with filters
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission
    if (!session.user.permissions?.includes("staff.view")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const designation = searchParams.get("designation") || undefined;
    const searchQuery = searchParams.get("search") || undefined;

    const staff = await getAllStaff({
      status,
      designation,
      searchQuery,
    });

    return NextResponse.json({ staff }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching staff:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch staff" },
      { status: 500 }
    );
  }
}

// POST /api/staff - Create new staff member
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission
    if (!session.user.permissions?.includes("staff.create")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const {
      name,
      age,
      gender,
      phone,
      alternatePhone,
      idProofType,
      idProofValue,
      idProofUrl,
      designation,
      customDesignation,
      monthlySalary,
      joiningDate,
      leavingDate,
      status,
      notes,
    } = body;

    // Validate required fields
    if (!name || !age || !gender || !phone || !designation || !joiningDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate phone format
    const phoneRegex = /^[0-9+\-\s()]+$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { error: "Invalid phone number format" },
        { status: 400 }
      );
    }

    const staffData = {
      name,
      age: parseInt(age),
      gender,
      phone,
      alternatePhone: alternatePhone || undefined,
      idProofType: idProofType || undefined,
      idProofValue: idProofValue || undefined,
      idProofUrl: idProofUrl || undefined,
      designation,
      customDesignation: designation === "Other" ? customDesignation : undefined,
      monthlySalary: monthlySalary ? parseFloat(monthlySalary) : undefined,
      joiningDate: new Date(joiningDate),
      leavingDate: leavingDate ? new Date(leavingDate) : undefined,
      status: status || "active",
      notes: notes || undefined,
    };

    const staffId = await createStaff(staffData);

    return NextResponse.json({ staff: { uid: staffId } }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating staff:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create staff" },
      { status: 500 }
    );
  }
}
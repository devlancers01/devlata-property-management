import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { getStaffById, updateStaff, deleteStaff } from "@/lib/firebase/staff";

// GET /api/staff/[id] - Get single staff member
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!session.user.permissions?.includes("staff.view")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const staff = await getStaffById(id);

    if (!staff) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    }

    return NextResponse.json({ staff }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching staff:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch staff" },
      { status: 500 }
    );
  }
}

// PATCH /api/staff/[id] - Update staff member
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!session.user.permissions?.includes("staff.edit")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    const updateData: any = {};

    if (body.name) updateData.name = body.name;
    if (body.age) updateData.age = parseInt(body.age);
    if (body.gender) updateData.gender = body.gender;
    if (body.phone) updateData.phone = body.phone;
    if (body.alternatePhone !== undefined) updateData.alternatePhone = body.alternatePhone;
    if (body.idProofType !== undefined) updateData.idProofType = body.idProofType;
    if (body.idProofValue !== undefined) updateData.idProofValue = body.idProofValue;
    if (body.idProofUrl !== undefined) updateData.idProofUrl = body.idProofUrl;
    if (body.designation) {
      updateData.designation = body.designation;
      updateData.customDesignation =
        body.designation === "Other" ? body.customDesignation : undefined;
    }
    if (body.monthlySalary !== undefined)
      updateData.monthlySalary = body.monthlySalary ? parseFloat(body.monthlySalary) : undefined;
    if (body.joiningDate) updateData.joiningDate = new Date(body.joiningDate);
    if (body.leavingDate) updateData.leavingDate = new Date(body.leavingDate);
    if (body.status) updateData.status = body.status;
    if (body.notes !== undefined) updateData.notes = body.notes;

    await updateStaff(id, updateData);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("Error updating staff:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update staff" },
      { status: 500 }
    );
  }
}

// DELETE /api/staff/[id] - Delete staff member
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!session.user.permissions?.includes("staff.delete")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    await deleteStaff(id);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("Error deleting staff:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete staff" },
      { status: 500 }
    );
  }
}
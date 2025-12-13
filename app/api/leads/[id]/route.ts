import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { adminDb } from "@/lib/firebase/admin";
import { Timestamp } from "firebase-admin/firestore";

// Helper to convert Timestamp to Date
function toDate(value: any): Date {
  if (value instanceof Date) return value;
  if (value && typeof value === "object" && "toDate" in value) {
    return value.toDate();
  }
  if (typeof value === "string") return new Date(value);
  return new Date();
}

// GET /api/leads/[id] - Get single lead
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!session.user.permissions?.includes("leads.view")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const doc = await adminDb.collection("leads").doc(id).get();

    if (!doc.exists) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const data = doc.data();
    const lead = {
      uid: doc.id,
      ...data,
      createdAt: toDate(data?.createdAt),
      updatedAt: toDate(data?.updatedAt),
    };

    return NextResponse.json({ lead });
  } catch (error: any) {
    console.error("Error fetching lead:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch lead" },
      { status: 500 }
    );
  }
}

// PATCH /api/leads/[id] - Update lead
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!session.user.permissions?.includes("leads.edit")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    const updateData: any = {
      updatedAt: Timestamp.now(),
    };

    if (body.name) updateData.name = body.name;
    if (body.email) updateData.email = body.email;
    if (body.phone) updateData.phone = body.phone;
    if (body.checkInDate !== undefined) updateData.checkInDate = body.checkInDate;
    if (body.checkOutDate !== undefined) updateData.checkOutDate = body.checkOutDate;
    if (body.numberOfGuests !== undefined) updateData.numberOfGuests = body.numberOfGuests;
    if (body.source) updateData.source = body.source;
    if (body.status) updateData.status = body.status;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.budget !== undefined) updateData.budget = body.budget;
    if (body.convertedToCustomerId) updateData.convertedToCustomerId = body.convertedToCustomerId;

    await adminDb.collection("leads").doc(id).update(updateData);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating lead:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update lead" },
      { status: 500 }
    );
  }
}

// DELETE /api/leads/[id] - Delete lead
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!session.user.permissions?.includes("leads.delete")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    await adminDb.collection("leads").doc(id).delete();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting lead:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete lead" },
      { status: 500 }
    );
  }
}
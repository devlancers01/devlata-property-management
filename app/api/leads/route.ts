import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { adminDb } from "@/lib/firebase/admin";
import { Lead, LeadCreateInput } from "@/models/lead.model";
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

// GET /api/leads - Get all leads
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission
    if (!session.user.permissions?.includes("leads.view")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    let query = adminDb.collection("leads").orderBy("createdAt", "desc");

    if (status) {
      query = query.where("status", "==", status) as any;
    }

    const snapshot = await query.get();

    const leads: Lead[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        uid: doc.id,
        ...data,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      } as Lead;
    });

    return NextResponse.json({ leads });
  } catch (error: any) {
    console.error("Error fetching leads:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch leads" },
      { status: 500 }
    );
  }
}

// POST /api/leads - Create new lead
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission
    if (!session.user.permissions?.includes("leads.create")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body: LeadCreateInput = await req.json();

    // Validate required fields
    if (!body.name || !body.email || !body.phone || !body.source) {
      return NextResponse.json(
        { error: "Name, email, phone, and source are required" },
        { status: 400 }
      );
    }

    const leadData = {
      name: body.name,
      email: body.email,
      phone: body.phone,
      checkInDate: body.checkInDate || null,
      checkOutDate: body.checkOutDate || null,
      numberOfGuests: body.numberOfGuests || null,
      source: body.source,
      status: "new",
      notes: body.notes || "",
      budget: body.budget || null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const leadRef = await adminDb.collection("leads").add(leadData);

    return NextResponse.json({
      success: true,
      leadId: leadRef.id,
    });
  } catch (error: any) {
    console.error("Error creating lead:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create lead" },
      { status: 500 }
    );
  }
}
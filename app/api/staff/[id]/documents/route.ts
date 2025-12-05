import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { getStaffDocuments, addStaffDocument } from "@/lib/firebase/staff";

// GET /api/staff/[id]/documents
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!session.user.permissions?.includes("staff.documents.view")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const documents = await getStaffDocuments(id);

    return NextResponse.json({ documents }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching documents:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch documents" },
      { status: 500 }
    );
  }
}

// POST /api/staff/[id]/documents
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!session.user.permissions?.includes("staff.documents.create")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { description, documentUrl } = body;

    if (!description || !documentUrl) {
      return NextResponse.json(
        { error: "Description and document URL are required" },
        { status: 400 }
      );
    }

    const documentId = await addStaffDocument(id, {
      description,
      documentUrl,
    });

    return NextResponse.json({ documentId }, { status: 201 });
  } catch (error: any) {
    console.error("Error adding document:", error);
    return NextResponse.json(
      { error: error.message || "Failed to add document" },
      { status: 500 }
    );
  }
}
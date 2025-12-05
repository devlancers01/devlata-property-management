import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { deleteStaffDocument } from "@/lib/firebase/staff";

// DELETE /api/staff/[id]/documents/[documentId]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; documentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!session.user.permissions?.includes("staff.documents.delete")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id, documentId } = await params;

    await deleteStaffDocument(id, documentId);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("Error deleting document:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete document" },
      { status: 500 }
    );
  }
}